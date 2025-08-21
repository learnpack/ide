import { Tab } from "../types/editor";

export const compileHTML = (tabs: Tab[]) => {
  let jsCode = "";
  let cssCode = "";
  let htmlCode = "";

  tabs.forEach((tab) => {
    if (tab.name.endsWith(".js")) {
      jsCode += `<script>${tab.content}</script>\n`;
    }
    if (tab.name.endsWith(".css")) {
      cssCode += `<style>${tab.content}</style>\n`;
    }
    if (tab.name.endsWith(".html")) {
      htmlCode += tab.content;
    }
  });

  // Verificamos si el HTML contiene etiquetas <html>, <head> o <body>
  const hasHtmlTag = /<html[\s>]/i.test(htmlCode);
  const hasHeadTag = /<head[\s>]/i.test(htmlCode);
  const hasBodyTag = /<body[\s>]/i.test(htmlCode);

  // Si el HTML ya está completo, insertamos los scripts y estilos en el lugar correcto
  if (hasHtmlTag) {
    console.log(htmlCode, "HTML CODE");

    // Insertar <style> dentro del <head>
    if (hasHeadTag) {
      htmlCode = htmlCode.replace(/<head[^>]*>/i, (match) => `${match}\n${cssCode}`);
    } else {
      htmlCode = htmlCode.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${cssCode}</head>`);
    }

    // Insertar <script> antes del </body>
    if (hasBodyTag) {
      htmlCode = htmlCode.replace(/<\/body>/i, `${jsCode}</body>`);
    } else {
      htmlCode += `\n<body>\n${jsCode}</body>`;
    }

    return htmlCode;
  } else {
    console.log("NO HTML TAG");
  }

  // Si no tiene estructura HTML completa, la generamos
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Preview</title>
    ${cssCode}
  </head>
  <body>
    ${htmlCode}
    ${jsCode}
  </body>
</html>
  `.trim();
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
