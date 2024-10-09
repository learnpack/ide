import { useState, useEffect } from "react";
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
import { ENVIRONMENT } from "./utils/lib";

export default function Home() {
  const [environment, setEnvironment] = useState(ENVIRONMENT); // Initialize state

  useEffect(() => {
    const handleEnvironmentChange = (event: any) => {
      setEnvironment(event.detail.environment);
    };

    // Add event listener
    document.addEventListener("environment-change", handleEnvironmentChange);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener(
        "environment-change",
        handleEnvironmentChange
      );
    };
  }, []);

  return (
    <main id="main-container" className="">
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
