import { useEffect } from "react";
import "./App.css";
import "./index.css";
import "./components.css";

import { SocketHandler } from "./components/composites/SocketHandler";
import { ModalsContainer } from "./components/sections/modals";
import { NewHeader } from "./components/Header/NewHeader";
import { Container } from "./components/Container/Container";
import useStore from "./utils/store";
// import i18n from "./utils/i18n";
import mermaid from "mermaid";
import { PublishNavbar } from "./components/Creator/PublishNavbar";
import PreviewGenerator from "./components/composites/PreviewImageGenerator/PreviewImageGenerator";
import { PositionHandler } from "./components/composites/PositionHandler/PositionHandler";

export default function Home() {
  const start = useStore((s) => s.start);
  const handleEnvironmentChange = useStore((s) => s.handleEnvironmentChange);
  const theme = useStore((s) => s.theme);
  const isIframe = useStore((s) => s.isIframe);
  const environment = useStore((s) => s.environment);

  useEffect(() => {
    console.log("Starting app");
    
    start();
    mermaid.initialize({ startOnLoad: false });

    // i18n.changeLanguage(language);
    document.addEventListener("environment-change", handleEnvironmentChange);
    return () => {
      document.removeEventListener(
        "environment-change",
        handleEnvironmentChange
      );
    };
  }, []);

  console.log("Refreshing app", {
    environment,
    isIframe,
    theme,
  });
  

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
