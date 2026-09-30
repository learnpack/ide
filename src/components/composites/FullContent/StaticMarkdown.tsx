import { memo, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import { Element } from "hast";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTranslation } from "react-i18next";
import useStore from "../../../utils/store";
import {
  REHYPE_PLUGINS,
  REMARK_PLUGINS,
  extractMetadata,
  fixSrc,
} from "../Markdowner/markdownConfig";
import { TMetadata } from "../Markdowner/types";
import { parseOrderingItems } from "../QuizRenderer/quizSubmissionUtils";

// Read-only rendering of a lesson for the full content view. Unlike Markdowner
// it has no interactive components: nothing here registers telemetry or reads
// the current step, and no answer is revealed (quiz options are never checked,
// blanks are empty, select options are sorted alphabetically and ordering
// items are shuffled).

const BLANK = "________";
const BLANK_REGEX = /_(\d+)_/g;
const HIDDEN_BLOCKS = ["changesDiff", "loader", "code_challenge_proposal", "new"];

const sortAlphabetically = (items: string[]) =>
  [...items].sort((a, b) => a.localeCompare(b));

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
};

// Ordering items are written in the correct order, so they are shuffled the
// same way on every render (screen and PDF match) and never left as written
const shuffleOrderingItems = (items: string[]) => {
  const shuffled = [...items].sort((a, b) => hashString(a) - hashString(b));
  const isOriginalOrder = shuffled.every((item, index) => item === items[index]);
  return isOriginalOrder && items.length > 1
    ? [...shuffled.slice(1), shuffled[0]]
    : shuffled;
};

const getCodeBlock = (node?: Element) => {
  const child = node?.children[0];
  if (!child || child.type !== "element") return null;

  const code = child.children
    .map((c) => (c.type === "text" ? c.value : ""))
    .join("");
  const classNames = child.properties?.className;
  const lang =
    Array.isArray(classNames) && classNames.length > 0
      ? String(classNames[0]).split("-")[1]
      : "text";
  const meta = (child.data as { meta?: string } | undefined)?.meta;
  const metadata: TMetadata = meta ? extractMetadata(meta) : {};

  return { code, lang, metadata };
};

const getBlankNumbers = (code: string) => {
  const numbers = [...code.matchAll(BLANK_REGEX)].map((match) => match[1]);
  return [...new Set(numbers)].sort((a, b) => Number(a) - Number(b));
};

const BlankText = ({ code, numbered }: { code: string; numbered: boolean }) => (
  <p className="full-content-blank-text">
    {code
      .trim()
      .replace(BLANK_REGEX, (_, number) =>
        numbered ? `${BLANK} (${number})` : BLANK
      )}
  </p>
);

const SelectTheBlank = ({
  code,
  metadata,
}: {
  code: string;
  metadata: TMetadata;
}) => {
  const blanks = getBlankNumbers(code);
  const numbered = blanks.length > 1;
  return (
    <div className="full-content-exercise">
      <BlankText code={code} numbered={numbered} />
      <ul>
        {blanks.map((number) => {
          const options = String(metadata[number] ?? "")
            .split("|")
            .map((option) => option.trim())
            .filter(Boolean);
          return (
            <li key={number}>
              {numbered && `(${number}) `}
              {sortAlphabetically(options).join(" / ")}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Ordering = ({ code, metadata }: { code: string; metadata: TMetadata }) => {
  const { t } = useTranslation();
  const title =
    typeof metadata.title === "string" && metadata.title
      ? metadata.title
      : t("full-content-order-the-items");
  return (
    <div className="full-content-exercise">
      <p>
        <strong>{title}</strong>
      </p>
      <ul>
        {shuffleOrderingItems(parseOrderingItems(code)).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const OpenQuestionSpace = () => {
  const { t } = useTranslation();
  return (
    <div className="full-content-exercise">
      <p className="full-content-hint">{t("full-content-open-question")}</p>
      <div className="full-content-answer-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

const StaticCodeBlock = ({ node }: { node?: Element }) => {
  const block = getCodeBlock(node);
  if (!block) return null;
  const { code, lang, metadata } = block;

  if (HIDDEN_BLOCKS.includes(lang)) return null;
  if (lang === "question") return <OpenQuestionSpace />;
  if (lang === "mermaid") return <div className="mermaid">{code}</div>;
  if (lang === "stdout" || lang === "stderr") {
    return <pre className={lang}>{code}</pre>;
  }
  if (lang === "fill_in_the_blank" || lang === "fill") {
    return (
      <div className="full-content-exercise">
        <BlankText code={code} numbered={getBlankNumbers(code).length > 1} />
      </div>
    );
  }
  if (lang === "select_the_blank" || lang === "select") {
    return <SelectTheBlank code={code} metadata={metadata} />;
  }
  if (lang === "ordering" || lang === "order") {
    return <Ordering code={code} metadata={metadata} />;
  }

  return (
    <SyntaxHighlighter
      language={lang}
      style={oneLight}
      wrapLongLines
      customStyle={{ fontSize: "0.8em", borderRadius: "8px" }}
    >
      {code.replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
};

const StaticImage = ({ src, alt }: { src?: string; alt?: string }) => {
  const environment = useStore((state) => state.environment);
  const slug = useStore((state) => state.configObject?.config?.slug);
  const [hasError, setHasError] = useState(false);

  // A missing image is left out: its alt text is often the long prompt it was
  // generated from, which reads as noise in the document
  if (!src || hasError) return null;
  return (
    <img
      src={fixSrc(src, slug ?? "", environment)}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
};

const isRigoQuestion = (href: string) =>
  href.startsWith("https://4geeks.com/ask?query=");
const isCommunityLink = (href: string) =>
  href.startsWith("https://4geeks.com/community");

const components: Partial<Components> = {
  a: ({ href, children }) => {
    if (!href || isRigoQuestion(href)) return <span>{children}</span>;
    if (isCommunityLink(href)) return null;
    if (href.startsWith("#")) return <a href={href}>{children}</a>;
    return (
      <a className="link" href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  // Quiz options (task lists) are always shown unchecked so the correct
  // answer is not revealed
  input: ({ type }) =>
    type === "checkbox" ? (
      <span className="full-content-checkbox" aria-hidden="true" />
    ) : null,
  img: ({ src, alt }) => <StaticImage src={src} alt={alt} />,
  pre: ({ node }) => <StaticCodeBlock node={node} />,
};

export const StaticMarkdown = memo(function StaticMarkdown({
  markdown,
}: {
  markdown: string;
}) {
  return (
    <Markdown
      skipHtml={true}
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      components={components}
    >
      {markdown}
    </Markdown>
  );
});
