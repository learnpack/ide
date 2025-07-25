import styles from "./Container.module.css";
import CodeEditor from "../composites/Editor/Editor";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ChatTab } from "../Rigobot/Rigobot";
import Chat from "../sections/modals/Chat";
import Sidebar from "../sections/sidebar/Sidebar";
import { LessonRenderer } from "../composites/LessonRenderer/LessonRenderer";

type TPossibleTabs = "instructions" | "terminal" | "all" | "code";

export const Container = () => {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768 ? true : false
  );
  const [visibleTab, setVisibleTab] = useState(
    window.innerWidth <= 768 ? "instructions" : ("all" as TPossibleTabs)
  );
  const instructionsSectionRef = useRef<HTMLDivElement>(null);
  const codeSectionRef = useRef<HTMLDivElement>(null);

  const editorTabs = useStore((s) => s.editorTabs);
  const environment = useStore((s) => s.environment);
  const terminalShouldShow = useStore((s) => s.terminalShouldShow);
  const isRigoOpened = useStore((s) => s.isRigoOpened);
  const showSidebar = useStore((s) => s.showSidebar);
  const currentContent = useStore((s) => s.currentContent);
  const lastState = useStore((s) => s.lastState);
  const setTerminalShouldShow = useStore((s) => s.setTerminalShouldShow);
  const agent = useStore((s) => s.agent);
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

  const hideTerminal = () => {
    if (isMobile) {
      setVisibleTab("code");
    } else {
      setVisibleTab("all");
    }
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
    const isTerminalActive = editorTabs.some((t) => t.name === "terminal");

    if (isTerminalActive && (isMobile || isRigoOpened) && terminalShouldShow) {
      setVisibleTab("terminal");
    }

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
    }
  }, [currentContent, mode]);

  return (
    <>
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
            {editorTabs.length > 0 && (
              <div
                onClick={() => onChangeTab("instructions")}
                data-visible={visibleTab === "instructions" ? true : false}
              >
                {t("instructions")}
              </div>
            )}
            {editorTabs.length > 0 && !(agent === "vscode") && (
              <>
                <div
                  onClick={() => onChangeTab("code")}
                  data-visible={visibleTab === "code" ? true : false}
                >
                  {t("code")}
                </div>
                {/* <div
                  onClick={() => onChangeTab("terminal")}
                  data-visible={visibleTab === "terminal" ? true : false}
                >
                  {t("output")}
                </div> */}
              </>
            )}
          </div>
          <section
            ref={instructionsSectionRef}
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

          {editorTabs.length > 0 &&
            (agent !== "vscode" || environment === "localStorage") && (
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
                <CodeEditor
                  terminal={isMobile || isRigoOpened ? "hidden" : "normal"}
                />
              </section>
            )}
          {!(environment === "localhost") && (
            <section
              style={{
                display: visibleTab === "terminal" ? "block" : "none",
              }}
            >
              <CodeEditor hideTerminal={hideTerminal} terminal="only" />
            </section>
          )}
        </div>

        {isRigoOpened && window.innerWidth > 768 && <ChatTab />}
        {showSidebar && window.innerWidth > 768 && <Sidebar />}
      </main>
    </>
  );
};
