import { ITelemetryJSONSchema } from "../managers/telemetry";

/**
 * Utilities for sanitizing PII data before storing it in localStorage
 * according to FERPA policies
 */

/**
 * PII fields that should be removed from the session
 */
const SESSION_PII_FIELDS = [
  'email',           // Root level of session
] as const;

/**
 * PII fields that should be removed from the user object within session
 */
const USER_PII_FIELDS = [
  'email',
  'first_name',
  'last_name',
  'username',
] as const;

/**
 * Value used to mask PII fields in telemetry
 */
const REDACTED_VALUE = '[REDACTED]';

/**
 * Removes PII fields from the session object before storing it in localStorage.
 * Removes fields instead of masking them because the session is not read
 * directly from localStorage (it's obtained from the API when needed).
 * 
 * @param sessionData - Complete session object with user data
 * @returns New session object without PII fields
 */
export function removePIIFromSession(sessionData: Record<string, unknown> | null | undefined): Record<string, unknown> | null | undefined {
  if (!sessionData || typeof sessionData !== 'object') {
    return sessionData;
  }

  const cleaned = { ...sessionData };

  // Remove PII fields from root level
  SESSION_PII_FIELDS.forEach(field => {
    delete cleaned[field];
  });

  // Remove PII fields from user object if it exists
  if (cleaned.user && typeof cleaned.user === 'object') {
    const cleanedUser = { ...cleaned.user as Record<string, unknown> };
    
    // Remove specific user PII fields
    USER_PII_FIELDS.forEach(field => {
      delete cleanedUser[field];
    });

    // Remove github object completely if it exists (contains name which is PII)
    if (cleanedUser.github) {
      delete cleanedUser.github;
    }

    cleaned.user = cleanedUser;
  }

  return cleaned;
}

/**
 * Sanitizes telemetry data before storing it in localStorage.
 * Masks fullname instead of removing it because it's read from localStorage
 * and the object structure needs to be maintained.
 * 
 * @param telemetryData - Complete telemetry object
 * @returns New telemetry object with PII fields masked
 */
export function sanitizeTelemetry(telemetryData: ITelemetryJSONSchema | null | undefined): ITelemetryJSONSchema | null | undefined {
  if (!telemetryData || typeof telemetryData !== 'object') {
    return telemetryData;
  }

  const sanitized = { ...telemetryData };

  // Mask fullname if it exists
  if ('fullname' in sanitized && sanitized.fullname) {
    sanitized.fullname = REDACTED_VALUE;
  }

  return sanitized;
}

/**
 * Sanitizes data before storing it in localStorage according to the data type.
 * Wrapper function that determines which sanitization to apply.
 * 
 * @param key - localStorage key
 * @param data - Data to sanitize
 * @returns Sanitized data according to the type
 */
export function sanitizeForLocalStorage(key: string, data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Apply specific sanitization based on the key
  if (key === 'session') {
    return removePIIFromSession(data as Record<string, unknown>);
  }

  // For telemetry, the key may vary but always contains "TELEMETRY"
  // or can be detected by the object structure
  if (key.includes('TELEMETRY') || ((data as Record<string, unknown>).slug && (data as Record<string, unknown>).steps)) {
    return sanitizeTelemetry(data as ITelemetryJSONSchema);
  }

  // By default, return unchanged
  // (you can add more cases here in the future)
  return data;
}

