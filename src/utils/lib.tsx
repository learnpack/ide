import { Remarkable } from "remarkable";
import {linkify} from 'remarkable/linkify';
// @ts-ignore
// import katex from 'remarkable-katex'

export const DEV_MODE =true;

export const RIGOBOT_API_URL = "https://rigobot.herokuapp.com";

const fullURL =
  location.protocol +
  "//" +
  location.hostname +
  (location.port ? ":" + location.port : "");
/**
 * Converts markdown to HTML and injects it into a div.
 * @param {string} markdown - The markdown string to be converted.
 * @returns {string} - The HTML string.
 */

export const convertMarkdownToHTML = (markdown: any) => {
  // const md = new Remarkable({linkify: true});
  const md = new Remarkable().use(linkify)
  // .use(katex)
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

  const host = getHost();
  const modifiedText = rawText.replace(regex, `src="${host}`);

  // Return the modified text
  return modifiedText;
}

export const getExercise = async (slug: string) => {
  return await fetch(`${getHost()}/exercise/${slug}`);
};

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

export const getFileContent = async (slug: string, file: string) => {
  const response = await fetch(`${getHost()}/exercise/${slug}/file/${file}`);
  const data = await response.text();
  return data;
};

export const startChat = async (purpose_id: string | number, token: string) => {
  const conversationUrl =
    RIGOBOT_API_URL + "/v1/conversation/?purpose=" + purpose_id;

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
}

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

export const startRecording = async () => {
  try {
    // @ts-ignore
    function showModal(devices) {
      // Create the modal container
      const modalContainer = document.createElement('div');
      modalContainer.classList.add('self-closing-modal');
      const modalContent = document.createElement('div');
      modalContent.classList.add('modal-content'); 
      // Create the list of audioinput devices
      const deviceList = document.createElement('ul');
      // @ts-ignore
      devices.forEach(device => {
        if (device.kind === 'audioinput') {
          const listItem = document.createElement('li');
          listItem.textContent = `${device.kind}: ${device.label} (ID: ${device.deviceId})`;
          deviceList.appendChild(listItem);
        }
      });
      
      // Append the list to the modal
      modalContent.appendChild(deviceList);

      modalContainer.appendChild(modalContent);
    
      // Add a close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.onclick = () => document.body.removeChild(modalContainer);
      modalContent.appendChild(closeButton);
    
      // Append the modal to the body
      document.body.appendChild(modalContainer);
    }
    
    // Get the available devices and show the modal
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        showModal(devices);
      })
      .catch(err => {
        console.error("Error listing devices:", err);
      });
    // Get the video stream for screen sharing with audio
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    // Create a new MediaRecorder with the stream
    const recorder = new MediaRecorder(stream);

    // Set up the ondataavailable event handler
    recorder.ondataavailable = (e) => {
      const chunks = [];
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      // Create an anchor element and trigger a download
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    // Start the recording
    console.log("Starting recording");

    recorder.start();

    // Return control functions for the recording
    return {
      stop: () => recorder.stop(),
      pause: () => recorder.pause(),
      resume: () => recorder.resume(),
    };
  } catch (err) {
    console.error("Error starting recording:", err);
  }
};
