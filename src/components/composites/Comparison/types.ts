import React from "react";

// Types for content modes
export type ContentMode = "rendered" | "raw";

export type ContentType = "html" | "text" | "code" | "mermaid" | "markdown" | "image" | "custom";

// Layout types for comparison
export type ComparisonLayout = "slider" | "side-by-side";

export interface ComparisonItem {
  content: string | unknown;
  type: ContentType;
  label?: string;
  language?: string; // For code highlighting
  availableModes?: ContentMode[]; // Modes available for this item
  customRender?: (content: unknown, mode: ContentMode) => React.ReactNode;
}

export interface ComparisonProps {
  before: ComparisonItem;
  after: ComparisonItem;
  defaultPosition?: number; // 0-100, default 50 (only for slider layout)
  height?: string; // CSS height value, default "600px"
  syncModes?: boolean; // If true, both panels change mode together (default: true)
  layout?: ComparisonLayout; // Layout type, auto-determined if not specified
}

