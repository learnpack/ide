import React, { useEffect, useState } from "react";
import { Preview } from "../Preview/Preview";



export const PreviewHTMLPage: React.FC = () => {
  const [htmlString, setHtmlString] = useState("");

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
      console.log("data.html", data.html);
      setHtmlString(data.html);
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

  console.log(htmlString, "htmlString");

  return (
    <main className="vh100 overflow-y-hidden">
      <Preview
        onTitleRevealed={foundPreviewTitle}
        html={htmlString}
        useIframe={true}
      />
    </main>
  );
};
