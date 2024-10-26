import styles from "./Container.module.css";
import CodeEditor from "../composites/Editor/Editor";
import LessonContainer from "../sections/lesson/LessonContainer";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

type TPossibleTabs = "instructions" | "terminal" | "all" | "code";

export const Container = () => {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768 ? true : false
  );
  const [visibleTab, setVisibleTab] = useState(
    window.innerWidth <= 768 ? "instructions" : ("all" as TPossibleTabs)
  );
  const {
    editorTabs,
    handleNext,
    environment,
    terminalShouldShow,
    setTerminalShouldShow,
  } = useStore((s) => ({
    editorTabs: s.editorTabs,
    handleNext: s.handleNext,
    environment: s.environment,
    setEditorTabs: s.setEditorTabs,
    terminalShouldShow: s.terminalShouldShow,
    setTerminalShouldShow: s.setTerminalShouldShow,
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
      if (window.innerWidth > 768) {
        setVisibleTab("all");
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

    if (isTerminalActive && isMobile && terminalShouldShow) {
      setVisibleTab("terminal");
    }

    if (editorTabs.length === 0) {
      if (window.innerWidth > 768) {
        setVisibleTab("all");
      } else {
        setVisibleTab("instructions");
      }
    }
  }, [editorTabs, terminalShouldShow]);

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
    <main className={styles.container}>
      <div className={styles.appTabs}>
        <div
          onClick={() => onChangeTab("instructions")}
          data-visible={visibleTab === "instructions" ? true : false}
        >
          {t("instructions")}
        </div>
        {editorTabs.length > 0 && (
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
        style={{
          display:
            visibleTab === "instructions" || visibleTab === "all"
              ? "block"
              : "none",
        }}
      >
        <LessonContainer continueAction={handleLessonContinue}>
          <h3 className={styles.hiddenOnMobile}> {t("instructions")} </h3>
        </LessonContainer>
      </section>
      {editorTabs.length > 0 && !(environment === "localhost") && (
        <section
          style={{
            display:
              visibleTab === "code" || visibleTab === "all" ? "block" : "none",
          }}
        >
          <CodeEditor terminal={isMobile ? "hidden" : "normal"} />
        </section>
      )}
      {!(environment === "localhost") && (
        <section
          style={{
            display: visibleTab === "terminal" ? "block" : "none"
          }}
        >
          <CodeEditor hideTerminal={hideTerminal} terminal="only" />
        </section>
      )}
    </main>
  );
};
