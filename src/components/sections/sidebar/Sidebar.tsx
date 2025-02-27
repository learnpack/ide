import BugButton from "./BugButton";
import SimpleButton from "../../mockups/SimpleButton";
import ExercisesList from "./ExercisesList";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import packageInfo from "../../../../package.json";
import "./styles.css";
import { useState } from "react";

const version = packageInfo.version;
let versionSections = version.split(".");
versionSections[2] = String(parseInt(versionSections[2]) + 1);

export default function Sidebar() {
  const {
    theme,
    toggleTheme,
    showSidebar,
    setShowSidebar,
    userConsumables,
    isIframe,
    environment,
  } = useStore((state) => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    showSidebar: state.showSidebar,
    setShowSidebar: state.setShowSidebar,
    userConsumables: state.userConsumables,
    isIframe: state.isIframe,
    environment: state.environment,
  }));

  const [mode, setMode] = useState<"list" | "editor">("list");

  const closeSidebar = () => {
    const sidebar: HTMLElement | null =
      document.querySelector(".sidebar-component");
    sidebar?.classList.add("sidebar-disappear");
    sidebar?.addEventListener("animationend", () => {
      setShowSidebar(false);
    });
  };

  const isCreator =
    userConsumables.ai_generation > 0 && environment !== "localStorage";

  return (
    <>
      {showSidebar && (
        <div className="sidebar-component">
          <section className="d-flex gap-small align-center justify-between  bg-rigo  rounded text-white w-100">
            <p className="margin-0 padding-small">Menu</p>
            {!isIframe && (
              <SimpleButton
                action={toggleTheme}
                extraClass="pill svg-white"
                svg={theme === "dark" ? svgs.sun : svgs.moon}
              />
            )}
            {isCreator && (
              <SimpleButton
                action={() => {
                  mode === "list" ? setMode("editor") : setMode("list");
                }}
                extraClass="text-white"
                text={mode === "list" ? "List" : "Editor"}
              />
            )}
          </section>

          <ExercisesList mode={mode} closeSidebar={closeSidebar} />

          <section className="footer">
            <BugButton />
            <div className="hidden">
              <table>
                <thead>
                  <tr>
                    <th>AI Conversation Message</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>AI Conversation Message: </strong>
                    </td>
                    <td>{userConsumables.ai_conversation_message}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <span>
              <strong>v{versionSections.join(".")}</strong>
            </span>
          </section>
        </div>
      )}
    </>
  );
}
