import { Remarkable } from "remarkable";
import { linkify } from "remarkable/linkify";
import { TEnvironment } from "../managers/EventProxy";

// @ts-ignore
// import katex from 'remarkable-katex'

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
      return "localhost";
    } else throw Error("The response was unsuccesfull");
  } catch (e) {
    console.log(e);
    ENVIRONMENT = "localStorage";
    return "localStorage";
  }
};

getEnvironment();
// TODO: INVESTIGATE: This line of code made me change from format: "iife" to "system"
// export const ENVIRONMENT: TEnvironment = await getEnvironment();
// export const ENVIRONMENT: TEnvironment = "localStorage";

export const RIGOBOT_HOST = "https://rigobot.herokuapp.com";

/**
 * Converts markdown to HTML and injects it into a div.
 * @param {string} markdown - The markdown string to be converted.
 * @returns {string} - The HTML string.
 */

export const convertMarkdownToHTML = (markdown: any) => {
  const md = new Remarkable().use(linkify);
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
  // Replace all occurrences with http://localhost:3000

  let host = getHost();

  if (ENVIRONMENT === "localStorage") {
    host = "";
  }
  const modifiedText = rawText.replace(regex, `src="${host}`);

  // Return the modified text
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

export const getParamsObject = (): Record<string, string> => {
  let params = window.location.hash.substring(1);
  const paramsUrlSearch = new URLSearchParams(params);

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
