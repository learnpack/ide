import axios from "axios";

/**
 * Utilidades para registrar errores en consola sin exponer credenciales.
 *
 * El objeto de error de axios arrastra `config.headers` (con `Authorization`
 * o `x-rigo-token`), `request` y `response.headers`. Volcarlo entero con
 * `console.error("...", error)` publica el token del usuario en las devtools.
 * `describeError` se queda solo con lo que sirve para diagnosticar.
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

/** Parametros de query cuyo valor nunca debe aparecer en un log. */
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
 * Devuelve la URL sin los valores de los parametros sensibles. Algunas
 * peticiones llevan el token en la query (por ejemplo
 * `/v1/auth/me/token?breathecode_token=...`), asi que no basta con omitir
 * las cabeceras.
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

/** Serializa el cuerpo de la respuesta y lo recorta para no inundar la consola. */
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
 * Extrae de un error los datos utiles para soporte (mensaje, estado, metodo y
 * URL) omitiendo siempre cabeceras y configuracion de la peticion.
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

  // En los errores que no son de red (parseo, Pusher, hashing...) la traza es
  // el dato de diagnostico principal y no contiene credenciales.
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }

  return { message: String(error) };
};
