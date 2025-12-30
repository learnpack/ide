import React, { useState, useRef, useEffect, useCallback } from "react";
import { Preview } from "../Preview/Preview";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import MermaidRenderer from "../MermaidRenderer/MermaidRenderer";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
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
        <div className="w-full h-full overflow-hidden bg-gray-100">
          <img
            src={String(item.content)}
            alt={item.label || "Comparison image"}
            className="w-full h-full object-cover"
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
const determineLayout = (before: ComparisonItem, after: ComparisonItem): ComparisonLayout => {
  // Use slider for visual content (HTML and images)
  if (before.type === "html" || after.type === "html" || 
      before.type === "image" || after.type === "image") {
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
  before,
  after,
  defaultPosition = 50,
  height = "600px",
  syncModes = true,
}) => {
  const [sliderPosition, setSliderPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mode states - use defaultMode if provided, otherwise use first available mode
  const [beforeMode, setBeforeMode] = useState<ContentMode>(() => getInitialMode(before));
  const [afterMode, setAfterMode] = useState<ContentMode>(() => getInitialMode(after));
  
  const containerRef = useRef<HTMLDivElement>(null);

  const beforeModes = before.availableModes || getDefaultModes(before.type);
  const afterModes = after.availableModes || getDefaultModes(after.type);

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

  // Toggle mode handlers
  const toggleBeforeMode = () => {
    const currentIndex = beforeModes.indexOf(beforeMode);
    const nextIndex = (currentIndex + 1) % beforeModes.length;
    const nextMode = beforeModes[nextIndex];
    
    setBeforeMode(nextMode);
    if (syncModes) {
      setAfterMode(nextMode);
    }
  };

  const toggleAfterMode = () => {
    const currentIndex = afterModes.indexOf(afterMode);
    const nextIndex = (currentIndex + 1) % afterModes.length;
    const nextMode = afterModes[nextIndex];
    
    setAfterMode(nextMode);
    if (syncModes) {
      setBeforeMode(nextMode);
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

  const getModeLabel = (mode: ContentMode) => {
    return mode === "rendered" ? "👁️ Vista" : "📝 Código";
  };

  const getModeTitle = (mode: ContentMode) => {
    return mode === "rendered" ? "Ver Código" : "Ver Renderizado";
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-gray-300"
      style={{ height }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Layer (After) */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: isDragging ? "none" : "auto" }}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {after.label && (
            <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
              {after.label}
            </div>
          )}
          {afterModes.length > 1 && (
            <button
              onClick={toggleAfterMode}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              title={getModeTitle(afterMode)}
            >
              {getModeLabel(afterMode)}
            </button>
          )}
        </div>

        <ContentRenderer item={after} currentMode={syncModes ? beforeMode : afterMode} />
      </div>

      {/* Foreground Layer (Before) - Clipped */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          pointerEvents: isDragging ? "none" : "auto",
        }}
      >
        <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
          {before.label && (
            <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
              {before.label}
            </div>
          )}
          {beforeModes.length > 1 && (
            <button
              onClick={toggleBeforeMode}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              title={getModeTitle(beforeMode)}
            >
              {getModeLabel(beforeMode)}
            </button>
          )}
        </div>

        <ContentRenderer item={before} currentMode={beforeMode} />
      </div>

      {/* Slider Divider */}
      <div
        className="absolute top-0 h-full w-1 bg-blue-500 cursor-col-resize z-20 hover:bg-blue-600 transition-colors"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
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
  before,
  after,
  height = "600px",
  syncModes = true,
}) => {
  // Mode states - use defaultMode if provided, otherwise use first available mode
  const [beforeMode, setBeforeMode] = useState<ContentMode>(() => getInitialMode(before));
  const [afterMode, setAfterMode] = useState<ContentMode>(() => getInitialMode(after));

  const beforeModes = before.availableModes || getDefaultModes(before.type);
  const afterModes = after.availableModes || getDefaultModes(after.type);

  // Toggle mode handlers
  const toggleBeforeMode = () => {
    const currentIndex = beforeModes.indexOf(beforeMode);
    const nextIndex = (currentIndex + 1) % beforeModes.length;
    const nextMode = beforeModes[nextIndex];
    
    setBeforeMode(nextMode);
    if (syncModes) {
      setAfterMode(nextMode);
    }
  };

  const toggleAfterMode = () => {
    const currentIndex = afterModes.indexOf(afterMode);
    const nextIndex = (currentIndex + 1) % afterModes.length;
    const nextMode = afterModes[nextIndex];
    
    setAfterMode(nextMode);
    if (syncModes) {
      setBeforeMode(nextMode);
    }
  };

  const getModeLabel = (mode: ContentMode) => {
    return mode === "rendered" ? "👁️ Vista" : "📝 Código";
  };

  const getModeTitle = (mode: ContentMode) => {
    return mode === "rendered" ? "Ver Código" : "Ver Renderizado";
  };

  return (
    <div 
      className="w-full rounded-lg border border-gray-300 overflow-hidden max-h-[90vh]"
      style={{ height }}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Before Panel */}
        <div className="relative flex-1 max-h-[50%] md:max-h-full border-b md:border-b-0 md:border-r border-gray-300 overflow-auto">
          <div className="sticky top-2 left-2 z-10 flex items-center gap-2 mb-2">
            {before.label && (
              <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                {before.label}
              </div>
            )}
            {beforeModes.length > 1 && (
              <button
                onClick={toggleBeforeMode}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                title={getModeTitle(beforeMode)}
              >
                {getModeLabel(beforeMode)}
              </button>
            )}
          </div>
          <ContentRenderer item={before} currentMode={beforeMode} />
        </div>

        {/* After Panel */}
        <div className="relative flex-1 max-h-[50%] md:max-h-full overflow-auto">
          <div className="sticky top-2 right-2 z-10 flex items-center gap-2 justify-end mb-2">
            {after.label && (
              <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                {after.label}
              </div>
            )}
            {afterModes.length > 1 && (
              <button
                onClick={toggleAfterMode}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                title={getModeTitle(afterMode)}
              >
                {getModeLabel(afterMode)}
              </button>
            )}
          </div>
          <ContentRenderer item={after} currentMode={syncModes ? beforeMode : afterMode} />
        </div>
      </div>
    </div>
  );
};

// Main Comparison Component
export const Comparison: React.FC<ComparisonProps> = (props) => {
  const { before, after, layout } = props;
  
  // Determine layout automatically if not specified
  const effectiveLayout = layout || determineLayout(before, after);
  
  // Render the appropriate layout
  if (effectiveLayout === "slider") {
    return <SliderComparison {...props} />;
  } else {
    return <SideBySideComparison {...props} />;
  }
};

