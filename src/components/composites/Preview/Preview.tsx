import React, { useRef } from "react";

export const Preview: React.FC<{
  html: string;
  onTitleRevealed: (title: string) => void;
}> = ({ html, onTitleRevealed }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    if (iframeRef.current) {
      const title = iframeRef.current.contentWindow?.document.title;
      onTitleRevealed(title ?? window.location.host + "/preview");
    }
  };

  return (
    <iframe
      ref={iframeRef}
      className="preview-iframe"
      style={{ width: "100%", height: "100%", border: "none" }}
      srcDoc={html}
      title="HTML Preview"
      onLoad={handleLoad}
    />
  );
};
