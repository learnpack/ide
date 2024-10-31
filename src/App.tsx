import { useEffect } from "react";
import "./App.css";
import "./index.css";
import "./components.css";

import { SocketHandler } from "./components/composites/SocketHandler";
import { Toaster } from "react-hot-toast";
import { ModalsContainer } from "./components/sections/modals";
import { ShortcutsListener } from "./components/composites/ShortcutListener";
import { NewHeader } from "./components/Header/NewHeader";
import { Container } from "./components/Container/Container";
import useStore from "./utils/store";

export default function Home() {
  const { start, handleEnvironmentChange, theme, isIframe } = useStore((s) => ({
    environment: s.environment,
    start: s.start,
    handleEnvironmentChange: s.handleEnvironmentChange,
    theme: s.theme,
    isIframe: s.isIframe,
  }));

  useEffect(() => {
    start();

    document.addEventListener("environment-change", handleEnvironmentChange);
  }, []);

  return (
    <main
      id="main-container"
      className={`${theme} ${isIframe ? "iframe-mode" : ""}`}
    >
      <ShortcutsListener>
        <ModalsContainer />
        <SocketHandler />
        <NewHeader />
        <Container />
      </ShortcutsListener>
      <Toaster />
    </main>
  );
}
