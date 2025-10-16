import { useEffect } from "react";
import "./App.css";
import "./index.css";
import "./components.css";

import { SocketHandler } from "./components/composites/SocketHandler";
import { ModalsContainer } from "./components/sections/modals";
import { NewHeader } from "./components/Header/NewHeader";
import { Container } from "./components/Container/Container";
import useStore from "./utils/store";
import i18n from "./utils/i18n";
import mermaid from "mermaid";
import { PublishNavbar } from "./components/Creator/PublishNavbar";
import PreviewGenerator from "./components/composites/PreviewImageGenerator/PreviewImageGenerator";
import { PositionHandler } from "./components/composites/PositionHandler/PositionHandler";

export default function Home() {
  const {
    start,
    handleEnvironmentChange,
    theme,
    isIframe,
    language,
    environment,
  } = useStore((s) => ({
    environment: s.environment,
    start: s.start,
    handleEnvironmentChange: s.handleEnvironmentChange,
    theme: s.theme,
    isIframe: s.isIframe,
    language: s.language,
  }));

  useEffect(() => {
    start();
    mermaid.initialize({ startOnLoad: false });

    i18n.changeLanguage(language);
    document.addEventListener("environment-change", handleEnvironmentChange);
    return () => {
      document.removeEventListener(
        "environment-change",
        handleEnvironmentChange
      );
    };
  }, []);

  console.log("Refreshing app");
  

  return (
    <main
      id="main-container"
      className={`${theme} ${isIframe ? "iframe-mode" : ""}`}
    >
      <ModalsContainer />
      <PublishNavbar />
      <PositionHandler />
      {environment === "creatorWeb" && <PreviewGenerator />}
      <SocketHandler />
      <NewHeader />
      <Container />
    </main>
  );
}
