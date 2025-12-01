import { useEffect, useRef, useCallback } from "react";
import useStore from "../../utils/store";
import CreatorSocket from "../../managers/creatorSocket";
import { DEV_MODE } from "../../utils/lib";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getLanguageName } from "../../utils/lib";
import i18n from "../../utils/i18n";

const socketClient = new CreatorSocket(DEV_MODE ? "http://localhost:3000" : "");

// Buffer to store events that arrive before pendingTranslations is initialized
const eventBuffer: Array<{ exercise: string; language: string }> = [];

export default function TranslationListener() {
  const { t } = useTranslation();
  const config = useStore((state) => state.configObject);
  const pendingTranslations = useStore((state) => state.pendingTranslations);
  const setPendingTranslations = useStore((state) => state.setPendingTranslations);
  const fetchExercises = useStore((state) => state.fetchExercises);
  const getSidebar = useStore((state) => state.getSidebar);
  const processedBufferRef = useRef(false);

  // Helper function to process completion (wrapped in useCallback)
  const processTranslationCompletion = useCallback((
    langCode: string
  ) => {
    // Use functional update to always get the latest state
    setPendingTranslations((prevPending) => {
      const translation = prevPending.find(t => t.code === langCode);
      
      if (!translation) {
        return prevPending;
      }
      
      const completedExercises = (translation.completedExercises || 0) + 1;
      const totalExercises = translation.totalExercises || 1;
      
      const updatedPending = prevPending.map(t => 
        t.code === langCode 
          ? { ...t, completedExercises }
          : t
      );
      
      // If all exercises completed for this language
      if (completedExercises >= totalExercises) {
        // Wait a bit and then refresh
        setTimeout(async () => {
          await fetchExercises();
          await getSidebar();
          
          // Remove from pending translations using functional update
          setPendingTranslations((finalPending) => 
            finalPending.filter(t => t.code !== langCode)
          );
          
          toast.success(
            t("translationCompleted", { language: getLanguageName(langCode, i18n.language) }), 
            { duration: 6000 }
          );
        }, 1000);
      }
      
      return updatedPending;
    });
  }, [setPendingTranslations, fetchExercises, getSidebar, t]);

  // Process buffered events when pendingTranslations becomes available
  // Optimized approach: reactive effect + fallback interval only when needed
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkAndProcessBuffer = (): boolean => {
      // If we have pending translations and buffered events, process them
      if (pendingTranslations.length > 0 && eventBuffer.length > 0 && !processedBufferRef.current) {
        processedBufferRef.current = true;
        
        // Process each buffered event
        const eventsToProcess = [...eventBuffer];
        eventBuffer.length = 0; // Clear buffer
        
        // Process events sequentially - each will get the latest state
        eventsToProcess.forEach(event => {
          const { language: langCode } = event;
          processTranslationCompletion(langCode);
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
    
    // Primary: React to pendingTranslations changes (reactive approach)
    // This triggers immediately when pendingTranslations changes from empty to non-empty
    checkAndProcessBuffer();
    
    // Fallback: Check periodically only if there are buffered events
    // Use 2 seconds interval as fallback for edge cases
    // This handles race conditions where events arrive before pendingTranslations is set
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
  }, [pendingTranslations, processTranslationCompletion]);

  useEffect(() => {
    if (!config?.config?.slug) {
      return;
    }

    const handleTranslationCompleted = async (data: { exercise: string; language: string }) => {
      const { language: langCode } = data;
      const currentPending = useStore.getState().pendingTranslations;
      
      // If no pending translations yet, buffer the event
      if (currentPending.length === 0) {
        eventBuffer.push(data);
        processedBufferRef.current = false; // Reset flag so buffer can be processed
        return;
      }
      
      // Process immediately - functional update will get latest state
      processTranslationCompletion(langCode);
    };

    const handleTranslationError = (data: { exercise: string; language?: string; error: string }) => {
      
      const { language: langCode, error: errorMsg } = data;
      if (langCode) {
        const currentPending = useStore.getState().pendingTranslations;
        setPendingTranslations(
          currentPending.map(t =>
            t.code === langCode ? { ...t, status: "error", error: errorMsg } : t
          )
        );
        toast.error(t("translationError", { language: langCode, error: errorMsg }));
      }
    };

    socketClient.connect();
    socketClient.on("translation-completed", handleTranslationCompleted);
    socketClient.on("translation-error", handleTranslationError);
    socketClient.emit("register", { courseSlug: config.config.slug });

    return () => {
      socketClient.off("translation-completed", handleTranslationCompleted);
      socketClient.off("translation-error", handleTranslationError);
      socketClient.disconnect();
      // Clear buffer on cleanup
      eventBuffer.length = 0;
      processedBufferRef.current = false;
    };
    // eslint-disable-next-line
  }, [config?.config?.slug, processTranslationCompletion, setPendingTranslations, t]);

  return null; // Component without UI, only logic
}

