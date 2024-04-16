import "./App.css";
import "./index.css";
import "./components.css";

import LessonContainer from "./components/sections/lesson/LessonContainer";
import { SocketHandler } from "./components/composites/SocketHandler";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/sections/header";
import { ModalsContainer } from "./components/sections/modals";
import { ShortcutsListener } from "./components/composites/ShortcutListener";

export default function Home() {
  return (
    <main id="main-container" className="">
      <ShortcutsListener>
        <ModalsContainer />
        <SocketHandler />
        <Header />
        <LessonContainer />
      </ShortcutsListener>
      <Toaster />
      
    </main>
  );
}
