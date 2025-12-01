import { FetchManager } from "../managers/fetchManager";
import { getSlugFromPath } from "./lib";

export interface CreateSyncNotificationParams {
  exerciseSlug: string;
  sourceLanguage: string;
}

export interface SyncNotificationResponse {
  status: string;
  notification?: {
    id: string;
    sourceLanguage: string;
    createdAt: number;
    updatedAt: number;
    status: string;
  };
  error?: string;
}

/**
 * Creates a sync notification for a lesson when its README is modified
 */
export const createSyncNotification = async (
  params: CreateSyncNotificationParams
): Promise<SyncNotificationResponse> => {
  try {
    const courseSlug = getSlugFromPath();
    
    if (!courseSlug) {
      throw new Error("Course slug not found");
    }

    const url = `${FetchManager.HOST}/courses/${courseSlug}/lessons/${params.exerciseSlug}/sync-notification`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        sourceLanguage: params.sourceLanguage 
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create sync notification");
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Error in createSyncNotification:", error);
    throw error;
  }
};

/**
 * Fetches all sync notifications for the current course
 */
export const fetchSyncNotifications = async (): Promise<any> => {
  try {
    const courseSlug = getSlugFromPath();
    
    if (!courseSlug) {
      throw new Error("Course slug not found");
    }

    const url = `${FetchManager.HOST}/courses/${courseSlug}/sync-notifications`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json" 
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch sync notifications");
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error fetching sync notifications:", error);
    throw error;
  }
};

/**
 * Dismisses a sync notification
 */
export const dismissSyncNotification = async (
  notificationId: string,
  lessonSlug: string
): Promise<void> => {
  try {
    const courseSlug = getSlugFromPath();
    
    if (!courseSlug) {
      throw new Error("Course slug not found");
    }

    const url = `${FetchManager.HOST}/courses/${courseSlug}/lessons/${lessonSlug}/sync-notification/${notificationId}`;
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json" 
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to dismiss notification");
    }
    
  } catch (error) {
    console.error("Error dismissing notification:", error);
    throw error;
  }
};

/**
 * Accepts a sync notification and starts the synchronization process
 */
export const acceptSyncNotification = async (
  notificationId: string,
  lessonSlug: string,
  rigoToken: string
): Promise<void> => {
  try {
    const courseSlug = getSlugFromPath();
    
    if (!courseSlug) {
      throw new Error("Course slug not found");
    }

    const url = `${FetchManager.HOST}/courses/${courseSlug}/lessons/${lessonSlug}/sync-notification/${notificationId}/accept`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-rigo-token": rigoToken
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to start synchronization");
    }
    
  } catch (error) {
    console.error("Error accepting sync notification:", error);
    throw error;
  }
};

