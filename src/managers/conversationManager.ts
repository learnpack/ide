import { LocalStorage } from "./localStorage";

export interface Message {
  type: "user" | "bot";
  text: string;
  timestamp: number;
}

export interface Conversation {
  key: string;
  messages: Message[];
  expires_at: number;
  last_modified: number;
}

export class ConversationManager {
  private static readonly STORAGE_KEY = "conversations";
  private static readonly EXPIRY_DAYS = 5;

  static generateKey(courseSlug: string, exerciseSlug: string, language: string): string {
    return `${courseSlug}-${exerciseSlug}-${language}`;
  }

  static getConversation(key: string): Conversation | null {
    try {
      const conversations = LocalStorage.get(this.STORAGE_KEY) || {};
      const conversation = conversations[key];
      
      if (!conversation) {
        return null;
      }

      // Check if conversation has expired
      if (Date.now() > conversation.expires_at) {
        this.deleteConversation(key);
        return null;
      }

      return conversation;
    } catch (error) {
      console.error("Error getting conversation:", error);
      return null;
    }
  }

  static saveConversation(key: string, messages: Message[]): void {
    try {
      const conversations = LocalStorage.get(this.STORAGE_KEY) || {};
      const now = Date.now();
      const expires_at = now + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      conversations[key] = {
        key,
        messages,
        expires_at,
        last_modified: now,
      };

      LocalStorage.set(this.STORAGE_KEY, conversations);
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }

  static addMessage(key: string, message: Message): void {
    try {
      const conversation = this.getConversation(key) || {
        key,
        messages: [],
        expires_at: 0,
        last_modified: 0,
      };

      conversation.messages.push(message);
      conversation.last_modified = Date.now();
      conversation.expires_at = conversation.last_modified + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      this.saveConversation(key, conversation.messages);
    } catch (error) {
      console.error("Error adding message:", error);
    }
  }

  static deleteConversation(key: string): void {
    try {
      const conversations = LocalStorage.get(this.STORAGE_KEY) || {};
      delete conversations[key];
      LocalStorage.set(this.STORAGE_KEY, conversations);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }

  static cleanupExpiredConversations(): void {
    try {
      const conversations = LocalStorage.get(this.STORAGE_KEY) || {};
      const now = Date.now();
      let hasChanges = false;

      Object.keys(conversations).forEach(key => {
        if (conversations[key].expires_at < now) {
          delete conversations[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        LocalStorage.set(this.STORAGE_KEY, conversations);
      }
    } catch (error) {
      console.error("Error cleaning up expired conversations:", error);
    }
  }

  static getAllConversations(): Conversation[] {
    try {
      this.cleanupExpiredConversations();
      const conversations = LocalStorage.get(this.STORAGE_KEY) || {};
      return Object.values(conversations);
    } catch (error) {
      console.error("Error getting all conversations:", error);
      return [];
    }
  }
}
