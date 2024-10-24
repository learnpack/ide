import BugButton from "./BugButton";
import SimpleButton from "../../mockups/SimpleButton";
import ExercisesList from "./ExercisesList";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import packageInfo from "../../../../package.json";
import { useTranslation } from "react-i18next";
import "./styles.css";
import { DEV_MODE } from "../../../utils/lib";
import { FetchManager } from "../../../managers/fetchManager";
const version = packageInfo.version;
let versionSections = version.split(".");
versionSections[2] = String(parseInt(versionSections[2]) + 1);

function drawCircle(percentage: number) {
  const canvas = document.getElementById(
    "percentageCanvas"
  ) as HTMLCanvasElement;

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const radius = 20;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (!ctx) return;
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(224, 224, 224, 0.311)"; // Background color
  ctx.fill();

  // Draw the progress circle
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(
    centerX,
    centerY,
    radius,
    -Math.PI / 2,
    Math.PI * 2 * percentage - Math.PI / 2
  );
  ctx.closePath();
  ctx.fillStyle = "#21b761"; // Progress color
  ctx.fill();
}

export default function Sidebar() {
  const { t } = useTranslation();
  const { configObject, language, lessonTitle, theme, toggleTheme, exercises } =
    useStore((state) => ({
      configObject: state.configObject,
      language: state.language,
      lessonTitle: state.lessonTitle,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
      exercises: state.exercises,
    }));
  const [showSidebar, setShowSidebar] = useState(false);
  const [progress, setProgress] = useState({
    solved: exercises.filter((e: any) => e.done === true).length,
    graded: exercises.filter((e: any) => e.graded).length,
  });

  let title = lessonTitle;
  if (configObject && typeof configObject.config.title === "object") {
    if (Object.keys(configObject.config.title).includes(language)) {
      title = configObject.config.title[language];
    }
  }

  const closeSidebar = () => {
    const sidebar: HTMLElement | null =
      document.querySelector(".sidebar-component");
    sidebar?.classList.add("sidebar-disappear");
    sidebar?.addEventListener("animationend", () => {
      setShowSidebar(false);
    });
  };

  useEffect(() => {
    const _progress = {
      solved: exercises.filter((e: any) => e.done === true).length,
      graded: exercises.filter((e: any) => e.graded).length,
    };
    setProgress(_progress);
    const percentage = _progress.solved / _progress.graded;
    drawCircle(percentage);
  }, [showSidebar]);

  const devLogout = async () => {
    await FetchManager.logout();
  };

  return (
    <>
      {showSidebar &&
        createPortal(
          <>
            <div className="sidebar-component">
              <section>
                <h2>{title}</h2>
              </section>
              <section className="min-width">
                <p className="d-flex align-center gap-small">
                  <canvas
                    width={"50"}
                    height={"50"}
                    id="percentageCanvas"
                  ></canvas>
                  <span>
                    {progress.solved}/{progress.graded} {t("solved")}
                  </span>
                </p>

                <SimpleButton action={closeSidebar} svg={svgs.closeIcon} />
              </section>
              <ExercisesList closeSidebar={closeSidebar} />

              <section className="footer">
                <BugButton />
                <span>
                  <strong>v{versionSections.join(".")}</strong>
                </span>
                <SimpleButton
                  text={t("theme")}
                  action={toggleTheme}
                  extraClass="clickeable pill"
                  svg={theme === "dark" ? svgs.sun : svgs.moon}
                />
                {!DEV_MODE && (
                  <SimpleButton
                    action={devLogout}
                    extraClass="btn-dark pill"
                    text={"logout"}
                  />
                )}
              </section>
            </div>
          </>,
          document.body
        )}
      <SimpleButton
        svg={svgs.dropdownButton}
        id="sidebar-toggle"
        action={() => {
          setShowSidebar(true);
        }}
      />
    </>
  );
}
