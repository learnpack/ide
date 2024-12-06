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
  const { theme, toggleTheme, showSidebar, setShowSidebar } = useStore(
    (state) => ({
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      showSidebar: state.showSidebar,
      setShowSidebar: state.setShowSidebar,
    })
  );


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
            <span>
              <strong>v{versionSections.join(".")}</strong>
            </span>
          </section>
        </div>
      )}
    </>
  );
}
