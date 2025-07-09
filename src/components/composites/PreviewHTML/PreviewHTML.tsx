import React, { useEffect, useState } from "react";
import { Preview } from "../Preview/Preview";



export const PreviewHTMLPage: React.FC = () => {
  const [htmlString, setHtmlString] = useState("");
  const [isReact, setIsReact] = useState(false);

  const [previewTitle, setPreviewTitle] = useState("");

  const foundPreviewTitle = (title: string) => {
    setPreviewTitle(title);
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.source !== window.opener) {
      return;
    }

    const data = event.data;
    if (data.html) {
      setHtmlString(data.html);
    }
    if (data.isReact) {
      setIsReact(data.isReact);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (previewTitle) {
      document.title = previewTitle;
    }
  }, [previewTitle]);

  return (
    <main className="vh100 overflow-y-hidden">
      <Preview
        onTitleRevealed={foundPreviewTitle}
        html={htmlString}
        useIframe={isReact}
      />
    </main>
  );
};
