import type { InlineCode, Parent, Root } from "mdast";

// Rigobot sometimes generates lesson text where an HTML tag mentioned in prose
// is not wrapped in backticks (e.g. "## The <form> Tag"). The markdown parser
// tokenizes the bare tag as raw inline HTML and react-markdown's skipHtml then
// deletes it, so the heading renders as "The  Tag" (learnpack/learnpack#1933).
//
// This plugin converts inline raw-HTML nodes into inlineCode, so the tag
// renders exactly as if the author had written `<form>`. Block-level HTML
// (intentional layout markup such as <details> wrappers or spacer divs) and
// HTML comments (<!-- hide -->) are left untouched: skipHtml keeps dropping
// them, exactly as before.
const transformChildren = (parent: Parent) => {
  parent.children.forEach((child, index) => {
    if (
      child.type === "html" &&
      parent.type !== "root" &&
      !child.value.trimStart().startsWith("<!--")
    ) {
      // position carried over so position-based features (creator editing,
      // getPortion) still see the original offsets.
      const replacement: InlineCode = {
        type: "inlineCode",
        value: child.value,
        position: child.position,
      };
      parent.children[index] = replacement;
    } else if ("children" in child) {
      transformChildren(child);
    }
  });
};

export const remarkInlineHtmlToCode = () => (tree: Root) => {
  transformChildren(tree);
};
