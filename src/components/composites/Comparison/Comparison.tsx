import React, { useState, useRef, useEffect, useCallback } from "react";
import { Preview } from "../Preview/Preview";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ComparisonProps, ComparisonItem, ContentMode, ContentType } from "./types";

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

    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          Unknown content type: {item.type}
        </div>
      );
  }
};

export const Comparison: React.FC<ComparisonProps> = ({
  before,
  after,
  defaultPosition = 50,
  height = "600px",
  syncModes = true,
}) => {
  const [sliderPosition, setSliderPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mode states - if sync is true, we only need one state
  const [beforeMode, setBeforeMode] = useState<ContentMode>("rendered");
  const [afterMode, setAfterMode] = useState<ContentMode>("rendered");
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Default available modes based on content type
  const getDefaultModes = (type: ContentType): ContentMode[] => {
    switch (type) {
      case "html":
        return ["rendered", "raw"];
      case "text":
        return ["raw"];
      case "code":
        return ["raw"];
      default:
        return ["rendered"];
    }
  };

  const beforeModes = before.availableModes || getDefaultModes(before.type);
  const afterModes = after.availableModes || getDefaultModes(after.type);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Limit between 0% and 100%
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

      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // Restore normal selection and cursor
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    // Cleanup on unmount
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get mode label for button
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
      {/* Background Layer (After) - Always full width */}
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

      {/* Foreground Layer (Before) - Clipped by slider position */}
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

