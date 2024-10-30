import React, { useEffect, useState, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import useStore from "../../../utils/store";
import { LocalStorage } from "../../../managers/localStorage";
import "./Editor.css";
import { svgs } from "../../../assets/svgs";
import FeedbackButton from "../../sections/header/FeedbackButton";
import ResetButton from "../../sections/header/ResetButton";

import { useTranslation } from "react-i18next";
import { debounce } from "../../../utils/lib";
import { Tab } from "../../../types/editor";
import { CompileOptions } from "../../sections/header/CompileOptions";
import SimpleButton from "../../mockups/SimpleButton";

const languageMap: { [key: string]: string } = {
  ".js": "javascript",
  ".py": "python",
  ".css": "css",
  ".html": "html",
  // Agrega más extensiones y lenguajes según sea necesario
};

const getLanguageFromExtension = (fileName: string): string => {
  const extension = fileName.slice(fileName.lastIndexOf("."));
  return languageMap[extension] || "plaintext";
};

type TEditorStatus = "UNMODIFIED" | "MODIFIED" | "ERROR" | "SUCCESS";

type TCodeEditorProps = {
  terminal: "hidden" | "only" | "normal";
  hideTerminal?: () => void;
};

const CodeEditor: React.FC<TCodeEditorProps> = ({
  terminal = "normal",
  hideTerminal,
}) => {
  const {
    tabs,
    setTabs,
    getCurrentExercise,
    updateFileContent,
    cleanTerminal,
    theme,
    updateDBSession,
  } = useStore((state) => ({
    tabs: state.editorTabs,
    getCurrentExercise: state.getCurrentExercise,
    updateFileContent: state.updateFileContent,
    cleanTerminal: state.cleanTerminal,
    theme: state.theme,
    updateDBSession: state.updateDBSession,
    setTabs: state.setEditorTabs,
  }));

  const [editorTheme, setEditorTheme] = useState("light");
  const [editorStatus, setEditorStatus] = useState<TEditorStatus>("UNMODIFIED");

  const debouncedStore = useCallback(
    debounce(() => {
      updateDBSession();
    }, 5000),
    []
  );

  const updateContent = (id: number, content: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === id ? { ...tab, content } : tab
    );

    setTabs(newTabs);

    const ex = getCurrentExercise();

    const withoutTerminal = newTabs.filter((t) => t.name !== "terminal");
    LocalStorage.setEditorTabs(ex.slug, withoutTerminal);

    setEditorStatus("MODIFIED");
    const tab = newTabs.find((t) => t.id === id);

    if (tab) {
      updateFileContent(ex.slug, tab);
      debouncedStore();
    }
  };

  const removeTab = (id: number, name: string) => {
    if (name === "terminal" && hideTerminal) {
      hideTerminal();
      cleanTerminal();
      return;
    }

    const newTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(newTabs);
    if (newTabs.length > 0) {
      setTabs(
        newTabs.map((tab, index) => ({
          ...tab,
          isActive: index === 0,
        }))
      );
    }
  };

  const handleTabClick = (id: number) => {
    const newTabs = tabs.map((tab) =>
      tab.id === id ? { ...tab, isActive: true } : { ...tab, isActive: false }
    );
    setTabs(newTabs);
  };

  useEffect(() => {
    if (theme === "light") {
      setEditorTheme("light");
    } else if (theme === "dark") {
      setEditorTheme("vs-dark");
    }
  }, [theme]);

  useEffect(() => {
    const someModified = tabs.some((t: Tab) => Boolean(t.modified));
    if (someModified) {
      setEditorStatus("MODIFIED");
    }
  }, [tabs]);

  const terminalTab = tabs.find((tab) => tab.name === "terminal");

  const filteredTabs = tabs.filter((tab) => tab.name !== "terminal");

  return (
    <div style={{ display: `${tabs.length === 0 ? "none" : "block"}` }}>
      <div
        className="tabs"
        style={{ display: terminal === "only" ? "none" : "flex" }}
      >
        {filteredTabs.map((tab) => (
          <div key={tab.id} className={`tab ${tab.isActive ? "active" : ""}`}>
            <button onClick={() => handleTabClick(tab.id)}>{tab.name}</button>
          </div>
        ))}
      </div>

      {!(terminal === "only") && (
        <div className="editor">
          {tabs.map(
            (tab) =>
              tab.isActive && (
                <MonacoEditor
                  className="editor-monaco"
                  key={tab.id}
                  height="300px"
                  language={getLanguageFromExtension(tab.name)}
                  theme={editorTheme}
                  value={tab.content}
                  onChange={(value) => updateContent(tab.id, value || "")}
                  options={{
                    minimap: {
                      enabled: false,
                    },
                    fontSize: 15,
                    bracketPairColorization: {
                      enabled: true,
                    },
                    cursorBlinking: "smooth",
                    wordWrap: "on",
                    padding: {
                      top: 10,
                      bottom: 0,
                    },
                    scrollbar: {
                      vertical: "hidden",
                      horizontal: "hidden",
                    },
                    lineNumbersMinChars: 3,
                    readOnly:
                      tab.name === "terminal" ||
                      tab.name.includes("solution.hide"),
                  }}
                />
              )
          )}
          <EditorFooter editorStatus={editorStatus} />
        </div>
      )}
      {terminalTab && (
        <div className={`terminal ${terminal}`}>
          <h5>
            <span>Terminal</span>{" "}
            <button onClick={() => removeTab(terminalTab.id, terminalTab.name)}>
              &times;
            </button>
          </h5>
          <pre>{terminalTab.content}</pre>
          {terminal === "only" && getCurrentExercise().done && (
            <EditorFooter editorStatus={editorStatus} />
          )}
        </div>
      )}
    </div>
  );
};

const NextButton = () => {
  const { currentExercisePosition, handlePositionChange, exercises } = useStore(
    (state) => ({
      currentExercisePosition: state.currentExercisePosition,
      handlePositionChange: state.handlePositionChange,
      exercises: state.exercises,
    })
  );

  return (
    <SimpleButton
      disabled={currentExercisePosition === exercises.length - 1}
      action={() => handlePositionChange(Number(currentExercisePosition) + 1)}
      svg={svgs.nextArrow}
      text={"Next"}
      extraClass="w-100 bg-success text-white big"
    />
  );
};

type EditorFooterProps = {
  editorStatus: TEditorStatus;
};

const EditorFooter = ({ editorStatus }: EditorFooterProps) => {
  const { t } = useTranslation();
  const { lastState, getCurrentExercise } = useStore((state) => ({
    lastState: state.lastState,
    getCurrentExercise: state.getCurrentExercise,
  }));

  const ex = getCurrentExercise();

  let letPass =
    lastState === "success" && ex.done && editorStatus === "MODIFIED";

  return (
    <div className={`editor-footer ${editorStatus} ${lastState}`}>
      {letPass && (
        <div className="footer-actions">
          <ResetButton />
          <NextButton />
        </div>
      )}

      {editorStatus === "UNMODIFIED" && !letPass && (
        <div className="not-started">
          <div>
            <span>{svgs.learnpackLogo}</span>
            <span>{t("read-instructions")}</span>
          </div>
          <FeedbackButton direction="up" />
        </div>
      )}

      {editorStatus === "MODIFIED" && !letPass && (
        <div className="footer-actions">
          <CompileOptions />
          <ResetButton />
          <FeedbackButton direction="up" />
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
