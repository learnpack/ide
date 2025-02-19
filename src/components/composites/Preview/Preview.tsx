import React, { useEffect, useRef, useState } from "react";
import { Alert } from "../Alert/Alert";
import { useTranslation } from "react-i18next";

const getTitleFromHTMLString = (html: string) => {
  const match = html.match(/<title>(.*)<\/title>/);
  return match ? match[1] : "";
};

const getContentFromHTMLString = (html: string) => {
  const ignoredTags = new Set(["script", "style", "link", "meta", "title"]);

  // Parse the HTML string into a document
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove ignored tags
  ignoredTags.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });

  // Get the remaining text content
  return doc.body.textContent?.trim() || "";
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
      const content = getContentFromHTMLString(previewRef.current.innerHTML);
      setIsEmpty(content.trim() === "");
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
