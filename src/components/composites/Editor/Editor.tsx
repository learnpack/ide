import React, { useState } from 'react';
import MonacoEditor from 'react-monaco-editor';

interface Tab {
    id: number;
    name: string;
    content: string;
}

const Editor: React.FC = () => {
    const [tabs, setTabs] = useState<Tab[]>([{ id: 1, name: 'Tab 1', content: '' }]);
    const [activeTab, setActiveTab] = useState<number>(1);

    const addTab = () => {
        const newTab: Tab = { id: tabs.length + 1, name: `Tab ${tabs.length + 1}`, content: '' };
        setTabs([...tabs, newTab]);
        setActiveTab(newTab.id);
    };

    const updateContent = (id: number, content: string) => {
        setTabs(tabs.map(tab => tab.id === id ? { ...tab, content } : tab));
    };

    return (
        <div>
            <div className="tabs">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
                        {tab.name}
                    </button>
                ))}
                <button onClick={addTab}>+</button>
            </div>
            <div className="editor">
                {tabs.map(tab => (
                    tab.id === activeTab && (
                        <MonacoEditor
                            key={tab.id}
                            width="800"
                            height="600"
                            language="javascript"
                            theme="vs-dark"
                            value={tab.content}
                            onChange={(value) => updateContent(tab.id, value)}
                        />
                    )
                ))}
            </div>
        </div>
    );
};

export default Editor;
