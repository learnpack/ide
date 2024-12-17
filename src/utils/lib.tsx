// import { Remarkable } from "remarkable";
import MarkdownIt from "markdown-it";
// import { linkify } from "remarkable/linkify";
import { TEnvironment } from "../managers/EventProxy";
import { TPossibleParams } from "./storeTypes";
// @ts-ignore
import TaskLists from "markdown-it-task-lists";
// import toast from "react-hot-toast";
export const DEV_MODE =false;

//@ts-ignore
export function getParams(opts) {
  if (!Array.isArray(opts)) opts = [opts];
  const urlParams = new URLSearchParams(window.location.search);
  let obj = {};
  //@ts-ignore
  opts.forEach((name) => (obj[name] = urlParams.get(name)));
  //@ts-ignore
  const result = opts.length == 1 ? obj[opts[0]] : obj;
  return result;
}

const fullURL =
  location.protocol +
  "//" +
  location.hostname +
  (location.port ? ":" + location.port : "");

export const getHost = function (): string {
  let preConfig = getParams("config");
  if (preConfig && preConfig !== "") preConfig = JSON.parse(atob(preConfig));

  let HOST = preConfig
    ? `${preConfig.address}:${preConfig.port}`
    : getParams("host") || fullURL;

  // TODO: DO THIS BETTER
  if (DEV_MODE) {
    HOST = "http://localhost:3000";
  }

  // console.log("HOST", HOST);
  return HOST;
};

export let ENVIRONMENT: TEnvironment = "localhost";

export const getEnvironment = async () => {
  const host = getHost();

  try {
    const response = await fetch(`${host}/config`);
    if (response.ok) {
      ENVIRONMENT = "localhost";

      const myEvent = new CustomEvent("environment-change", {
        detail: { environment: "localhost" },
      });

      // Dispatch the event
      document.dispatchEvent(myEvent);

      return "localhost";
    } else throw Error("The response was unsuccesfull");
  } catch (e) {
    // console.log(e);
    ENVIRONMENT = "localStorage";

    const myEvent = new CustomEvent("environment-change", {
      detail: { environment: "localStorage" },
    });

    // Dispatch the event
    document.dispatchEvent(myEvent);
    return "localStorage";
  }
};

getEnvironment();

export const RIGOBOT_HOST = "https://rigobot.herokuapp.com";
export const BREATHECODE_HOST = "https://breathecode.herokuapp.com";
// export const RIGOBOT_HOST = "https://8000-charlytoc-rigobot-bmwdeam7cev.ws-us116.gitpod.io";

/**
 * Converts markdown to HTML and injects it into a div.
 * @param {string} markdown - The markdown string to be converted.
 * @returns {string} - The HTML string.
 */

export const convertMarkdownToHTML = (
  markdown: any,
  allowHTML: boolean = true
) => {
  const md = new MarkdownIt({
    html: allowHTML,
    linkify: true,
    typographer: true,
    // highlight: true,
  }).use(TaskLists, { enabled: true });
  // const rawMarkup = md.render(markdown);
  // const md = new Remarkable().use(linkify);
  let html = md.render(markdown);
  html = replaceSrc(html);
  return html;
};

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
function replaceSrc(rawText: string) {
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

function fixParams(str: string) {
  return str.replace(/\?/g, "&");
}

export const getParamsObject = (): TPossibleParams => {
  let hashParams = window.location.hash.substring(1);

  hashParams = fixParams(hashParams);
  const url = window.location.href;
  const urlObj = new URL(url);
  const searchParams = urlObj.search;
  if (searchParams) {
    hashParams += fixParams(searchParams);
  }
  hashParams = fixParams(hashParams);

  if (hashParams.includes("%3F")) {
    hashParams = hashParams.replace(/%3F/g, "&");
  }

  if (hashParams.includes("%3D")) {
    hashParams = hashParams.replace(/%3D/g, "=");
  }

  const decodedHashParams = decodeURIComponent(hashParams);
  const paramsUrlSearch = new URLSearchParams(decodedHashParams);

  let paramsObject: Record<string, string> = {};
  for (const [key, value] of paramsUrlSearch.entries()) {
    paramsObject[key] = value;
  }
  return paramsObject;
};

export const debounce = (func: any, wait: any) => {
  let timeout: any;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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

export const setWindowHash = (params: TPossibleParams) => {
  // Create a hash string from the params object
  const hashString = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  const url = window.location.origin + window.location.pathname;
  history.replaceState(null, "", url);

  // Set the window location hash
  window.location.hash = hashString;
};

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class MissingRigobotAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingRigobotAccountError";
  }
}

export const countConsumables = (
  consumables: any,
  consumableSlug:
    | "ai-conversation-message"
    | "ai-compilation" = "ai-conversation-message"
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
  const encoder = new TextEncoder(); // Create a new TextEncoder instance
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
