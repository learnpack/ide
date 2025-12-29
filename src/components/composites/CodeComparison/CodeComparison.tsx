import React, { useState, useRef, useEffect, useCallback } from "react";
import { Preview } from "../Preview/Preview";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeComparisonProps {
  beforeHtml: string;
  afterHtml: string;
  beforeLabel?: string;
  afterLabel?: string;
  defaultPosition?: number; // 0-100, default 50
  height?: string; // CSS height value, default "600px"
}

export const CodeComparison: React.FC<CodeComparisonProps> = ({
  beforeHtml,
  afterHtml,
  beforeLabel = "Before",
  afterLabel = "After",
  defaultPosition = 50,
  height = "600px",
}) => {
  const [sliderPosition, setSliderPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [showBeforeCode, setShowBeforeCode] = useState(false);
  const [showAfterCode, setShowAfterCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

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
          {afterLabel && (
            <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
              {afterLabel}
            </div>
          )}
          <button
            onClick={() => setShowAfterCode(!showAfterCode)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            title={showAfterCode ? "Ver Renderizado" : "Ver Código"}
          >
            {showAfterCode ? "👁️ Vista" : "📝 Código"}
          </button>
        </div>
        
        {showAfterCode ? (
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
              {afterHtml}
            </SyntaxHighlighter>
          </div>
        ) : (
          <Preview
            html={afterHtml}
            onTitleRevealed={() => {}}
            useIframe={true}
          />
        )}
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
          {beforeLabel && (
            <div className="bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
              {beforeLabel}
            </div>
          )}
          <button
            onClick={() => setShowBeforeCode(!showBeforeCode)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            title={showBeforeCode ? "Ver Renderizado" : "Ver Código"}
          >
            {showBeforeCode ? "👁️ Vista" : "📝 Código"}
          </button>
        </div>
        
        {showBeforeCode ? (
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
              {beforeHtml}
            </SyntaxHighlighter>
          </div>
        ) : (
          <Preview
            html={beforeHtml}
            onTitleRevealed={() => {}}
            useIframe={true}
          />
        )}
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

