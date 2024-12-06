import React, { useEffect, useState } from "react";
import { Preview } from "../Preview/Preview";
// import { useLoaderData } from "react-router-dom";
// import { LocalStorage } from "../../../managers/localStorage";
// import toast from "react-hot-toast";

export const previewLoader = async () => {
  // const htmlString = LocalStorage.get(`htmlString`, false);
  // return { htmlString };
  return null;
};

export const PreviewHTMLPage: React.FC = () => {
  // const { htmlString } = useLoaderData() as {
  //   htmlString: string;
  // };
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

    console.log("Event from window.opener", event);

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
    console.log(previewTitle);
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
