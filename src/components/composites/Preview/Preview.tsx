import React, { useEffect, useRef } from "react";

const getTitleFromHTMLString = (html: string) => {
  const match = html.match(/<title>(.*)<\/title>/);
  return match ? match[1] : "";
};

export const Preview: React.FC<{
  html: string;
  onTitleRevealed: (title: string) => void;
  useIframe?: boolean;
}> = ({ html, onTitleRevealed, useIframe = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const title = getTitleFromHTMLString(html);
    onTitleRevealed(title ?? window.location.host + "/preview");
  }, []);

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
      style={{width: "100%"}}
    />
  ) : (
    <div
      style={{ width: "100%", height: "100%", border: "none" }}
      dangerouslySetInnerHTML={{ __html: html }}
    ></div>
  );
};
