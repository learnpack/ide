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
import { Preview } from "../Preview/Preview";
import { AskForHint } from "../AskForHint/AskForHint";
import { Loader } from "../Loader/Loader";
import { TEditorTab } from "../../../utils/storeTypes";
import { Markdowner } from "../Markdowner/Markdowner";
import { Alert } from "../Alert/Alert";

const languageMap: { [key: string]: string } = {
  ".js": "javascript",
  ".py": "python",
  ".css": "css",
  ".html": "html",
  ".jsx": "javascript",
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
    setTabs: state.setEditorTabs,
    getCurrentExercise: state.getCurrentExercise,
    updateFileContent: state.updateFileContent,
    cleanTerminal: state.cleanTerminal,
    theme: state.theme,
    updateDBSession: state.updateDBSession,
  }));

  const { t } = useTranslation();

  const [editorTheme, setEditorTheme] = useState("vs-dark");
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
    setEditorTheme("vs-dark");
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
          <div
            key={tab.id + tab.name}
            className={`tab ${tab.isActive ? "active" : ""}`}
          >
            <button onClick={() => handleTabClick(tab.id)}>
              {tab.name.includes("solution.hide")
                ? t("model-solution")
                : tab.name}
            </button>
          </div>
        ))}
      </div>

      {!(terminal === "only") && (
        <div className="editor">
          {tabs.map(
            (tab) =>
              tab.isActive && (
                <div key={tab.id}>
                  {tab.name.includes("solution.hide") && (
                    <div className=" padding-small margin-children-none text-small bg-warning text-black">
                      <Markdowner
                        markdown={t("solution-tab-not-editable", {
                          switchTo:
                            filteredTabs.filter(
                              (t) => !t.name.includes("solution")
                            ).length > 1
                              ? t("another-tab")
                              : filteredTabs[0].name,
                        })}
                      />
                    </div>
                  )}
                  <MonacoEditor
                    className="editor-monaco"
                    key={tab.id}
                    height="400px"
                    language={getLanguageFromExtension(tab.name)}
                    theme={editorTheme}
                    value={tab.content}
                    onChange={(value) => updateContent(tab.id, value || "")}
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      fontSize: 16,
                      bracketPairColorization: {
                        enabled: true,
                      },
                      cursorBlinking: "smooth",
                      wordWrap: "off",
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
                </div>
              )
          )}
          <Toolbar editorStatus={editorStatus} />
        </div>
      )}

      {terminalTab && (
        <Terminal
          terminalTab={terminalTab}
          terminalState={terminal}
          removeTab={removeTab}
          editorStatus={editorStatus}
        />
      )}
    </div>
  );
};

const Terminal = ({
  terminalTab,
  terminalState,
  removeTab,
  editorStatus,
}: {
  terminalTab: TEditorTab;
  terminalState: "hidden" | "only" | "normal";
  removeTab: (id: number, name: string) => void;
  editorStatus: TEditorStatus;
}) => {
  const { t } = useTranslation();
  const { getCurrentExercise, lastState } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    lastState: state.lastState,
    // editorStatus: state.editorStatus,
  }));

  const [showInfo, setShowInfo] = useState(false);

  const [browserTabTitle, setBrowserTabTitle] = useState(
    window.location.host + "/preview"
  );

  const outputFromMessages = {
    build: t("terminalOutput"),
    test: t("tests-feedback"),
  };

  const foundPreviewTitle = (title: string) => {
    if (!title) return;
    setBrowserTabTitle(title);
  };

  const openTabAndSendMessage = (html: string, isReact: boolean) => {
    const newTab = window.open(
      `/preview?slug=${getCurrentExercise().slug}`,
      "__blank"
    );

    if (newTab) {
      newTab.onload = () => {
        newTab.postMessage({ html, isReact }, "*");
      };
    } else {
      console.error("Failed to open new tab.");
    }
  };

  return (
    <>
      {terminalTab && !terminalTab.isHTML && (
        <div className={`terminal ${terminalState}`}>
          <h5 className="d-flex justify-between align-center">
            <span className="d-flex align-center gap-small">
              {terminalTab &&
                terminalTab.from &&
                outputFromMessages[terminalTab.from]}
              <span
                onClick={() => setShowInfo(!showInfo)}
                className="circle bg-secondary padding-small d-flex align-center justify-center pointer"
              >
                ?
              </span>
            </span>
            <SimpleButton
              action={() => removeTab(terminalTab.id, terminalTab.name)}
              svg={svgs.redClose}
            />
          </h5>

          {showInfo && (
            <div className="text-small bg-secondary padding-small rounded margin-children-none">
              <Markdowner markdown={t("terminalInfo")} />
            </div>
          )}

          {terminalTab.content ? (
            <>
              <Markdowner markdown={terminalTab.content} />
            </>
          ) : (
            <Loader svg={svgs.blueRigoSvg} text={t("thinking...")} />
          )}
          {!getCurrentExercise().done && lastState === "error" && (
            <AskForHint
              getContext={() => {
                return terminalTab.content;
              }}
              from="test"
            />
          )}

          {terminalState === "only" && getCurrentExercise().done && (
            <Toolbar editorStatus={editorStatus} />
          )}
        </div>
      )}
      {terminalTab && terminalTab.isHTML && (
        <div className={`terminal ${terminalState} html browser`}>
          <div className="d-flex justify-between align-center browser-header">
            <div title={browserTabTitle} className=" browser-tab">
              {browserTabTitle}
            </div>
            <div className="d-flex ">
              <SimpleButton
                title={t("display-another-tab ")}
                size="mini"
                svg={svgs.newTab}
                extraClass="hover rounded"
                action={() =>
                  openTabAndSendMessage(
                    terminalTab.content,
                    terminalTab.isReact || false
                  )
                }
              />
              <SimpleButton
                title={t("close-tab")}
                size="mini"
                svg={svgs.closeX}
                extraClass="danger-on-hover rounded"
                action={() => removeTab(terminalTab.id, terminalTab.name)}
              />
            </div>
          </div>
          <div className="browser-body">
            {terminalTab.content ? (
              <Preview
                onTitleRevealed={foundPreviewTitle}
                html={terminalTab.content}
                useIframe={terminalTab.isReact}
              />
            ) : terminalTab.status === "ready" ? (
              <Alert>
                <p className="text-small">{t("website-built-no-body")}</p>
              </Alert>
            ) : (
              <Loader svg={svgs.blueRigoSvg} text={t("thinking...")} />
            )}
          </div>
        </div>
      )}
    </>
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

export const Toolbar = ({ editorStatus }: EditorFooterProps) => {
  const { t } = useTranslation();
  const {
    lastState,
    getCurrentExercise,
    allowedActions,
    isBuildable,
    isTesteable,
    handlePositionChange,
    currentExercisePosition,
  } = useStore((state) => ({
    lastState: state.lastState,
    getCurrentExercise: state.getCurrentExercise,
    allowedActions: state.allowedActions,
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
    handlePositionChange: state.handlePositionChange,
    currentExercisePosition: state.currentExercisePosition,
  }));

  const ex = getCurrentExercise();

  let letPass =
    lastState === "success" && ex.done && editorStatus === "MODIFIED";

  const onlyContinue = !isBuildable && !isTesteable;

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
          {onlyContinue ? (
            <SimpleButton
              text={t("Continue")}
              extraClass="w-100 bg-blue text-white big"
              action={() =>
                handlePositionChange(Number(currentExercisePosition) + 1)
              }
            />
          ) : (
            <>
              <CompileOptions allowedActions={allowedActions} />
              <ResetButton />
              <FeedbackButton direction="up" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
