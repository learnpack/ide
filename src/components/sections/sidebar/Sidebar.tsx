import BugButton from "./BugButton";
import SimpleButton from "../../mockups/SimpleButton";
import ExercisesList from "./ExercisesList";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import packageInfo from "../../../../package.json";
import "./styles.css";

const version = packageInfo.version;
let versionSections = version.split(".");
versionSections[2] = String(parseInt(versionSections[2]) + 1);

export default function Sidebar() {
  const {
    theme,
    toggleTheme,
    showSidebar,
    setShowSidebar,
    isIframe,
    mode,
    isCreator,
    setMode,
  } = useStore((state) => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    showSidebar: state.showSidebar,
    setShowSidebar: state.setShowSidebar,
    isIframe: state.isIframe,
    mode: state.mode,
    setMode: state.setMode,
    isCreator: state.isCreator,
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
                  mode === "student" ? setMode("creator") : setMode("student");
                }}
                extraClass="text-white"
                svg={mode === "student" ? svgs.edit : svgs.run}
                // text={mode === "student" ? "Creator" : "Student"}
              />
            )}
          </section>

          <ExercisesList mode={mode} closeSidebar={closeSidebar} />

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
