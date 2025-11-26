import { TEnvironment } from "../managers/EventProxy";
import { TPossibleParams } from "./storeTypes";
// @ts-ignore
import TaskLists from "markdown-it-task-lists";
import TagManager from "react-gtm-module";
import * as yaml from "js-yaml";
import axios from "axios";
import { LocalStorage } from "../managers/localStorage";
import assessmentComponentsRaw from "../../docs/assessment_components.yml?raw";
import explanatoryComponentsRaw from "../../docs/explanatory_components.yml?raw";
// import toast from "react-hot-toast";
export const DEV_MODE =false;
export const DEV_URL = "https://1gm40gnb-3000.use2.devtunnels.ms";

export const FASTAPI_HOST = "https://ai.4geeks.com";
// export const FASTAPI_HOST = "http://localhost:8003";
//@ts-ignore
export function getParams(opts) {
  if (!Array.isArray(opts)) opts = [opts];
  const urlParams = new URLSearchParams(window.location.search);
  let obj = {};
  //@ts-ignore
  opts.forEach((name) => (obj[name] = urlParams.get(name)));
  //@ts-ignoreR
  const result = opts.length == 1 ? obj[opts[0]] : obj;
  return result;
}

const fullURL =
  location.protocol +
  "//" +
  location.hostname +
  (location.port ? ":" + location.port : "");

export const getHost = function (): string {


  const includeScormPath = window.location.pathname.endsWith("/config/index.html");

  let preConfig = getParams("config");
  if (preConfig && preConfig !== "") preConfig = JSON.parse(atob(preConfig));

  let HOST = preConfig
    ? `${preConfig.address}:${preConfig.port}`
    : getParams("host") || fullURL;

  // TODO: DO THIS BETTER
  if (DEV_MODE) {
    HOST = "http://localhost:3000";
  }


  if (includeScormPath) {
    // Return the full URL without the /config/index.html
    HOST = window.location.href.replace("/config/index.html", "");
  }

  return HOST;
};

export let ENVIRONMENT: TEnvironment = "localhost";

export const getEnvironment = async () => {
  const host = getHost();

  console.log("DETECTED HOST", host);
  try {
    const slug = getSlugFromPath();
    const response = await fetch(`${host}/config?slug=${slug}`);
    const isJson = response.headers.get("Content-Type")?.includes("application/json");
    if (response.ok && isJson) {
      let environment: TEnvironment = "localhost";

      const isCreatorWeb = response.headers.get("X-Creator-Web");

      if (isCreatorWeb) {
        environment = "creatorWeb";
      }
      console.log("The environment will be:", environment);

      ENVIRONMENT = environment;

      const myEvent = new CustomEvent("environment-change", {
        detail: { environment },
      });

      document.dispatchEvent(myEvent);

      return environment;

    } else throw Error("The response was unsuccessful");
  } catch (e) {
    ENVIRONMENT = "localStorage";

    // Fetch config,jsonhandleEnvironmentChange
    try {
      const config = await fetch(`${host}/config.json`);
      await config.json();

      console.log("The environment will be localStorage");

      const myEvent = new CustomEvent("environment-change", {
        detail: { environment: "localStorage" },
      });

      document.dispatchEvent(myEvent);

      return "localStorage";
    } catch (e) {

      try {
        const scormConfig = await fetch(`${host}/.learn/config.json`);
        console.log("SCORM CONFIG PATH", scormConfig);
        await scormConfig.json();

        const myEvent = new CustomEvent("environment-change", {
          detail: { environment: "scorm" },
        });
        console.log("The environment will be scorm");

        document.dispatchEvent(myEvent);
        return "scorm";
      } catch (e) {
        console.error("Error fetching scorm config, impossible to detect environment", e);
        return "localStorage";
      }
    }
  }
};

getEnvironment();

export const RIGOBOT_HOST = "https://rigobot.herokuapp.com";
// export const RIGOBOT_HOST = "https://8000-charlytoc-rigobot-bmwdeam7cev.ws-us120.gitpod.io";
export const BREATHECODE_HOST = "https://breathecode.herokuapp.com";

export const changeSidebarVisibility = () => {
  const sidebar: HTMLElement | null =
    document.querySelector(".sidebar-component");

  if (sidebar) {
    const style = window.getComputedStyle(sidebar);
    if (style.left === "0px") {
      sidebar.classList.remove("sidebar-appear");
      sidebar.classList.add("sidebar-disappear");
    } else {
      sidebar?.classList.remove("sidebar-disappear");
      sidebar?.classList.add("sidebar-appear");
    }
    void sidebar?.offsetWidth;
  }
};

/**
 * Replaces occurrences of src="../.." with the currentHost in the given HTML-like text.
 *
 * @param {string} rawText - The input text in HTML-like format.
 * @returns {string} - The modified text with replaced occurrences.
 */
export function replaceSrc(rawText: string) {
  // Use a regular expression to find all oc currences of src="../.."
  const regex = /src="\.\.\/\.\./g;

  let host = getHost();

  if (ENVIRONMENT === "localStorage") {
    host = "";
  }
  const modifiedText = rawText.replace(regex, `src="${host}`);

  return modifiedText;
}

export const getExercise = async (slug: string) => {
  return await fetch(`${getHost()}/exercise/${slug}`);
};

export const getFileContent = async (slug: string, file: string) => {
  const response = await fetch(`${getHost()}/exercise/${slug}/file/${file}`);
  const data = await response.text();
  return data;
};

export const startChat = async (purpose_id: string | number, token: string) => {
  const conversationUrl =
    RIGOBOT_HOST + "/v1/conversation/?purpose=" + purpose_id;

  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Token " + token,
    },
  };

  const resp = await fetch(conversationUrl, config);
  const data = await resp.json();
  return data;
};

export const disconnected = () => {
  const modal: HTMLElement | null = document.querySelector(
    "#socket-disconnected"
  );
  if (modal) {
    modal.style.display = "block";
  }
};

export const onConnectCli = () => {
  const modal: HTMLElement | null = document.querySelector(
    "#socket-disconnected"
  );

  if (modal) {
    modal.style.display = "none";
  }
};

export const getQueryParams = (): TPossibleParams => {
  const urlParams = new URLSearchParams(window.location.search);
  let paramsObject: Record<string, string> = {};

  for (const [key, value] of urlParams.entries()) {
    paramsObject[key] = value;
  }

  return paramsObject;
};

export const getParamsObject = (): TPossibleParams => {
  return getQueryParams();
};

export const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: any;

  function debounced(this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
};


export const removeSpecialCharacters = (inputString: string) => {
  return inputString.replace(/\x1B[@-_][0-?]*[ -/]*[@-~]/g, "");
};

export const replaceSlot = (
  string: string,
  slot: string,
  value: string
): string => {
  const slotRegex = new RegExp(slot, "g");
  return string.replace(slotRegex, value);
};

export const setQueryParams = (params: TPossibleParams) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const newUrl = queryString
    ? `${window.location.pathname}?${queryString}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;

  window.history.replaceState(null, '', newUrl);
};

export const setWindowHash = setQueryParams;

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class MissingRigobotAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingRigobotAccountError";
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}

export const countConsumables = (
  consumables: any,
  consumableSlug:
    | "ai-conversation-message"
    | "ai-compilation"
    | "ai-generation" = "ai-conversation-message"
) => {
  // Find the void that matches the consumableSlug
  // @ts-ignore
  const consumable = consumables.voids.find(
    (voidItem: any) => voidItem.slug === consumableSlug
  );

  // Return the available units or 0 if not found
  return consumable ? consumable.balance.unit : 0;
};

export function hashText(text: string, callback: (hash: string) => void) {
  console.log(text, "TEXT TO HASH");

  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  crypto.subtle
    .digest("SHA-256", data) // Hash the data
    .then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert the buffer to an array
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // Convert bytes to hex string

      callback(hashHex); // Call the callback function with the hashed text
    })
    .catch((err) => {
      console.error("Hashing failed:", err); // Handle any errors
    });
}

export const asyncHashText = async (text: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

export const removeParam = (param: string) => {
  // Retrieve the current URL
  const url = new URL(window.location.href);

  // Remove the specified query parameter
  url.searchParams.delete(param);

  // Remove the specified hash parameter
  const hashParams = new URLSearchParams(url.hash.slice(1)); // Exclude the leading '#'
  hashParams.delete(param);

  // Update the URL hash if there were hash parameters removed
  if (hashParams.toString()) {
    url.hash = `#${hashParams.toString()}`;
  } else {
    url.hash = ""; // Clear the hash if there are no parameters left
  }

  // Update the URL without reloading the page
  window.history.replaceState({}, "", url.toString());
};

type TDataLayer = {
  event: string;
  [key: string]: any;
};

type TDataLayerPayload = {
  dataLayer: TDataLayer;
};

export const reportDataLayer = (payload: TDataLayerPayload) => {
  TagManager.dataLayer(payload);
};

export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export const remakeMarkdown = (
  attributes: Record<string, any>,
  body: string
) => {
  const yamlAttributes = yaml.dump(attributes);

  const wholeMD = "---\n" + yamlAttributes + "---\n\n" + body;

  return wholeMD;
};

export const correctLanguage = (language: string) => {
  return language === "us" ? "en" : "es";
};

export const getReadmeExtension = (language: string) => {
  return language === "en" || language === "us" ? ".md" : `.${language}.md`;
};

export const getLanguageName = (langCode: string, currentLanguage: string = 'en'): string => {
  try {
    const displayNames = new Intl.DisplayNames([currentLanguage], { type: 'language' });
    // Normalizar códigos especiales
    const normalizedCode = langCode === 'us' ? 'en' : langCode;
    return displayNames.of(normalizedCode) || langCode;
  } catch {
    return langCode;
  }
};

export const convertUrlToBase64 = (url: string, extraParams: string = "") => {
  if (url.includes("?") || url.includes("#")) {
    return btoa(url + extraParams);
  }
  return btoa(url + "?" + extraParams);
};
const LEARNPACK_CDN = "https://storage.googleapis.com/breathecode/learnpack";

export const playEffect = (mood: "success" | "error") => {
  try {
    const random = Math.floor(Math.random() * 2);
    const audio = new Audio(
      `${LEARNPACK_CDN}/sounds-${mood}/${mood === "success" ? random : 0}.mp3`
    );
    audio.volume = 0.4;
    audio.play();
  } catch (error) {
    console.error("Error playing sound", error);
  }
};

export function removeFrontMatter(content: string): string {
  const frontMatterRegex = /^---\s*[\s\S]*?\s*---\s*/;
  return content.replace(frontMatterRegex, "").trimStart();
}

// export function normalizeVersionString(input: string): string {
//   const [intPart, decPart] = input.split(".");

//   if (decPart === "0" || decPart === undefined) {
//     return intPart;
//   }

//   return `${intPart}.${decPart}`;
// }

export function cleanFloatString(input: string): string {
  const num = parseFloat(input);
  if (Number.isNaN(num)) return input; // Retorna la entrada si no es un número válido

  // Para evitar problemas con -0
  if (num === 0) return "0";

  // Convertir a string y eliminar ceros a la izquierda en la parte entera
  const parts = num.toString().split(".");

  // Eliminar ceros a la izquierda en la parte entera (pero dejar al menos un dígito)
  parts[0] = parts[0].replace(/^0+(?=\d)/, "");

  return parts.join(".");
}

export function hasDecimalPart(input: string): boolean {
  const num = parseFloat(input);
  if (Number.isNaN(num)) return false;
  return num % 1 > 0;
}

export function getSlugFromPath() {
  const segments = window.location.pathname
    .split("/") // ["", "preview", "mi-slug"]
    .filter(Boolean); // ["preview", "mi-slug"]

  // Si la primera parte es "preview", devolvemos la siguiente
  if (segments[0] === "preview" && segments[1]) {
    return segments[1];
  }

  // Si no, devolvemos el último segmento (por si cambian la estructura)
  return segments.pop() || null;
}

export function getTeacherOnboardingKey() {
  const slug = getSlugFromPath();
  return `teacherOnboardingClosed_${slug || 'default'}`;
}

export function getTeacherOnboardingClosed() {
  return LocalStorage.get(getTeacherOnboardingKey(), false) === true;
}

export function getMainIndex(title: string): number | null {
  const match = title.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export const uploadBlobToBucket = async (blob: Blob, path: string) => {
  console.log("Uploading blob to bucket", blob, path);

  const formData = new FormData();
  formData.append("file", blob, "preview.png");
  formData.append("destination", path);

  const response = await fetch(
    `${DEV_MODE ? "http://localhost:3000" : ""}/upload-image-file`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    console.error("Error uploading image to bucket", response);
    throw new Error("Failed to upload image");
  }

  return await response.json();
};

export const checkPreviewImage = async (slug: string) => {
  try {
    const response = await axios.get(
      `${DEV_MODE ? "http://localhost:3000" : ""}/check-preview-image/${slug}`
    );
    return response.data;
  } catch (error) {
    console.error("Error checking preview image", error);
    return null;
  }
};

// export const slugify = (text: string) => {
//   return text
//     .toLowerCase()
//     .replace(/ /g, "-")
//     .replace(/[^\w.-]+/g, "")
//     .replace(/^-+|-+$/g, "")
//     .replace(/-+/g, "-");
// };

export const slugify = (text: string, trimStartAndEnd: boolean = true) => {
  let slug = text
    .toString()
    .normalize("NFD") // Remove paccents
    .replace(/[\u0300-\u036F]/g, "") // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^\d\s._a-z-]/g, "") // Hyphen at the end, no escape needed
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    // .replace(/^-+|-+$/g, "") // Trim hyphens from start/end
  if (trimStartAndEnd) {
    slug = slug.replace(/^-+|-+$/g, "");
  }
  return slug;
}

type SlugAvailabilityResponse = {
  available: boolean;
};

export const isSlugAvailable = async (slug: string): Promise<boolean> => {
  try {
    const url = `${RIGOBOT_HOST}/v1/learnpack/check-slug-availability?slug=${encodeURIComponent(
      slug
    )}`
    const response = await axios.get<SlugAvailabilityResponse>(url)
    return response.data.available
  } catch (error) {
    console.error("Error checking slug availability:", error)
    throw error
  }
}


type TGenerateImageParams = {
  prompt: string;
  context: string;
  callbackUrl: string;
};

export const generateImage = async (
  token: string,
  { prompt, callbackUrl, context }: TGenerateImageParams
) => {
  try {
    const response = await axios.post(
      `${RIGOBOT_HOST}/v1/learnpack/tools/images`,
      {
        prompt,
        context,
        webhook_callback_url: callbackUrl,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + token,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

/**
 * Crea la URL para reportar un bug en GitHub.
 * @param {string} lessonTitle - Título de la lección.
 * @param {string} exerciseSlug - Slug del ejercicio (opcional).
 * @param {string} errorLog - Log de error o información adicional.
 * @returns {string} URL lista para abrir en el navegador.
 */
export function createBugReportUrl(
  lessonTitle: string,
  exerciseSlug: string = "",
  errorLog: string = ""
) {
  let defaultTitle = "Bug";
  if (exerciseSlug) defaultTitle = `Bug in ${exerciseSlug}`;

  const body =
    `Lesson: ${lessonTitle}\n\n` +
    `Explain the problem\n\n` +
    `Provide an image or example of the problem\n\n` +
    (errorLog ? `Error log:\n${errorLog}\n` : "");

  const url = `https://github.com/learnpack/learnpack/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=${encodeURIComponent(
    defaultTitle
  )}&body=${encodeURIComponent(body)}`;

  return url;
}


export const getComponentsInfo = (has_coding_challenges: boolean = false): string => {
  let filteredAssessmentComponents = assessmentComponentsRaw;

  console.log(assessmentComponentsRaw, "ASSESSMENT COMPONENTS RAW");
  
  if (has_coding_challenges) {
    const assessmentComponents = yaml.load(assessmentComponentsRaw) as any;
    if (assessmentComponents && assessmentComponents.components) {
      const filteredComponents = assessmentComponents.components.filter(
        (component: any) => component.name !== 'code_challenge_proposal'
      );
      assessmentComponents.components = filteredComponents;
      filteredAssessmentComponents = yaml.dump(assessmentComponents);
    }
  }

  let componentsInfoString = `
  These are the valid LearnPAck components up to date:
  ## ASSESSMENT COMPONENTS:
  ${filteredAssessmentComponents}

  --------------------------------

  ## EXPLANATORY COMPONENTS:
  ${explanatoryComponentsRaw}
  `
  return componentsInfoString;
};
