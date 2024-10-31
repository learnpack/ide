import { Tab } from "../types/editor";

export const compileHTML = (tabs: Tab[]) => {
  let jsCode = "";
  let cssCode = "";
  let htmlCode = "";

  tabs.forEach((tab) => {
    if (tab.name.endsWith(".js")) {
      jsCode += `<script>${tab.content}</script>`;
    }
    if (tab.name.endsWith(".css")) {
      cssCode += `<style>${tab.content}</style>`;
    }
    if (tab.name.endsWith(".html")) {
      htmlCode += tab.content;
    }
  });

  const finalHTML = htmlCode + jsCode + cssCode;

  return finalHTML;
};
