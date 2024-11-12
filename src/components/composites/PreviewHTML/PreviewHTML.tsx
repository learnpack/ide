import React, { useEffect, useState } from "react";
import { Preview } from "../Preview/Preview";
import { useLoaderData } from "react-router-dom";
import { LocalStorage } from "../../../managers/localStorage";

export const previewLoader = async () => {
  const htmlString = LocalStorage.get(`htmlString`, false);
  return { htmlString };
};

export const PreviewHTMLPage: React.FC = () => {
  const { htmlString } = useLoaderData() as {
    htmlString: string;
  };

  const [previewTitle, setPreviewTitle] = useState("");

  const foundPreviewTitle = (title: string) => {
    setPreviewTitle(title);
  };

  useEffect(() => {
    console.log(previewTitle);
  }, [previewTitle]);


  return (
    <main className="vh100 overflow-y-hidden">
      <Preview onTitleRevealed={foundPreviewTitle} html={htmlString} />
    </main>
  );
};
