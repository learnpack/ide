import React, { useEffect, useState, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import useStore from "../../../utils/store";
import { LocalStorage } from "../../../managers/localStorage";
import "./Editor.css";
import { svgs } from "../../../assets/svgs";
import FeedbackButton from "../../sections/header/FeedbackButton";
import ResetButton from "../../sections/header/ResetButton";
import BuildButton from "../../sections/header/BuildButton";
import { useTranslation } from "react-i18next";
import { debounce } from "../../../utils/lib";
import { Tab } from "../../../types/editor";

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
  const { editorTabs, getCurrentExercise, updateFileContent, cleanTerminal,theme} =
    useStore((state) => ({
      editorTabs: state.editorTabs,
      getCurrentExercise: state.getCurrentExercise,
      updateFileContent: state.updateFileContent,
      cleanTerminal: state.cleanTerminal,
      theme: state.theme
    }));
  const [tabs, setTabs] = useState<Tab[]>([...editorTabs]);
  const [editorTheme, setEditorTheme] = useState("light");
  const [editorStatus, setEditorStatus] = useState<TEditorStatus>("UNMODIFIED");

  const debouncedStore = useCallback(
    debounce((tab: Tab, exerciseSlug: string) => {
      updateFileContent(exerciseSlug, tab);
    }, 5000),
    []
  );

  const addTab = () => {
    const newTab: Tab = {
      id: tabs.length + 1,
      name: `Tab ${tabs.length + 1}`,
      content: "",
      isActive: false,
    };
    setTabs([...tabs, newTab]);
  };

  const updateContent = (id: number, content: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === id ? { ...tab, content } : tab
    );
    setTabs(newTabs);

    const ex = getCurrentExercise();
    const withoutTerminal = newTabs.filter((t) => t.name !== "terminal");
    LocalStorage.setEditorTabs(ex.slug, withoutTerminal);
    setEditorStatus("MODIFIED");
    debouncedStore(
      newTabs.find((t) => t.id === id),
      ex.slug
    );
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
    const ex = getCurrentExercise();
    if (!ex) return;

    const tabMap = new Map();

    editorTabs.forEach((tab) => tabMap.set(tab.name, tab));

    const updatedTabs = Array.from(tabMap.values());

    const activeTabs = updatedTabs.filter((tab) => tab.isActive);

    if (activeTabs.length > 1) {
      const lastActiveTab = activeTabs[activeTabs.length - 1];
      updatedTabs.forEach((tab) => {
        tab.isActive = tab === lastActiveTab;
      });
    } else if (activeTabs.length === 0 && updatedTabs.length > 0) {
      updatedTabs[0].isActive = true;
    }

    setTabs(updatedTabs);
  }, [editorTabs]);


  useEffect(()=>{
    if (theme === "light") {
      setEditorTheme("light")
    }
    else if (theme === "dark") {
      setEditorTheme("vs-dark")
    }

  },[theme])

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value;
    setEditorTheme(newTheme);
    const ex = getCurrentExercise();
    if (ex) {
      LocalStorage.set("editor_theme", newTheme);
    }
  };

  const terminalTab = tabs.find((tab) => tab.name === "terminal");

  const filteredTabs = tabs.filter((tab) => tab.name != "terminal");

  return (
    <div style={{ display: `${tabs.length === 0 ? "none" : "block"}` }}>
      <div
        className="tabs"
        style={{ display: terminal === "only" ? "none" : "flex" }}
      >
        <button onClick={addTab} className="add-tab">
          +
        </button>
        {filteredTabs.map((tab) => (
          <div key={tab.id} className={`tab ${tab.isActive ? "active" : ""}`}>
            <button onClick={() => handleTabClick(tab.id)}>{tab.name}</button>
            {/* <button
              className="close-tab"
              onClick={() => removeTab(tab.id, tab.name)}
            >
              &times;
            </button> */}
          </div>
        ))}
        <div className="theme-selector">
          <select id="theme-select" value={editorTheme} onChange={handleThemeChange}>
            <option value="light">Light</option>
            <option value="vs-dark">Dark</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>
      </div>

      {!(terminal === "only") && (
        <div className="editor">
          {tabs.map(
            (tab) =>
              tab.isActive && (
                <MonacoEditor
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
                    fontSize: 15,
                    fontFamily: '"Fira code", "Fira Mono", monospace',
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
        </div>
      )}
    </div>
  );
};

type EditorFooterProps = {
  editorStatus: TEditorStatus;
};

const EditorFooter = ({ editorStatus }: EditorFooterProps) => {
  const { t } = useTranslation();

  return (
    <div className={`editor-footer ${editorStatus}`}>
      {editorStatus === "UNMODIFIED" && (
        <div className="not-started">
          <div>
            <span>{svgs.learnpackLogo}</span>
            <span>{t("read-instructions")}</span>
          </div>
          <FeedbackButton direction="up" />
        </div>
      )}
      {editorStatus === "MODIFIED" && (
        <div className="footer-actions">
          <BuildButton extraClass={"active"} />
          <ResetButton />
          <FeedbackButton direction="up" />
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
