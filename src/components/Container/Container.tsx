import styles from "./Container.module.css";
import CodeEditor from "../composites/Editor/Editor";
import LessonContainer from "../sections/lesson/LessonContainer";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ChatTab } from "../Rigobot/Rigobot";
import Chat from "../sections/modals/Chat";

type TPossibleTabs = "instructions" | "terminal" | "all" | "code";

export const Container = () => {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768 ? true : false
  );
  const [visibleTab, setVisibleTab] = useState(
    window.innerWidth <= 768 ? "instructions" : ("all" as TPossibleTabs)
  );
  const instructionsSectionRef = useRef<HTMLDivElement>(null);

  const {
    editorTabs,
    handleNext,
    environment,
    terminalShouldShow,
    setTerminalShouldShow,
    isRigoOpened,
  } = useStore((s) => ({
    editorTabs: s.editorTabs,
    handleNext: s.handleNext,
    environment: s.environment,
    setEditorTabs: s.setEditorTabs,
    terminalShouldShow: s.terminalShouldShow,
    setTerminalShouldShow: s.setTerminalShouldShow,
    isRigoOpened: s.isRigoOpened,
  }));

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
    setVisibleTab("code");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !isRigoOpened) {
        setVisibleTab("all");
        setIsMobile(false);
      }
      if (window.innerWidth > 768 && isRigoOpened) {
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

    if (editorTabs.length === 0) {
      if (window.innerWidth > 768 && !isRigoOpened) {
        setVisibleTab("all");
      } else {
        setVisibleTab("instructions");
      }
    }

    if (instructionsSectionRef.current) {
      instructionsSectionRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [editorTabs, terminalShouldShow]);

  useEffect(() => {
    if (isRigoOpened) {
      if (visibleTab === "all") {
        setVisibleTab("instructions");
      }
    }
    if (!isMobile && !isRigoOpened) {
      setVisibleTab("all");
    }
  }, [isRigoOpened]);

  const handleLessonContinue = () => {
    if (isMobile && editorTabs.length > 0) {
      setVisibleTab("code");
      return;
    } else if (!isMobile && editorTabs.length > 0) {
      console.log("Start coding at the right!");
    } else {
      handleNext();
    }
  };

  return (
    <>
      {isRigoOpened && window.innerWidth < 768 && <Chat />}
      <main className={styles.container}>
        <div
          style={{
            paddingTop: isRigoOpened || isMobile ? "40px" : "0",
          }}
          className={styles.content}
        >
          <div
            style={{ display: isRigoOpened || isMobile ? "flex" : "none" }}
            className={styles.appTabs}
          >
            <div
              onClick={() => onChangeTab("instructions")}
              data-visible={visibleTab === "instructions" ? true : false}
            >
              {t("instructions")}
            </div>
            {editorTabs.length > 0 && !(environment === "localhost") && (
              <>
                <div
                  onClick={() => onChangeTab("code")}
                  data-visible={visibleTab === "code" ? true : false}
                >
                  {t("code")}
                </div>
                <div
                  onClick={() => onChangeTab("terminal")}
                  data-visible={visibleTab === "terminal" ? true : false}
                >
                  {t("output")}
                </div>
              </>
            )}
          </div>
          <section
            ref={instructionsSectionRef}
            style={{
              display:
                visibleTab === "instructions" || visibleTab === "all"
                  ? "block"
                  : "none",
            }}
          >
            <LessonContainer continueAction={handleLessonContinue}>
              <h3
                style={{
                  display: !isRigoOpened && !isMobile ? "block" : "none",
                }}
                className={"hiddenOnMobile " + "active-hr"}
              >
                {t("instructions")}{" "}
              </h3>
            </LessonContainer>
            {/* <div className={styles.continueReading}>
          {t("continue-reading")}
        </div> */}
          </section>
          {editorTabs.length > 0 && !(environment === "localhost") && (
            <section
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
      </main>
    </>
  );
};
