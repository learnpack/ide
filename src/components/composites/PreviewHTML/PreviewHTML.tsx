import React, { useEffect, useState } from "react";
import { Preview } from "../Preview/Preview";
import { useLoaderData } from "react-router-dom";
import { LocalStorage } from "../../../managers/localStorage";
import { Tab } from "../../../types/editor";

export const previewLoader = async () => {
  const query = new URLSearchParams(window.location.search);
  const slug = query.get("slug");
  const editorTabs = LocalStorage.get(`editorTabs_${slug}`);
  let htmlString = "";
  if (editorTabs.length > 0) {
    editorTabs.forEach((tab: Tab) => {
      const extension = tab.name.split(".")[1];
      if (extension === "html") {
        htmlString += tab.content;
      }
      if (extension === "js") {
        htmlString += `<script>${tab.content}</script>`;
      }
      if (extension === "css") {
        htmlString += `<style>${tab.content}</style>`;
      }
    });
  }

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
    <main>
      <Preview onTitleRevealed={foundPreviewTitle} html={htmlString} />
    </main>
  );
};
