import React, { useEffect, useState} from "react";
import MonacoEditor from "@monaco-editor/react";
import useStore from "../../../utils/store";
import { LocalStorage } from "../../../managers/localStorage";
import "./Editor.css";
import { svgs } from "../../../assets/svgs";
import FeedbackButton from "../../sections/header/FeedbackButton";
import ResetButton from "../../sections/header/ResetButton";

import { useTranslation } from "react-i18next";
import { Tab } from "../../../types/editor";
import { CompileOptions } from "../../sections/header/CompileOptions";
import SimpleButton from "../../mockups/SimpleButton";
import { Preview } from "../Preview/Preview";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AskForHint } from "../AskForHint/AskForHint";
import { Loader } from "../Loader/Loader";
import { TEditorTab } from "../../../utils/storeTypes";
import { Markdowner } from "../Markdowner/Markdowner";
import { eventBus } from "../../../managers/eventBus";
import { Modal } from "../../mockups/Modal";
import { deleteFile } from "../../../utils/creator";
import { Icon } from "../../Icon";
import toast from "react-hot-toast";

const languageMap: { [key: string]: string } = {
  ".js": "javascript",
  ".py": "python",
  ".css": "css",
  ".html": "html",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".csharp": "csharp",
  ".php": "php",
  ".ruby": "ruby",
  ".go": "go",
  ".rs": "rust",
  ".swift": "swift",
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
    lastTestResult,
    lastState,
    // updateDBSession,
    mode,
    setOpenedModals,
    fetchExercises,
    createNewFile,
    renameFileInExercise,
    fileLoadNotFoundByLesson,
    lessonSyncInProgress,
    environment,
    syncLessonFilesFromEditor,
  } = useStore((state) => ({
    tabs: state.editorTabs,
    setTabs: state.setEditorTabs,
    getCurrentExercise: state.getCurrentExercise,
    updateFileContent: state.updateFileContent,
    cleanTerminal: state.cleanTerminal,
    theme: state.theme,
    lastTestResult: state.lastTestResult,
    lastState: state.lastState,
    // updateDBSession: state.updateDBSession,
    mode: state.mode,
    fetchExercises: state.fetchExercises,
    createNewFile: state.createNewFile,
    renameFileInExercise: state.renameFileInExercise,
    setOpenedModals: state.setOpenedModals,
    fileLoadNotFoundByLesson: state.fileLoadNotFoundByLesson,
    lessonSyncInProgress: state.lessonSyncInProgress,
    environment: state.environment,
    syncLessonFilesFromEditor: state.syncLessonFilesFromEditor,
  }));

  const { t } = useTranslation();

  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [editorStatus, setEditorStatus] = useState<TEditorStatus>("UNMODIFIED");
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>("");
  const [editingTabOriginalName, setEditingTabOriginalName] = useState<string>("");
  const [editingTabExtension, setEditingTabExtension] = useState<string>("");
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const isBuildable = useStore((s) => s.isBuildable);
  const isTesteable = useStore((s) => s.isTesteable);

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

  // Función para validar nombre de archivo según restricciones de GCS
  const validateFileName = (
    name: string,
    originalExtension: string,
    allFiles: Array<{ name: string }>
  ): { isValid: boolean; error?: string } => {
    // Extraer extensión si el usuario la incluyó
    const lastDotIndex = name.lastIndexOf(".");
    let nameBase = name;
    let inputExtension = "";

    if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
      nameBase = name.slice(0, lastDotIndex);
      inputExtension = name.slice(lastDotIndex);
    }

    // Si el usuario incluyó una extensión, debe coincidir
    if (inputExtension && inputExtension !== originalExtension) {
      return {
        isValid: false,
        error: t("extension-cannot-be-changed") || "The extension cannot be changed.",
      };
    }

    // Validar que el nombre no esté vacío
    const trimmedName = nameBase.trim();
    if (!trimmedName) {
      return {
        isValid: false,
        error: t("file-name-required") || "File name is required",
      };
    }

    // Normalizar espacios: reemplazar múltiples espacios por uno solo
    const normalizedName = trimmedName.replace(/\s+/g, " ");

    // Validar longitud (255 caracteres como límite práctico)
    if (normalizedName.length > 255) {
      return {
        isValid: false,
        error: t("file-name-too-long", { max: 255 }) || `File name is too long (maximum 255 characters)`,
      };
    }

    // Validar caracteres prohibidos según GCS: < > : " / \ | ? * [ ] # y caracteres de control
    const invalidCharsList = ['<', '>', ':', '"', '/', '\\', '|', '?', '*', '[', ']', '#', '\r', '\n'];
    const foundInvalidChars: string[] = [];
    for (let i = 0; i < normalizedName.length; i++) {
      const char = normalizedName[i];
      if (invalidCharsList.includes(char)) {
        // Mostrar caracteres especiales de forma legible
        let displayChar: string;
        if (char === '\r') {
          displayChar = '\\r';
        } else if (char === '\n') {
          displayChar = '\\n';
        } else if (char === '\\') {
          displayChar = '\\';
        } else {
          displayChar = char;
        }
        if (!foundInvalidChars.includes(displayChar)) {
          foundInvalidChars.push(displayChar);
        }
      }
    }

    if (foundInvalidChars.length > 0) {
      return {
        isValid: false,
        error: t("invalid-characters-in-filename", { chars: foundInvalidChars.join(", ") }) ||
          `The name contains invalid characters: ${foundInvalidChars.join(", ")}`,
      };
    }

    // Validar nombres reservados
    if (normalizedName === "." || normalizedName === ".." || normalizedName.startsWith(".well-known/acme-challenge/")) {
      return {
        isValid: false,
        error: t("reserved-filename", { name: normalizedName }) || `The name '${normalizedName}' is reserved and cannot be used`,
      };
    }

    // Construir nombre completo con extensión
    const fullName = normalizedName + originalExtension;

    // Validar bytes UTF-8 (máximo 1024 bytes según GCS)
    const fullNameBytes = new TextEncoder().encode(fullName).length;
    if (fullNameBytes > 1024) {
      return {
        isValid: false,
        error: t("filename-too-long-bytes") || "File name exceeds size limit (maximum 1024 bytes in UTF-8)",
      };
    }

    // Verificar duplicados
    if (allFiles.some((f) => f.name === fullName)) {
      return {
        isValid: false,
        error: t("file-name-already-exists") || "A file with this name already exists",
      };
    }

    return { isValid: true };
  };

  const handleDoubleClick = (tab: Tab) => {
    // Solo permitir edición en modo creator
    if (mode !== "creator") {
      return;
    }

    // No permitir edición de archivos solution.hide
    if (tab.name.includes("solution.hide")) {
      toast.error(t("solution-files-cannot-be-renamed") || "Solution files cannot be renamed");
      return;
    }

    // Extraer extensión
    const lastDotIndex = tab.name.lastIndexOf(".");
    const extension = lastDotIndex > 0 ? tab.name.slice(lastDotIndex) : "";
    const nameBase = lastDotIndex > 0 ? tab.name.slice(0, lastDotIndex) : tab.name;

    // Activar modo edición
    setEditingTabId(tab.id);
    setEditingTabName(nameBase);
    setEditingTabOriginalName(tab.name);
    setEditingTabExtension(extension);
  };

  const handleRenameConfirm = async () => {
    if (editingTabId === null) return;

    // Extraer nombre base si el usuario incluyó una extensión
    let nameBase = editingTabName;
    const lastDotIndex = editingTabName.lastIndexOf(".");
    
    // Si hay un punto y está en una posición válida (no al inicio ni al final)
    if (lastDotIndex > 0 && lastDotIndex < editingTabName.length - 1) {
      const inputExtension = editingTabName.slice(lastDotIndex);
      // Si la extensión coincide con la original, usar solo el nombre base
      if (inputExtension === editingTabExtension) {
        nameBase = editingTabName.slice(0, lastDotIndex);
      }
    } else if (lastDotIndex === editingTabName.length - 1) {
      // Si el punto está al final (ej: "app."), eliminarlo
      nameBase = editingTabName.slice(0, lastDotIndex);
    }

    // Normalizar nombre (trim y espacios múltiples -> uno solo)
    const normalizedName = nameBase.trim().replace(/\s+/g, " ");
    const newFileName = normalizedName + editingTabExtension;

    // Si el nombre no cambió, solo cancelar edición sin validar ni mostrar error
    if (newFileName === editingTabOriginalName) {
      setEditingTabId(null);
      setEditingTabName("");
      setEditingTabOriginalName("");
      setEditingTabExtension("");
      return;
    }

    const exercise = getCurrentExercise();
    const allFiles = exercise.files || [];

    // Solo validar si el nombre cambió
    const validation = validateFileName(
      editingTabName,
      editingTabExtension,
      allFiles
    );

    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file name");
      return;
    }

    setIsRenaming(true);
    const toastId = toast.loading(t("renaming-file") || "Renaming file...");

    try {
      await renameFileInExercise(exercise.slug, editingTabOriginalName, newFileName);
      toast.success(t("file-renamed-successfully") || "File renamed successfully", { id: toastId });

      // Limpiar estado de edición
      setEditingTabId(null);
      setEditingTabName("");
      setEditingTabOriginalName("");
      setEditingTabExtension("");
      setIsRenaming(false);
    } catch (error) {
      console.error("Error renaming file:", error);
      toast.error(t("error-renaming-file") || "Error renaming file", { id: toastId });
      setIsRenaming(false);
    }
  };

  const handleRenameCancel = () => {
    // No permitir cancelar si está en proceso de renombrado
    if (isRenaming) {
      return;
    }
    setEditingTabId(null);
    setEditingTabName("");
    setEditingTabOriginalName("");
    setEditingTabExtension("");
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // No permitir acciones si está en proceso de renombrado
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleRenameCancel();
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

  const onReset = () => {
    setOpenedModals({ reset: true });
  };

  const terminalTab = tabs.find((tab) => tab.name === "terminal");

  const filteredTabs = tabs.filter((tab) => tab.name !== "terminal");

  const toolbarStateClass = 
    lastTestResult?.status === "failed"
      ? "error"  // Tests failed - keep toolbar red even if compilation succeeds
      : lastTestResult?.status === "successful" && lastState === "success"
      ? "success"  // Tests passed - toolbar green
      : lastState === "error"
      ? "error"  // Compilation error (no test result yet)
      : "";  // Normal state

  const onlyContinue = !isBuildable && !isTesteable;

  const hasHTML = tabs.some((tab) => tab.name.includes(".html"));

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
            {editingTabId === tab.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="text"
                  value={editingTabName}
                  onChange={(e) => setEditingTabName(e.target.value)}
                  onBlur={() => {
                    if (!isRenaming) {
                      handleRenameConfirm();
                    }
                  }}
                  onKeyDown={handleRenameKeyDown}
                  autoFocus
                  disabled={isRenaming}
                  style={{
                    border: "none",
                    outline: "2px solid var(--color-active)",
                    background: "var(--bg-color)",
                    color: "var(--color-active)",
                    padding: "2px 6px",
                    fontSize: "inherit",
                    borderRadius: "2px",
                    minWidth: "80px",
                    maxWidth: "120px",
                    opacity: isRenaming ? 0.6 : 1,
                    cursor: isRenaming ? "not-allowed" : "text",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                {isRenaming && (
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      border: "2px solid var(--color-active)",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                )}
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    onDoubleClick={() => handleDoubleClick(tab)}
                  >
                    {tab.name.includes("solution.hide")
                      ? t("model-solution")
                      : tab.name}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {mode === "creator" && !tab.name.includes("solution.hide")
                      ? t("double-click-to-rename") || "Double-click to edit the name"
                      : tab.name.includes("solution.hide")
                      ? t("solution-files-cannot-be-renamed") || "Solution files cannot be renamed"
                      : tab.name}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {mode === "creator" && editingTabId !== tab.id && (
              (() => {
                const currentSlug = getCurrentExercise()?.slug;
                const isCreatorWebAndCreator = environment === "creatorWeb" && mode === "creator";
                const showSyncIcon = isCreatorWebAndCreator && currentSlug && fileLoadNotFoundByLesson[currentSlug]?.includes(tab.name) && !tab.name.includes("solution.hide");
                const buttonsDisabled = isCreatorWebAndCreator && lessonSyncInProgress === currentSlug;

                if (showSyncIcon) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentSlug && !buttonsDisabled) syncLessonFilesFromEditor(currentSlug);
                          }}
                          disabled={buttonsDisabled}
                          className="delete-file-btn"
                          style={{
                            marginLeft: "8px",
                            padding: "2px 6px",
                            fontSize: "12px",
                            cursor: buttonsDisabled ? "not-allowed" : "pointer",
                            color: buttonsDisabled ? "#999" : "#0d6efd",
                          }}
                        >
                          <Icon size={10} name="RefreshCw" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("sync-lesson-files-tooltip") || "Sync lesson files"}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!buttonsDisabled) handleDeleteFile(tab.name);
                        }}
                        disabled={buttonsDisabled}
                        className="delete-file-btn"
                        style={{
                          marginLeft: "8px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          cursor: buttonsDisabled ? "not-allowed" : "pointer",
                          color: buttonsDisabled ? "#999" : "#ff4444",
                        }}
                      >
                        <Icon size={10} name="Trash" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("delete-file") || "Delete file"}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })()
            )}
          </div>
        ))}
        {mode === "creator" && (
          <div className="tab add-file-tab">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowCreateFileModal(true)}
                  className="bg-2 padding-small rounded text-blue"
                >
                  <Icon size={14} name="Plus" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("new-file") || "New File"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {!(terminal === "only") && (
        <div className="editor">
          {tabs.map(
            (tab) =>
              tab.isActive && (
                <div className="h-100" key={tab.id}>
                  {(() => {
                    const currentSlug = getCurrentExercise()?.slug;
                    const isFileNotFoundTab =
                      currentSlug &&
                      fileLoadNotFoundByLesson[currentSlug]?.includes(tab.name);
                    if (isFileNotFoundTab) {
                      return (
                        <div className="h-100 p-4 margin-children-none text-small text-orange-500" style={{ backgroundColor: "#1e1e1e" }}>
                          <p>{t("file-not-found") || "File not found"}</p>
                          {mode === "creator" && (
                            <p className="margin-top-small">
                              {t("file-not-found-sync-hint") ||
                                "Use the sync icon in the tab to synchronize lesson files."}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <>
                        {tab.name.includes("solution.hide") && mode !== "creator" && (
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
                              (tab.name.includes("solution.hide") && mode !== "creator"),
                          }}
                        />
                      </>
                    );
                  })()}
                </div>
              )
          )}
          <Toolbar editorStatus={editorStatus} onReset={onReset} toolbarStateClass={toolbarStateClass} onlyContinue={onlyContinue} isHtml={hasHTML} />
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
  const { getCurrentExercise, lastState, isTesteable, lastTestResult, runExerciseTests, setOpenedModals, configObject } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    lastState: state.lastState,
    isTesteable: state.isTesteable,
    lastTestResult: state.lastTestResult,
    runExerciseTests: state.runExerciseTests,
    setOpenedModals: state.setOpenedModals,
    // editorStatus: state.editorStatus,
    configObject: state.configObject,
  }));

  const [showInfo, setShowInfo] = useState(false);
  const onReset = () => {
    setOpenedModals({ reset: true });
  };

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
    const courseSlug = configObject.config.slug;
    const newTab = window.open(
      `/preview/${courseSlug}/webview?${getCurrentExercise().slug}`,
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

  const toolbarStateClass = 
    lastTestResult?.status === "failed"
      ? "error"  // Tests failed - keep toolbar red even if compilation succeeds
      : lastTestResult?.status === "successful" && lastState === "success"
      ? "success"  // Tests passed - toolbar green
      : lastState === "error"
      ? "error"  // Compilation error (no test result yet)
      : "";  // Normal state

  const onlyContinue = !isTesteable && lastState === "success"; 

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
              toolbarStateClass={toolbarStateClass}
              onlyContinue={onlyContinue}
              onReset={onReset}
              isHtml={terminalTab.isHTML}
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
                extraClass="bg-blue-rigo text-white rounded padding-small"
                action={() => removeTab(terminalTab.id, terminalTab.name)}
              />
              {isTesteable && lastState === "success" && terminalTab.from === "build" && (
                <SimpleButton
                  text={t("test-and-send")}
                  extraClass="rounded padding-small border-blue color-blue"
                  title={t("test-and-send-tooltip")}
                  tooltipSide="right"
                  action={() => {
                    removeTab(terminalTab.id, terminalTab.name);
                    runExerciseTests({
                      toast: true,
                      setFeedbackButton: true,
                      feedbackButtonText: t("Running..."),
                      targetButton: "feedback",
                    });
                  }}
                />
              )}
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
          resizable={true}
        >
          <div className={`terminal ${terminalState} html browser`}>
            <div className="d-flex justify-between align-center browser-header">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className=" browser-tab">
                    {browserTabTitle}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{browserTabTitle}</p>
                </TooltipContent>
              </Tooltip>
              <div className="d-flex ">
                <SimpleButton
                  title={t("display-another-tab")}
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
  onReset?: () => void;
  toolbarStateClass?: "error" | "success" | "";
  onlyContinue?: boolean;
  onRunTests?: () => void;
  onBuild?: () => void;
  isRunning?: boolean;
  isHtml?: boolean;
};

export const Toolbar = ({
  editorStatus,
  position = "absolute",
  dropdownDirection = "up",
  onReset = () => {},
  onlyContinue = false,
  toolbarStateClass = "",
  onRunTests,
  onBuild,
  isRunning,
  isHtml,
}: EditorFooterProps) => {
  const { t } = useTranslation();
  const {
    lastState,
    getCurrentExercise,
    currentExercisePosition,
    exercises,
  } = useStore((state) => ({
    lastState: state.lastState,
    getCurrentExercise: state.getCurrentExercise,
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
  }));

  const ex = getCurrentExercise();

  const letPass =
    lastState === "success" && ex.done && editorStatus === "MODIFIED";

  const isLastExercise = currentExercisePosition === exercises.length - 1;

  return (
    <div
      style={{ position: position }}
      className={`editor-footer ${position} ${editorStatus} ${toolbarStateClass}`}
    >
      {letPass && (
        <div className="footer-actions">
          {onReset && <ResetButton onReset={onReset} />}
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
              <CompileOptions dropdownDirection={dropdownDirection} onRunTests={onRunTests} onBuild={onBuild} isRunning={isRunning} isHtml={isHtml} />
              {onReset && <ResetButton onReset={onReset} />}
              <FeedbackButton direction={dropdownDirection} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
