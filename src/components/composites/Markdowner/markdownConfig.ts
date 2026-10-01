import { type PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import emoji from "remark-emoji";
import { remarkInlineHtmlToCode } from "./remarkInlineHtmlToCode";
import { FetchManager } from "../../../managers/fetchManager";
import { DEV_MODE } from "../../../utils/lib";

// Shared by the interactive lesson renderer (Markdowner) and the read-only
// full content view, so both parse lesson markdown the same way.

// singleDollarTextMath is disabled so a lone "$" is treated as literal text:
// with it enabled, prose containing two dollar signs (e.g. "$300,000 ... $310,000"
// or two n8n "{{ $json.x }}" expressions) gets the span between them swallowed
// and typeset as a KaTeX formula. Math still renders via $$...$$ (inline or block).
export const REMARK_PLUGINS: PluggableList = [
  remarkGfm,
  [remarkMath, { singleDollarTextMath: false }],
  emoji,
  remarkInlineHtmlToCode,
];
export const REHYPE_PLUGINS = [rehypeKatex];

const isTrueOrFalse = (value: string) => {
  return value.toLowerCase() === "true" || value.toLowerCase() === "false";
};

const parseBooleans = (value: string) => {
  if (isTrueOrFalse(value)) {
    if (value.toLowerCase() === "true") {
      return true;
    }
    return false;
  }
  return value;
};

export const extractMetadata = (metadata: string) => {
  const metadataObject: Record<string, string | boolean> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;

  while ((match = regex.exec(metadata)) !== null) {
    const [, key, value] = match;
    metadataObject[key] = parseBooleans(value);
  }

  return metadataObject;
};

export const fixSrc = (src: string, slug: string, environment: string) => {
  // Normalize leading ../../.learn to /.learn
  const normalizedSrc = src.replace(/^(\.\.\/)+\.learn/, "/.learn");

  if (environment === "scorm") {
    return FetchManager.HOST + normalizedSrc
  }
  if (normalizedSrc.includes("/.learn/assets/")) {
    if (DEV_MODE) {
      return "http://localhost:3000" + normalizedSrc + "?slug=" + slug;
    }
    return normalizedSrc + "?slug=" + slug;
  }
  return normalizedSrc;
};
