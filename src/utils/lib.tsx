import { Remarkable } from 'remarkable';

const DEV_MODE = true;
const RIGOBOT_API_URL = "https://rigobot.herokuapp.com";

const fullURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
/**
  * Converts markdown to HTML and injects it into a div.
  * @param {string} markdown - The markdown string to be converted.
  * @returns {string} - The HTML string.
  */

export const convertMarkdownToHTML = (markdown: any) => {
  // Create a new instance of the Remarkable markdown parser
  const md = new Remarkable();
  // Convert the markdown to HTML using the Remarkable parser
  // console.log("MARKDOWN", markdown);

  let html = md.render(markdown);
  html = replaceSrc(html);
  // console.log(html);
  return html;
}

export const changeSidebarVisibility = () => {
  const sidebar: HTMLElement | null = document.querySelector(".sidebar-component");

  // Get the computed style of the sidebar
  if (sidebar) {
    const style = window.getComputedStyle(sidebar);
    // Check if sidebar is currently visible
    if (style.left === '0px') {
      // If visible, hide it
      // console.log("WORLD");
      sidebar.classList.remove("sidebar-appear");
      sidebar.classList.add("sidebar-disappear");
    } else {
      // If hidden, show it
      // console.log("NOT WORLD");
      sidebar?.classList.remove("sidebar-disappear");
      sidebar?.classList.add("sidebar-appear");
    }
    // Force a reflow, triggering the animation
    void sidebar?.offsetWidth;
  }
}


/**
  * Replaces occurrences of src="../.." with http://localhost:3000 in the given HTML-like text.
  *
  * @param {string} rawText - The input text in HTML-like format.
  * @returns {string} - The modified text with replaced occurrences.
  */
function replaceSrc(rawText: string) {
  // Use a regular expression to find all oc currences of src="../.."
  const regex = /src="\.\.\/\.\./g;
  // Replace all occurrences with http://localhost:3000

  const host = getHost();
  const modifiedText = rawText.replace(regex, `src="${host}`);

  // Return the modified text
  return modifiedText;
}

export const getExercise = async (slug: string) => {
  return await fetch(`${getHost()}/exercise/${slug}`)
}

//@ts-ignore
export function getParams(opts) {
  if (!Array.isArray(opts)) opts = [opts];
  const urlParams = new URLSearchParams(window.location.search);
  let obj = {};
  //@ts-ignore
  opts.forEach(name => obj[name] = urlParams.get(name));
  //@ts-ignore
  const result = opts.length == 1 ? obj[opts[0]] : obj;
  return result
}


export const getHost = function (): string {
  let preConfig = getParams("config");
  if (preConfig && preConfig !== "") preConfig = JSON.parse(atob(preConfig));

  let HOST = preConfig ? `${preConfig.address}:${preConfig.port}` : getParams('host') || fullURL;

  // TODO: DO THIS BETTER
  if (DEV_MODE) {
    HOST = 'http://localhost:3000';
  }

  // console.log("HOST", HOST);
  return HOST;
};

export const getFileContent = async (slug: string, file: string) => {
  const response = await fetch(`${getHost()}/exercise/${slug}/file/${file}`);
  const data = await response.text();
  return data;
}

export const startChat = async (purpose_id: string | number, token: string) => {
  const conversationUrl = RIGOBOT_API_URL + "/v1/conversation/?purpose=" + purpose_id

  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token
    }
  }

  const resp = await fetch(conversationUrl, config);
  const data = await resp.json();
  return data
}

export const disconnected = () => {

  const modal: HTMLElement | null = document.querySelector("#socket-disconnected");

  if (modal) {
    modal.style.display = "block";
  }
}


export const getParamsObject = (): Record<string, string> => {
  let params = window.location.hash.substring(1);
  const paramsUrlSearch = new URLSearchParams(params);

  let paramsObject: Record<string, string> = {};
  for (const [key, value] of paramsUrlSearch.entries()) {
    paramsObject[key] = value;
  }
  return paramsObject;
}