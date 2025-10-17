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
import { eventBus } from "../../../managers/eventBus";
import { Modal } from "../../mockups/Modal";
import { deleteFile } from "../../../utils/creator";
import { Icon } from "../../Icon";

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
    mode,
    fetchExercises,
    createNewFile,
  } = useStore((state) => ({
    tabs: state.editorTabs,
    setTabs: state.setEditorTabs,
    getCurrentExercise: state.getCurrentExercise,
    updateFileContent: state.updateFileContent,
    cleanTerminal: state.cleanTerminal,
    theme: state.theme,
    updateDBSession: state.updateDBSession,
    mode: state.mode,
    fetchExercises: state.fetchExercises,
    createNewFile: state.createNewFile,
  }));

  const { t } = useTranslation();

  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [editorStatus, setEditorStatus] = useState<TEditorStatus>("UNMODIFIED");
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");

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
      if (mode === "creator") {
        updateFileContent(ex.slug, tab);
      }
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

  const handleDeleteFile = async (fileName: string) => {
    if (
      !window.confirm(
        t("confirm-delete-file") ||
          `Are you sure you want to delete ${fileName}?`
      )
    ) {
      return;
    }

    try {
      const ex = getCurrentExercise();
      await deleteFile(ex.slug, fileName);

      removeTab(tabs.find((tab) => tab.name === fileName)?.id || 0, fileName);

      await fetchExercises();

      console.log(`✅ File ${fileName} deleted successfully`);
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(
        t("error-deleting-file") || "Error deleting file. Please try again."
      );
    }
  };

  const handleTabClick = (id: number) => {
    const newTabs = tabs.map((tab) =>
      tab.id === id ? { ...tab, isActive: true } : { ...tab, isActive: false }
    );
    setTabs(newTabs);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      alert(t("file-name-required") || "File name is required");
      return;
    }

    try {
      await createNewFile(newFileName.trim());
      setShowCreateFileModal(false);
      setNewFileName("");
    } catch (error) {
      console.error("Error creating file:", error);
      alert(t("error-creating-file") || "Error creating file. Please try again.");
    }
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
    <div
      className="h-100"
      style={{ display: `${tabs.length === 0 ? "none" : "block"}` }}
    >
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
            {mode === "creator" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(tab.name);
                }}
                className="delete-file-btn"
                title={t("delete-file") || "Delete file"}
                style={{
                  marginLeft: "8px",
                  padding: "2px 6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "#ff4444",
                }}
              >
                <Icon size={10} name="Trash" />
              </button>
            )}
          </div>
        ))}
        {mode === "creator" && (
          <div className="tab add-file-tab">
            <button
              onClick={() => setShowCreateFileModal(true)}
              className="bg-2 padding-small rounded text-blue"
              title={t("new-file") || "New File"}
            >
              <Icon size={14} name="Plus" />
            </button>
          </div>
        )}
      </div>

      {!(terminal === "only") && (
        <div className="editor">
          {tabs.map(
            (tab) =>
              tab.isActive && (
                <div className="h-100" key={tab.id}>
                  {tab.name.includes("solution.hide") && (
                    <div className=" padding-small margin-children-none text-small bg-warning text-black">
                      <Markdowner
                        allowCreate={false}
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
                    height="100%"
                    key={tab.id}
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

      {terminalTab && !(terminal === "hidden") && (
        <Terminal
          terminalTab={terminalTab}
          terminalState={terminal}
          removeTab={removeTab}
          editorStatus={editorStatus}
        />
      )}

      {showCreateFileModal && (
        <Modal
          outsideClickHandler={() => {
            setShowCreateFileModal(false);
            setNewFileName("");
          }}
          showCloseButton={true}
          addPadding={true}
        >
          <div style={{ padding: "20px", minWidth: "300px" }}>
            <h3 style={{ marginBottom: "16px", color: "#333" }}>
              {t("create-new-file") || "Create New File"}
            </h3>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                {t("file-name") || "File Name"}
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={t("enter-file-name") || "Enter file name (e.g., script.js)"}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFile();
                  }
                }}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCreateFileModal(false);
                  setNewFileName("");
                }}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleCreateFile}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  background: "#02A9EA",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {t("create") || "Create"}
              </button>
            </div>
          </div>
        </Modal>
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
    if (!title || title === browserTabTitle) return;
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
        <Modal
          outsideClickHandler={() =>
            removeTab(terminalTab.id, terminalTab.name)
          }
          showCloseButton={false}
          addPadding={false}
        >
          {(getCurrentExercise().done || lastState === "error") && (
            <Toolbar
              editorStatus={editorStatus}
              position="relative"
              dropdownDirection="down"
            />
          )}
          <div className={`terminal ${terminalState}`}>
            <h5 className={`d-flex justify-between align-center `}>
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
            </h5>

            {showInfo && (
              <div className="text-small bg-secondary padding-small rounded margin-children-none">
                <Markdowner markdown={t("terminalInfo")} />
              </div>
            )}

            {terminalTab.content ? (
              <div>
                <Markdowner markdown={terminalTab.content} />
              </div>
            ) : (
              <Loader svg={svgs.blueRigoSvg} text={t("thinking...")} />
            )}
            <div className="d-flex justify-center gap-small">
              {!getCurrentExercise().done && lastState === "error" && (
                <AskForHint
                  getContext={() => {
                    return terminalTab.content;
                  }}
                  from="test"
                  onClick={() => removeTab(terminalTab.id, terminalTab.name)}
                />
              )}
              <SimpleButton
                text={t("continueWorking")}
                // svg={svgs.closeX}
                extraClass="bg-blue-rigo text-white rounded padding-small"
                action={() => removeTab(terminalTab.id, terminalTab.name)}
              />
            </div>
          </div>
        </Modal>
      )}
      {terminalTab && terminalTab.isHTML && (
        <Modal
          outsideClickHandler={() =>
            removeTab(terminalTab.id, terminalTab.name)
          }
          showCloseButton={false}
          addPadding={false}
        >
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
                  useIframe={true}
                />
              ) : (
                <Loader svg={svgs.blueRigoSvg} text={t("thinking...")} />
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

const NextButton = () => {
  const { currentExercisePosition, exercises } = useStore((state) => ({
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
  }));

  return (
    <SimpleButton
      disabled={currentExercisePosition === exercises.length - 1}
      action={() =>
        eventBus.emit("position_change", {
          position: Number(currentExercisePosition) + 1,
        })
      }
      svg={svgs.nextArrow}
      text={"Next"}
      extraClass="w-100 bg-success text-white big"
    />
  );
};

type EditorFooterProps = {
  editorStatus: TEditorStatus;
  position?: "absolute" | "fixed" | "sticky" | "relative";
  dropdownDirection?: "up" | "down";
};

export const Toolbar = ({
  editorStatus,
  position = "absolute",
  dropdownDirection = "up",
}: EditorFooterProps) => {
  const { t } = useTranslation();
  const {
    lastState,
    getCurrentExercise,
    // allowedActions,
    isBuildable,
    isTesteable,
    currentExercisePosition,
    exercises,
  } = useStore((state) => ({
    lastState: state.lastState,
    getCurrentExercise: state.getCurrentExercise,
    // allowedActions: state.allowedActions,
    isBuildable: state.isBuildable,
    isTesteable: state.isTesteable,
    handlePositionChange: state.handlePositionChange,
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
  }));

  const ex = getCurrentExercise();

  let letPass =
    lastState === "success" && ex.done && editorStatus === "MODIFIED";

  const onlyContinue = !isBuildable && !isTesteable;
  const isLastExercise = currentExercisePosition === exercises.length - 1;

  return (
    <div
      style={{ position: position }}
      className={`editor-footer ${position} ${editorStatus} ${lastState}`}
    >
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
          <FeedbackButton direction={dropdownDirection} />
        </div>
      )}

      {editorStatus === "MODIFIED" && !letPass && (
        <div className="footer-actions">
          {onlyContinue && !isLastExercise ? (
            <>
              <SimpleButton
                text={t("Continue")}
                extraClass="w-100 bg-blue text-white big"
                action={() =>
                  eventBus.emit("position_change", {
                    position: Number(currentExercisePosition) + 1,
                  })
                }
              />
            </>
          ) : (
            <>
              <CompileOptions dropdownDirection={dropdownDirection} />
              <ResetButton />
              <FeedbackButton direction={dropdownDirection} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
