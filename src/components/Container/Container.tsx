import styles from "./Container.module.css";
import CodeEditor from "../composites/Editor/Editor";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import Chat from "../sections/modals/Chat";
import Sidebar from "../sections/sidebar/Sidebar";
import { LessonRenderer } from "../composites/LessonRenderer/LessonRenderer";
import { AgentTab } from "../Rigobot/Agent";
import StepsProgress from "../composites/StepsProgress/StepsProgress";

type TPossibleTabs = "instructions" | "terminal" | "all" | "code";

export const Container = () => {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768 ? true : false
  );
  const [visibleTab, setVisibleTab] = useState(
    window.innerWidth <= 768 ? "instructions" : ("all" as TPossibleTabs)
  );
  const instructionsSectionRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const codeSectionRef = useRef<HTMLDivElement>(null);

  const editorTabs = useStore((s) => s.editorTabs);
  const environment = useStore((s) => s.environment);
  const testingEnvironment = useStore((s) => s.testingEnvironment);
  const terminalShouldShow = useStore((s) => s.terminalShouldShow);
  const isRigoOpened = useStore((s) => s.isRigoOpened);
  const showSidebar = useStore((s) => s.showSidebar);
  const currentContent = useStore((s) => s.currentContent);
  const lastState = useStore((s) => s.lastState);
  const setTerminalShouldShow = useStore((s) => s.setTerminalShouldShow);
  // const agent = useStore((s) => s.agent);
  const mode = useStore((s) => s.mode);

  const { t } = useTranslation();

  const onChangeTab = (tabName: TPossibleTabs) => {
    if (
      tabName === "terminal" &&
      !editorTabs.some((t) => t.name === "terminal")
    ) {
      toast.error(t("compile-first"));
      return;
    }

    if (tabName === "code") {
      setTerminalShouldShow(false);
    }
    setVisibleTab(tabName);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !isRigoOpened && !showSidebar) {
        setVisibleTab("all");
        setIsMobile(false);
      }
      if (window.innerWidth > 768 && isRigoOpened && !showSidebar) {
        setVisibleTab("instructions");
        setIsMobile(false);
      }
      if (window.innerWidth <= 768) {
        if (visibleTab === "all") {
          setVisibleTab("instructions");
        }
        setIsMobile(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [visibleTab]);

  useEffect(() => {
    const hasSolution = editorTabs.some((t) =>
      t.name.includes("solution.hide")
    );

    if (
      hasSolution &&
      !terminalShouldShow &&
      (isMobile || isRigoOpened || showSidebar)
    ) {
      setVisibleTab("code");
    }

    if (editorTabs.length === 0) {
      if (window.innerWidth > 768 && !isRigoOpened) {
        setVisibleTab("all");
      } else {
        setVisibleTab("instructions");
      }
    }
  }, [editorTabs, terminalShouldShow]);

  useEffect(() => {
    if (
      (visibleTab === "code" || visibleTab === "all") &&
      codeSectionRef.current
    ) {
      codeSectionRef.current?.scrollTo({
        top: codeSectionRef.current?.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [lastState]);

  useEffect(() => {
    if (isRigoOpened || showSidebar) {
      if (visibleTab === "all") {
        setVisibleTab("instructions");
      }
    }
    if (!isMobile && !isRigoOpened && !showSidebar) {
      setVisibleTab("all");
    }
  }, [isRigoOpened, showSidebar]);

  useEffect(() => {
    if (instructionsSectionRef.current && mode !== "creator") {
      instructionsSectionRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else if (instructionsSectionRef.current && mode === "creator") {
      instructionsSectionRef.current.scrollTo({
        top: lastScrollTopRef.current,
        behavior: "instant",
      });
    }
  }, [currentContent, mode]);

  const handleScroll = () => {
    if (instructionsSectionRef.current) {
      lastScrollTopRef.current = instructionsSectionRef.current?.scrollTop;
    }
  };

  const displayCodeEditor = useCallback((): boolean => {

    const isSupportedEnvironment = ["localStorage", "scorm", "creatorWeb"].includes(environment);
    // if (editorTabs.length > 0 && ["localStorage", "scorm", "creatorWeb"].includes(environment)) {
    if (editorTabs.length > 0 && (isSupportedEnvironment || testingEnvironment === "cloud")) {
      return true;
    }
    return false;
  }, [editorTabs, environment, testingEnvironment]);

  return (
    <>
      <StepsProgress />
      {isRigoOpened && window.innerWidth < 768 && <Chat />}
      {showSidebar && window.innerWidth < 768 && <Sidebar />}
      <main className={styles.container}>
        <div
          style={{
            paddingTop: isMobile && editorTabs.length > 0 ? "40px" : "0",
          }}
          className={styles.content}
        >
          <div
            style={{
              display: isMobile ? "flex" : "none",
            }}
            className={styles.appTabs}
          >
            {displayCodeEditor() && (
              <>
                <div
                  onClick={() => onChangeTab("instructions")}
                  data-visible={visibleTab === "instructions" ? true : false}
                >
                  {t("instructions")}
                </div>
                <div
                  onClick={() => onChangeTab("code")}
                  data-visible={visibleTab === "code" ? true : false}
                >
                  {t("code")}
                </div>
              </>
            )}
          </div>
          <section
            ref={instructionsSectionRef}
            onScroll={handleScroll}
            style={{
              background: "var(--app-bg-color)",
              display:
                visibleTab === "instructions" || visibleTab === "all"
                  ? "block"
                  : "none",
            }}
          >
            <LessonRenderer />
          </section>
          {displayCodeEditor() && (
            <section
              ref={codeSectionRef}
              className="w-100 "
              style={{
                display:
                  visibleTab === "code" || visibleTab === "all"
                    ? "block"
                    : "none",
              }}
            >
              <CodeEditor terminal={isRigoOpened ? "hidden" : "normal"} />
            </section>
          )}
        </div>

        {isRigoOpened && window.innerWidth > 768 && <AgentTab />}
        {showSidebar && window.innerWidth > 768 && <Sidebar />}
      </main>
    </>
  );
};
