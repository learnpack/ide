import React from "react";
import { Comparison } from "../Comparison/Comparison";
import type { ComparisonItem, ContentType, ComparisonLayout, ContentMode } from "../Comparison/types";
import { TMetadata } from "../Markdowner/types";

interface ComparisonRendererProps {
  code: string;
  metadata: TMetadata;
  wholeMD: string;
  node: any;
  allowCreate: boolean;
}

export const ComparisonRenderer: React.FC<ComparisonRendererProps> = ({
  code,
  metadata,
}) => {
  // Split content by separator
  const parts = code.split("---SEPARATOR---");
  
  if (parts.length !== 2) {
    return (
      <div className="bg-soft-red padding-small rounded">
        <strong>Error:</strong> El componente Comparison requiere exactamente 2 bloques de contenido separados por "---SEPARATOR---"
      </div>
    );
  }

  const [leftContent, rightContent] = parts.map(p => p.trim());
  
  // Extract and validate metadata
  const type = (metadata.type as string || "code") as ContentType;
  const language = metadata.language as string | undefined;
  const leftLabel = metadata.left as string | undefined;
  const rightLabel = metadata.right as string | undefined;
  const layout = metadata.layout as ComparisonLayout | undefined;
  const height = (metadata.height as string) || "600px";
  const syncModes = metadata.syncModes !== "false" && metadata.syncModes !== false; // default true
  const leftDefaultMode = metadata.leftDefaultMode as ContentMode | undefined;
  const rightDefaultMode = metadata.rightDefaultMode as ContentMode | undefined;

  // Validate type
  const validTypes: ContentType[] = ["html", "text", "code", "mermaid", "markdown", "image", "custom"];
  if (!validTypes.includes(type)) {
    return (
      <div className="bg-soft-red padding-small rounded">
        <strong>Error:</strong> El tipo "{type}" no es válido. Usa: html, text, code, mermaid, markdown, image.
      </div>
    );
  }

  // Validate code type requires language
  if (type === "code" && !language) {
    return (
      <div className="bg-soft-red padding-small rounded">
        <strong>Error:</strong> El tipo "code" requiere el atributo "language" (ej: language="python")
      </div>
    );
  }

  // Build comparison items
  const left: ComparisonItem = {
    content: leftContent,
    type: type,
    label: leftLabel,
    language: language,
    defaultMode: leftDefaultMode,
  };

  const right: ComparisonItem = {
    content: rightContent,
    type: type,
    label: rightLabel,
    language: language,
    defaultMode: rightDefaultMode,
  };

  return (
    <div className="my-small">
      <Comparison
        left={left}
        right={right}
        layout={layout}
        height={height}
        syncModes={syncModes}
      />
    </div>
  );
};

