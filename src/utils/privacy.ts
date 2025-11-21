import { TUser } from './storeTypes';

/**
 * Base structure for data that contains user information and tokens
 */
interface BaseUserData {
  user?: TUser;
  token?: string;
  rigoToken?: string;
  rigobot?: {
    key?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown; // Allow additional properties
}

/**
 * Sanitized version of user data for logging
 */
interface SanitizedUserData {
  user?: { id: number } | null;
  token?: string;
  rigoToken?: string;
  rigobot?: {
    key?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Sanitizes user data for logging by removing personally identifiable information (PII)
 * to comply with FERPA and other privacy regulations.
 * 
 * Only includes the user ID, excluding:
 * - email
 * - first_name
 * - last_name
 * - profile (avatar_url, etc.)
 * 
 * @param user - User object to sanitize
 * @returns Sanitized object with only the ID, or null if user is null/undefined
 */
export const sanitizeUserForLogging = (user: TUser | null | undefined): { id: number } | null => {
  if (!user) return null;
  
  return {
    id: user.id,
    // Do not include: email, first_name, last_name, profile, etc.
  };
};

/**
 * Sanitizes session data for logging by removing personally identifiable information (PII)
 * to comply with FERPA and other privacy regulations.
 * 
 * @param sessionData - Session data to sanitize
 * @returns Sanitized session data
 */
export const sanitizeSessionForLogging = (sessionData: BaseUserData | null | undefined): SanitizedUserData | null => {
  if (!sessionData) return null;
  
  const sanitized: SanitizedUserData = { ...sessionData };
  
  // Sanitize user information if it exists
  if (sanitized.user && 'id' in sanitized.user) {
    sanitized.user = sanitizeUserForLogging(sanitized.user as TUser);
  }
  
  // Remove sensitive tokens and credentials
  if (sanitized.token) {
    sanitized.token = '[REDACTED]';
  }
  
  if (sanitized.rigobot?.key) {
    sanitized.rigobot = {
      ...sanitized.rigobot,
      key: '[REDACTED]',
    };
  }
  
  if (sanitized.rigoToken) {
    sanitized.rigoToken = '[REDACTED]';
  }
  
  return sanitized;
};

/**
 * Sanitizes login data for logging by removing personally identifiable information (PII)
 * to comply with FERPA and other privacy regulations.
 * 
 * @param loginData - Login data to sanitize
 * @returns Sanitized login data
 */
export const sanitizeLoginDataForLogging = (loginData: BaseUserData | null | undefined): SanitizedUserData | null => {
  if (!loginData) return null;
  
  const sanitized: SanitizedUserData = { ...loginData };
  
  // Sanitize user information if it exists
  if (sanitized.user && 'id' in sanitized.user) {
    sanitized.user = sanitizeUserForLogging(sanitized.user as TUser);
  }
  
  // Remove sensitive tokens and credentials
  if (sanitized.token) {
    sanitized.token = '[REDACTED]';
  }
  
  if (sanitized.rigoToken) {
    sanitized.rigoToken = '[REDACTED]';
  }
  
  if (sanitized.rigobot?.key) {
    sanitized.rigobot = {
      ...sanitized.rigobot,
      key: '[REDACTED]',
    };
  }
  
  return sanitized;
};

