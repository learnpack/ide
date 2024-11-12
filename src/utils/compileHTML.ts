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

export const compileReactHTML = (tabs: Tab[]) => {
  let jsCode = "";
  let htmlCode = `
    <div id="myDiv"></div>
    <script src="https://unpkg.com/react@16/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js" crossorigin></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js"></script>
  `;

  tabs.forEach((tab) => {
    if (tab.name.endsWith(".js") || tab.name.endsWith(".jsx")) {
      const filteredContent = tab.content
        .split("\n")
        .filter((line) => !line.trim().startsWith("import"))
        .join("\n");

      jsCode += `<script type="text/babel">${filteredContent}</script>`;
    }

    if (tab.name.endsWith(".html")) {
      htmlCode += tab.content;
    }
  });

  const finalHTML = htmlCode + jsCode;

  return finalHTML;
};
