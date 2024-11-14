import React, { useEffect } from "react";

const getTitleFromHTMLString = (html: string) => {
  const match = html.match(/<title>(.*)<\/title>/);
  return match ? match[1] : "";
};

export const Preview: React.FC<{
  html: string;
  onTitleRevealed: (title: string) => void;
}> = ({ html, onTitleRevealed }) => {
  // const iframeRef = useRef<HTMLIFrameElement>(null);


  useEffect(() => {
    const title = getTitleFromHTMLString(html);
    onTitleRevealed(title ?? window.location.host + "/preview");
  }, []);

  return (
    // <iframe
    //   ref={iframeRef}
    //   className="preview-iframe"
    //   srcDoc={html}
    //   title="HTML Preview"
    //   onLoad={handleLoad}
    // />
    <div
      style={{ width: "100%", height: "100%", border: "none", marginTop: "100px" }}
      dangerouslySetInnerHTML={{ __html: html }}
    ></div>
  );
};
