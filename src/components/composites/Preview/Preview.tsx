import React, { useEffect, useRef, useState } from "react";
import { Alert } from "../Alert/Alert";
import { useTranslation } from "react-i18next";

const getTitleFromHTMLString = (html: string) => {
  const match = html.match(/<title>(.*)<\/title>/);
  return match ? match[1] : "";
};

const hasContent = (html: string) => {
  const ignoredTags = new Set(["script", "style", "link", "meta", "title"]);
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Eliminar etiquetas ignoradas
  ignoredTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  // Obtener texto
  const bodyText = doc.body.textContent?.trim() || "";

  // Verificar si hay imágenes
  const hasImages = doc.body.querySelector("img") !== null;

  // Si hay texto o imágenes, devolver true, si no, devolver false
  return !!bodyText || hasImages;
};

export const Preview: React.FC<{
  html: string;
  onTitleRevealed: (title: string) => void;
  useIframe?: boolean;
}> = ({ html, onTitleRevealed, useIframe = false }) => {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const title = getTitleFromHTMLString(html);
    onTitleRevealed(title ?? window.location.host + "/preview");
  }, []);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = html;
      const content = hasContent(previewRef.current.innerHTML);
      setIsEmpty(!content);
    }
  }, [html]);

  const handleLoad = () => {
    // Get the title of the iframe
    console.log("Iframe loaded");
  };

  return useIframe ? (
    <iframe
      ref={iframeRef}
      className="preview-iframe"
      srcDoc={html}
      title="HTML Preview"
      onLoad={handleLoad}
      style={{ width: "100%" }}
    />
  ) : (
    <div
      ref={previewRef}
      style={{ width: "100%", height: "100%", border: "none" }}
      // dangerouslySetInnerHTML={{ __html: html }}
    >
      {isEmpty && (
        <Alert>
          <p className="text-small">{t("website-built-no-body")}</p>
        </Alert>
      )}
    </div>
  );
};
