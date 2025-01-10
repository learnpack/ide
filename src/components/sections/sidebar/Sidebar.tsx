import BugButton from "./BugButton";
import SimpleButton from "../../mockups/SimpleButton";
import ExercisesList from "./ExercisesList";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
import packageInfo from "../../../../package.json";
// import { useTranslation } from "react-i18next";
import "./styles.css";
// import { DEV_MODE } from "../../../utils/lib";

const version = packageInfo.version;
let versionSections = version.split(".");
versionSections[2] = String(parseInt(versionSections[2]) + 1);

export default function Sidebar() {
  const { theme, toggleTheme, showSidebar, setShowSidebar, userConsumables } =
    useStore((state) => ({
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      showSidebar: state.showSidebar,
      setShowSidebar: state.setShowSidebar,
      userConsumables: state.userConsumables,
    }));

  const closeSidebar = () => {
    const sidebar: HTMLElement | null =
      document.querySelector(".sidebar-component");
    sidebar?.classList.add("sidebar-disappear");
    sidebar?.addEventListener("animationend", () => {
      setShowSidebar(false);
    });
  };

  return (
    <>
      {showSidebar && (
        <div className="sidebar-component">
          <section className="d-flex gap-small align-center justify-between min-width bg-rigo padding-medium rounded text-white ">
            <span>Menu</span>
            <SimpleButton
              action={toggleTheme}
              extraClass="pill svg-white"
              svg={theme === "dark" ? svgs.sun : svgs.moon}
            />
          </section>

          <ExercisesList closeSidebar={closeSidebar} />

          <section className="footer">
            <BugButton />
            <div className="hidden">
              <table>
                <tr>
                  <td>
                    <strong>AI Compilation: </strong>
                  </td>
                  <td>{userConsumables.ai_compilation}</td>
                </tr>
                <tr>
                  <td>
                    <strong>AI Conversation Message: </strong>
                  </td>
                  <td>{userConsumables.ai_conversation_message}</td>
                </tr>
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
