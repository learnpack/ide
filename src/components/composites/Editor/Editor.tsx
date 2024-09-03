import React, { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import useStore from "../../../utils/store";
import { LocalStorage } from "../../../managers/localStorage";
import "./Editor.css"; 
interface Tab {
  id: number;
  name: string;
  content: string;
}
const EDITOR_THEME_KEY = "editor_theme"

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

const CodeEditor: React.FC = () => {
  const { editorTabs, getCurrentExercise } = useStore((state) => ({
    editorTabs: state.editorTabs,
    getCurrentExercise: state.getCurrentExercise,
  }));
  const [tabs, setTabs] = useState<Tab[]>([...editorTabs]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [theme, setTheme] = useState("light");

  const addTab = () => {
    const newTab: Tab = {
      id: tabs.length + 1,
      name: `Tab ${tabs.length + 1}`,
      content: "",
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const updateContent = (id: number, content: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === id ? { ...tab, content } : tab
    );
    setTabs(newTabs);
    const ex = getCurrentExercise();
    LocalStorage.setEditorTabs(ex.slug, newTabs);
  };

  useEffect(() => {
    setTabs([...editorTabs]);
    const ex = getCurrentExercise();
    if (!ex) return;
    const cachedEditorTabs = LocalStorage.getEditorTabs(ex.slug);

    const cachedTheme = LocalStorage.get(EDITOR_THEME_KEY)
    if (cachedTheme) {
      setTheme(cachedTheme);
    }

    if (cachedEditorTabs.length === 0) return;
    setTabs([...cachedEditorTabs]);
  }, [editorTabs]);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value;
    setTheme(newTheme);
    const ex = getCurrentExercise();
    if (ex) {
      LocalStorage.set('editor_theme', newTheme);
    }
  };
  
  return (
    <div style={{display: `${tabs.length === 0 ? "none": "block"
    }`}} className="editor-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={tab.id === activeTab ? "active" : ""}
          >
            {tab.name}
          </button>
        ))}
        <button onClick={addTab} className="add-tab">+</button>
      </div>
      <div className="theme-selector">
        <label htmlFor="theme-select">Select Theme: </label>
        <select id="theme-select" value={theme} onChange={handleThemeChange}>
          <option value="light">Light</option>
          <option value="vs-dark">Dark</option>
          <option value="hc-black">High Contrast</option>
        </select>
      </div>
      <div className="editor">
        {tabs.map(
          (tab) =>
            tab.id === activeTab && (
              <MonacoEditor
                key={tab.id}
                height="400px"
                language={getLanguageFromExtension(tab.name)}
                theme={theme}
                value={tab.content}
                onChange={(value) => updateContent(tab.id, value || "")}
                options={{
                  fontSize: 12,
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                }}
              />
            )
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
