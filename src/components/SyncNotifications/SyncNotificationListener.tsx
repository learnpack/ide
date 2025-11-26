import { useEffect, useRef, useCallback } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

// Buffer to store events that arrive before syncNotifications is initialized
interface BufferedEvent {
  type: string;
  data: unknown;
}
const eventBuffer: BufferedEvent[] = [];

export default function SyncNotificationListener() {
  const { t } = useTranslation();
  const config = useStore((state) => state.configObject);
  const syncNotifications = useStore((state) => state.syncNotifications);
  const getSyncNotifications = useStore((state) => state.getSyncNotifications);
  const fetchExercises = useStore((state) => state.fetchExercises);
  const getSidebar = useStore((state) => state.getSidebar);
  const processedBufferRef = useRef(false);
  const componentMountedRef = useRef(false);
  
  // Track when component mounts to know if notifications should be loaded
  useEffect(() => {
    // After 3 seconds, assume notifications should be loaded (start() should have completed)
    const timeout = setTimeout(() => {
      componentMountedRef.current = true;
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Helper function to process sync notification events
  const processSyncEvent = useCallback(
    (eventType: string, data: unknown) => {
      switch (eventType) {
        case "sync-notification-created":
          // Refresh notifications to get the new one
          getSyncNotifications();
          break;

        case "sync-notification-started":
          // Update notification status to processing
          getSyncNotifications();
          break;

        case "sync-notification-progress":
          // Update progress in real-time
          getSyncNotifications();
          break;

        case "sync-notification-completed":
          // Finalize and refresh
          getSyncNotifications().then(() => {
            const { syncNotifications: currentNotifications } = useStore.getState();
            const eventData = data as { notificationId?: string; completed?: number; failed?: number };
            const notification = currentNotifications.find((n) => n.id === eventData.notificationId);

            if (notification) {
              const completed = eventData.completed || 0;
              const failed = eventData.failed || 0;

              if (failed === 0) {
                toast.success(t("sync-completed"), { duration: 6000 });
              } else if (completed > 0) {
                toast.error(t("sync-partial-error"), { duration: 6000 });
              } else {
                toast.error(t("sync-error"), { duration: 6000 });
              }

              // Refresh exercises to show updated content
              setTimeout(async () => {
                await fetchExercises();
                await getSidebar();
              }, 1000);
            }
          });
          break;

        case "sync-notification-error":
          // Show error and refresh
          getSyncNotifications();
          toast.error(t("sync-error"), { duration: 6000 });
          break;

        case "sync-notification-language-failed":
          // Update progress to show failed language
          getSyncNotifications();
          break;

        default:
          console.warn(`Unknown sync event type: ${eventType}`);
      }
    },
    [getSyncNotifications, fetchExercises, getSidebar, t]
  );

  // Process buffered events when syncNotifications becomes available
  // Optimized approach: reactive effect + fallback interval only when needed
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkAndProcessBuffer = (): boolean => {
      // Process buffer if we have buffered events and haven't processed them yet
      // We process even if syncNotifications is empty, because the change indicates
      // that getSyncNotifications() was called and notifications were loaded
      if (eventBuffer.length > 0 && !processedBufferRef.current) {
        processedBufferRef.current = true;

        // Process each buffered event
        const eventsToProcess = [...eventBuffer];
        eventBuffer.length = 0; // Clear buffer

        // Process events sequentially - each will get the latest state
        eventsToProcess.forEach((event) => {
          processSyncEvent(event.type, event.data);
        });

        // Clear interval after processing - no need to keep checking
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }

        return true; // Signal that processing happened
      }

      return false; // No processing happened
    };

    // Primary: React to syncNotifications changes (reactive approach)
    // This triggers immediately when syncNotifications changes (even if empty)
    // The change indicates that getSyncNotifications() was called
    checkAndProcessBuffer();

    // Fallback: Check periodically only if there are buffered events
    // Use 2 seconds interval as fallback for edge cases
    // This handles race conditions where events arrive before syncNotifications is loaded
    if (eventBuffer.length > 0) {
      intervalId = setInterval(() => {
        if (checkAndProcessBuffer() && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [syncNotifications, processSyncEvent]);

  useEffect(() => {
    if (!config?.config?.slug) {
      return;
    }

    const handleSyncNotificationCreated = async (data: {
      exerciseSlug: string;
      sourceLanguage: string;
      notificationId: string;
    }) => {
      const currentNotifications = useStore.getState().syncNotifications;
      
      // Buffer event if component just mounted and notifications haven't loaded yet
      if (!componentMountedRef.current && currentNotifications.length === 0) {
        eventBuffer.push({ type: "sync-notification-created", data });
        processedBufferRef.current = false;
        return;
      }
      
      processSyncEvent("sync-notification-created", data);
    };

    const handleSyncNotificationStarted = async (data: {
      exerciseSlug: string;
      notificationId: string;
      totalLanguages: number;
    }) => {
      const currentNotifications = useStore.getState().syncNotifications;
      
      if (!componentMountedRef.current && currentNotifications.length === 0) {
        eventBuffer.push({ type: "sync-notification-started", data });
        processedBufferRef.current = false;
        return;
      }
      
      processSyncEvent("sync-notification-started", data);
    };

    const handleSyncNotificationProgress = async (data: {
      exerciseSlug: string;
      notificationId: string;
      currentLanguage: string;
      completed: number;
      total: number;
    }) => {
      const currentNotifications = useStore.getState().syncNotifications;
      
      if (!componentMountedRef.current && currentNotifications.length === 0) {
        eventBuffer.push({ type: "sync-notification-progress", data });
        processedBufferRef.current = false;
        return;
      }
      
      processSyncEvent("sync-notification-progress", data);
    };

    const handleSyncNotificationCompleted = async (data: {
      exerciseSlug: string;
      notificationId: string;
      status: string;
      completed: number;
      failed: number;
    }) => {
      const currentNotifications = useStore.getState().syncNotifications;
      
      if (!componentMountedRef.current && currentNotifications.length === 0) {
        eventBuffer.push({ type: "sync-notification-completed", data });
        processedBufferRef.current = false;
        return;
      }
      
      processSyncEvent("sync-notification-completed", data);
    };

    const handleSyncNotificationError = async (data: {
      exerciseSlug: string;
      notificationId: string;
      error: string;
    }) => {
      const currentNotifications = useStore.getState().syncNotifications;
      
      if (!componentMountedRef.current && currentNotifications.length === 0) {
        eventBuffer.push({ type: "sync-notification-error", data });
        processedBufferRef.current = false;
        return;
      }
      
      processSyncEvent("sync-notification-error", data);
    };

    const handleSyncNotificationLanguageFailed = async (data: {
      exerciseSlug: string;
      notificationId: string;
      language: string;
      error: string;
    }) => {
      const currentNotifications = useStore.getState().syncNotifications;
      
      if (!componentMountedRef.current && currentNotifications.length === 0) {
        eventBuffer.push({ type: "sync-notification-language-failed", data });
        processedBufferRef.current = false;
        return;
      }
      
      processSyncEvent("sync-notification-language-failed", data);
    };

    socketClient.connect();
    socketClient.on("sync-notification-created", handleSyncNotificationCreated);
    socketClient.on("sync-notification-started", handleSyncNotificationStarted);
    socketClient.on("sync-notification-progress", handleSyncNotificationProgress);
    socketClient.on("sync-notification-completed", handleSyncNotificationCompleted);
    socketClient.on("sync-notification-error", handleSyncNotificationError);
    socketClient.on("sync-notification-language-failed", handleSyncNotificationLanguageFailed);
    socketClient.emit("register", { courseSlug: config.config.slug });

    return () => {
      socketClient.off("sync-notification-created", handleSyncNotificationCreated);
      socketClient.off("sync-notification-started", handleSyncNotificationStarted);
      socketClient.off("sync-notification-progress", handleSyncNotificationProgress);
      socketClient.off("sync-notification-completed", handleSyncNotificationCompleted);
      socketClient.off("sync-notification-error", handleSyncNotificationError);
      socketClient.off("sync-notification-language-failed", handleSyncNotificationLanguageFailed);
      socketClient.disconnect();
      // Clear buffer on cleanup
      eventBuffer.length = 0;
      processedBufferRef.current = false;
    };
    // eslint-disable-next-line
  }, [config?.config?.slug, processSyncEvent]);

  return null; // Component without UI, only logic
}

