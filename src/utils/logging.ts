import axios from "axios";

/**
 * Helpers for logging errors to the console without exposing credentials.
 *
 * An axios error object carries `config.headers` (holding `Authorization` or
 * `x-rigo-token`), `request` and `response.headers`. Dumping it whole with
 * `console.error("...", error)` publishes the user's token to the devtools.
 * `describeError` keeps only what is useful for diagnosis.
 */

export type TSafeErrorInfo = {
  message: string;
  name?: string;
  status?: number;
  statusText?: string;
  method?: string;
  url?: string;
  data?: unknown;
  stack?: string;
};

const MAX_DATA_CHARS = 500;

/** Query parameters whose value must never show up in a log. */
const SENSITIVE_QUERY_PARAMS = [
  "token",
  "access_token",
  "breathecode_token",
  "rigo_token",
  "api_key",
  "key",
  "password",
  "secret",
];

/**
 * Returns the URL with the values of sensitive parameters redacted. Some
 * requests carry the token in the query string (for example
 * `/v1/auth/me/token?breathecode_token=...`), so omitting the headers is not
 * enough.
 */
export const redactUrl = (url?: string): string | undefined => {
  if (!url) return undefined;

  const [base, query] = url.split("?");
  if (!query) return base;

  const redactedQuery = query
    .split("&")
    .map((pair) => {
      const [name] = pair.split("=");
      return SENSITIVE_QUERY_PARAMS.includes(name.toLowerCase())
        ? `${name}=[REDACTADO]`
        : pair;
    })
    .join("&");

  return `${base}?${redactedQuery}`;
};

/** Serializes the response body and truncates it so it does not flood the console. */
const summarizeData = (data: unknown): unknown => {
  if (data === null || data === undefined) return undefined;

  let asText: string;
  try {
    asText = typeof data === "string" ? data : JSON.stringify(data);
  } catch {
    return "[no serializable]";
  }

  if (typeof asText !== "string") return undefined;

  return asText.length > MAX_DATA_CHARS
    ? `${asText.slice(0, MAX_DATA_CHARS)}... [truncado]`
    : asText;
};

/**
 * Extracts the data that is useful for support (message, status, method and
 * URL) from an error, always omitting request headers and configuration.
 */
export const describeError = (error: unknown): TSafeErrorInfo => {
  if (axios.isAxiosError(error)) {
    return {
      message: error.message,
      name: error.name,
      status: error.response?.status,
      statusText: error.response?.statusText,
      method: error.config?.method?.toUpperCase(),
      url: redactUrl(error.config?.url),
      data: summarizeData(error.response?.data),
    };
  }

  // For non-network errors (parsing, Pusher, hashing...) the stack is the main
  // diagnostic signal and holds no credentials.
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }

  return { message: String(error) };
};
