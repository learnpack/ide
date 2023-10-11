import { Remarkable } from 'remarkable';

/**
  * Converts markdown to HTML and injects it into a div.
  * @param {string} markdown - The markdown string to be converted.
  * @returns {string} - The HTML string.
  */

export const convertMarkdownToHTML = (markdown: any) => {
  // Create a new instance of the Remarkable markdown parser
  const md = new Remarkable();
  // Convert the markdown to HTML using the Remarkable parser
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
  // Use a regular expression to find all occurrences of src="../.."
  const regex = /src="\.\.\/\.\./g;
  // Replace all occurrences with http://localhost:3000
  const modifiedText = rawText.replace(regex, 'src="http://localhost:3000');
  // Return the modified text
  return modifiedText;
}



// const TOKEN = "407f2194babf39d6d3e7870043717d37c35e0919";
export const getRigobotFeedback = async (tutorial:string, currentCode:string, token:string = "407f2194babf39d6d3e7870043717d37c35e0919", host:string = "https://rigobot.herokuapp.com") => {
  const tutorialEncoded = encodeURIComponent(tutorial);
  const currentCodeEncoded = encodeURIComponent(currentCode);
  const encoder = new TextEncoder();
  const tutorialArray = encoder.encode(tutorialEncoded);
  const currentCodeArray = encoder.encode(currentCodeEncoded);
  const tutorialBase64 = base64ArrayBuffer(tutorialArray);
  const currentCodeBase64 = base64ArrayBuffer(currentCodeArray);
  const payload = {
    current_code: currentCodeBase64,
    tutorial: tutorialBase64
  };
  const response = await fetch(`${host}/v1/conversation/feedback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    },
    body: JSON.stringify(payload)
  });
  const responseData = await response.json();
  return responseData.feedback;
};

function base64ArrayBuffer(arrayBuffer:any) {
  let base64 = '';
  const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new Uint8Array(arrayBuffer);
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;
  let a, b, c, d;
  let chunk;
  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i += 3) {
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  // Handle remaining bytes
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
    b = (chunk & 3) << 4; // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '==';
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
    c = (chunk & 15) << 2; // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  }
  return base64;
}