import React, { useState, useRef, useEffect, useCallback } from "react";
import { Preview } from "../Preview/Preview";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import MermaidRenderer from "../MermaidRenderer/MermaidRenderer";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useTranslation } from "react-i18next";
import SwitchComponent from "../../ui/switch";
import type { ComparisonProps, ComparisonItem, ContentMode, ContentType, ComparisonLayout } from "./types";

// Internal component to render content based on type and mode
const ContentRenderer: React.FC<{
  item: ComparisonItem;
  currentMode: ContentMode;
}> = ({ item, currentMode }) => {
  // If custom render is provided, use it
  if (item.customRender) {
    return <>{item.customRender(item.content, currentMode)}</>;
  }

  // Handle different content types
  switch (item.type) {
    case "html":
      if (currentMode === "rendered") {
        return (
          <Preview html={String(item.content)} onTitleRevealed={() => {}} useIframe={true} />
        );
      } else {
        return (
          <div className="w-full h-full overflow-auto">
            <SyntaxHighlighter
              language="html"
              style={atomDark}
              customStyle={{
                margin: 0,
                height: "100%",
                fontSize: "0.875rem",
              }}
            >
              {String(item.content)}
            </SyntaxHighlighter>
          </div>
        );
      }

    case "text":
      return (
        <div className="w-full h-full overflow-auto p-4 bg-gray-50">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {String(item.content)}
          </pre>
        </div>
      );

    case "code":
      return (
        <div className="w-full h-full overflow-auto">
          <SyntaxHighlighter
            language={item.language || "javascript"}
            style={atomDark}
            customStyle={{
              margin: 0,
              height: "100%",
              fontSize: "0.875rem",
            }}
          >
            {String(item.content)}
          </SyntaxHighlighter>
        </div>
      );

    case "mermaid":
      if (currentMode === "rendered") {
        return (
          <div className="w-full h-full overflow-auto p-4 bg-white flex items-center justify-center">
            <MermaidRenderer code={String(item.content)} />
          </div>
        );
      } else {
        return (
          <div className="w-full h-full overflow-auto">
            <SyntaxHighlighter
              language="mermaid"
              style={atomDark}
              customStyle={{
                margin: 0,
                height: "100%",
                fontSize: "0.875rem",
              }}
            >
              {String(item.content)}
            </SyntaxHighlighter>
          </div>
        );
      }

    case "markdown":
      if (currentMode === "rendered") {
        return (
          <div className="w-full h-full overflow-auto p-6 bg-white prose prose-sm max-w-none">
            <Markdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {String(item.content)}
            </Markdown>
          </div>
        );
      } else {
        return (
          <div className="w-full h-full overflow-auto">
            <SyntaxHighlighter
              language="markdown"
              style={atomDark}
              customStyle={{
                margin: 0,
                height: "100%",
                fontSize: "0.875rem",
              }}
            >
              {String(item.content)}
            </SyntaxHighlighter>
          </div>
        );
      }

    case "image":
      return (
        <div className="w-full overflow-hidden bg-gray-100">
          <img
            src={String(item.content)}
            alt={item.label || "Comparison image"}
            className="w-full object-cover"
            style={{ maxWidth: "none", margin: 0 }}
          />
        </div>
      );

    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          Unknown content type: {item.type}
        </div>
      );
  }
};

// Determine default layout based on content types
const determineLayout = (left: ComparisonItem, right: ComparisonItem): ComparisonLayout => {
  // Use slider for visual content (HTML and images)
  if (left.type === "html" || right.type === "html" || 
      left.type === "image" || right.type === "image") {
    return "slider";
  }
  
  // Use side-by-side for text, code, mermaid, and markdown
  return "side-by-side";
};

// Helper function to get default modes based on content type
const getDefaultModes = (type: ContentType): ContentMode[] => {
  switch (type) {
    case "html":
      return ["rendered", "raw"];
    case "mermaid":
      return ["rendered", "raw"];
    case "markdown":
      return ["rendered", "raw"];
    case "image":
      return ["rendered"];
    case "text":
      return ["raw"];
    case "code":
      return ["raw"];
    default:
      return ["rendered"];
  }
};

// Helper function to determine initial mode for an item
const getInitialMode = (item: ComparisonItem): ContentMode => {
  // Use explicit defaultMode if provided
  if (item.defaultMode) {
    return item.defaultMode;
  }
  
  // Otherwise use the first available mode
  const modes = item.availableModes || getDefaultModes(item.type);
  return modes[0];
};

// Slider Comparison Component (original behavior)
const SliderComparison: React.FC<Omit<ComparisonProps, "layout">> = ({
  left,
  right,
  defaultPosition = 50,
  height = "600px",
  syncModes = true,
}) => {
  const { t } = useTranslation();
  const [sliderPosition, setSliderPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mode states - use defaultMode if provided, otherwise use first available mode
  const [leftMode, setLeftMode] = useState<ContentMode>(() => getInitialMode(left));
  const [rightMode, setRightMode] = useState<ContentMode>(() => getInitialMode(right));
  
  const containerRef = useRef<HTMLDivElement>(null);

  const leftModes = left.availableModes || getDefaultModes(left.type);
  const rightModes = right.availableModes || getDefaultModes(right.type);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  }, []);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      updateSliderPosition(e.clientX);
    },
    [updateSliderPosition]
  );

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    updateSliderPosition(touch.clientX);
  };

  // Mode change handlers for SwitchComponent
  const handleLeftModeChange = (checked: boolean) => {
    const newMode: ContentMode = checked ? "rendered" : "raw";
    setLeftMode(newMode);
    if (syncModes) {
      setRightMode(newMode);
    }
  };

  const handleRightModeChange = (checked: boolean) => {
    const newMode: ContentMode = checked ? "rendered" : "raw";
    setRightMode(newMode);
    if (syncModes) {
      setLeftMode(newMode);
    }
  };

  // Attach global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-gray-300"
      style={{ height }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Layer (Right) */}
      <div
        className="absolute inset-0"
        style={{ 
          clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          pointerEvents: isDragging ? "none" : "auto" 
        }}
      >
        <div className={`top-0 right-0 p-2 z-10 flex items-center gap-2 ${leftMode === "raw" ? "bg-white sticky justify-end" : "absolute"}`}>
          {rightModes.length > 1 && (
            <SwitchComponent
              checked={rightMode === "rendered"}
              onChange={handleRightModeChange}
              label={t("preview")}
              id="right-mode-switch"
            />
          )}
          {right.label && (
            <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
              {right.label}
            </div>
          )}
        </div>

        <ContentRenderer item={right} currentMode={syncModes ? leftMode : rightMode} />
      </div>

      {/* Foreground Layer (Left) - Clipped */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        <div className={`top-0 left-0 p-2 z-10 flex items-center gap-2 ${leftMode === "raw" ? "bg-white sticky" : "absolute"}`}>
          {left.label && (
            <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
              {left.label}
            </div>
          )}
          {leftModes.length > 1 && (
            <SwitchComponent
              checked={leftMode === "rendered"}
              onChange={handleLeftModeChange}
              label={t("preview")}
              id="left-mode-switch"
            />
          )}
        </div>

        <ContentRenderer item={left} currentMode={leftMode} />
      </div>

      {/* Slider Divider */}
      <div
        className="absolute top-0 w-1 bg-blue-500 cursor-col-resize z-20 hover:bg-blue-600 transition-colors"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)", height: "100%" }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:scale-110 transition-all">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8L22 12L18 16" />
            <path d="M6 8L2 12L6 16" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Side-by-Side Comparison Component (new)
const SideBySideComparison: React.FC<Omit<ComparisonProps, "layout" | "defaultPosition">> = ({
  left,
  right,
  height = "600px",
  syncModes = true,
}) => {
  const { t } = useTranslation();
  // Mode states - use defaultMode if provided, otherwise use first available mode
  const [leftMode, setLeftMode] = useState<ContentMode>(() => getInitialMode(left));
  const [rightMode, setRightMode] = useState<ContentMode>(() => getInitialMode(right));

  const leftModes = left.availableModes || getDefaultModes(left.type);
  const rightModes = right.availableModes || getDefaultModes(right.type);

  // Mode change handlers for SwitchComponent
  const handleLeftModeChange = (checked: boolean) => {
    const newMode: ContentMode = checked ? "rendered" : "raw";
    setLeftMode(newMode);
    if (syncModes) {
      setRightMode(newMode);
    }
  };

  const handleRightModeChange = (checked: boolean) => {
    const newMode: ContentMode = checked ? "rendered" : "raw";
    setRightMode(newMode);
    if (syncModes) {
      setLeftMode(newMode);
    }
  };

  return (
    <div 
      className="w-full rounded-lg border border-gray-300 overflow-hidden max-h-[90vh]"
      style={{ height }}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left Panel */}
        <div className="relative flex-1 max-h-[50%] md:max-h-full border-b md:border-b-0 md:border-r border-gray-300 overflow-auto">
          <div className="sticky top-0 left-0 z-10 flex items-center gap-2 p-2 bg-white">
            {left.label && (
              <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                {left.label}
              </div>
            )}
            {leftModes.length > 1 && (
              <SwitchComponent
                checked={leftMode === "rendered"}
                onChange={handleLeftModeChange}
                label={t("preview")}
                id="left-mode-switch-side"
              />
            )}
          </div>
          <ContentRenderer item={left} currentMode={leftMode} />
        </div>

        {/* Right Panel */}
        <div className="relative flex-1 max-h-[50%] md:max-h-full overflow-auto">
          <div className="sticky top-0 left-0 z-10 flex flex-row-reverse md:flex-row items-center gap-2 p-2 bg-white justify-end">
            {rightModes.length > 1 && (
              <SwitchComponent
                checked={rightMode === "rendered"}
                onChange={handleRightModeChange}
                label={t("preview")}
                id="right-mode-switch-side"
              />
            )}
            {right.label && (
              <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                {right.label}
              </div>
            )}
          </div>
          <ContentRenderer item={right} currentMode={syncModes ? leftMode : rightMode} />
        </div>
      </div>
    </div>
  );
};

// Main Comparison Component
export const Comparison: React.FC<ComparisonProps> = (props) => {
  const { left, right, layout } = props;
  
  // Determine layout automatically if not specified
  const effectiveLayout = layout || determineLayout(left, right);
  
  // Render the appropriate layout
  if (effectiveLayout === "slider") {
    return <SliderComparison {...props} />;
  } else {
    return <SideBySideComparison {...props} />;
  }
};

