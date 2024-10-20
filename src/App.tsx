import { useEffect } from "react";
import "./App.css";
import "./index.css";
import "./components.css";

import LessonContainer from "./components/sections/lesson/LessonContainer";
import { SocketHandler } from "./components/composites/SocketHandler";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/sections/header";
import { ModalsContainer } from "./components/sections/modals";
import { ShortcutsListener } from "./components/composites/ShortcutListener";
import { NewHeader } from "./components/Header/NewHeader";
import { Container } from "./components/Container/Container";
import useStore from "./utils/store";

export default function Home() {
  const { environment, start, handleEnvironmentChange, theme } = useStore(
    (s) => ({
      environment: s.environment,
      start: s.start,
      handleEnvironmentChange: s.handleEnvironmentChange,
      theme: s.theme,
    })
  );
  useEffect(() => {
    start();

    document.addEventListener("environment-change", handleEnvironmentChange);
  }, []);

  useEffect(() => {
    console.log(theme, "THEME HAS CHANGED");
  }, [theme]);

  return (
    <main id="main-container" className={`${theme}`}>
      <ShortcutsListener>
        <ModalsContainer />
        <SocketHandler />
        {environment === "localhost" && (
          <>
            <Header />
            <LessonContainer />
          </>
        )}
        {environment === "localStorage" && (
          <>
            <NewHeader />
            <Container />
          </>
        )}
      </ShortcutsListener>
      <Toaster />
    </main>
  );
}
