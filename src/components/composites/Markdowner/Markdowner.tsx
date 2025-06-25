import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TMetadata } from "./types";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import useStore from "../../../utils/store";
import emoji from "remark-emoji";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark as prismStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { QuizRenderer } from "../QuizRenderer/QuizRenderer";
import { RigoQuestion } from "../RigoQuestion/RigoQuestion";
import { CreatorWrapper } from "../../Creator/Creator";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { buildRigo } from "../../../managers/EventProxy";
import { useState } from "react";

import MermaidRenderer from "../MermaidRenderer/MermaidRenderer";
import { Question } from "../OpenQuestion/OpenQuestion";
import RealtimeLesson from "../../Creator/RealtimeLesson";
import { DEV_MODE } from "../../../utils/lib";
import RealtimeImage from "../../Creator/RealtimeImage";
const isRigoQuestion = (href: string) => {
  return href.startsWith("https://4geeks.com/ask?query=");
};
const checkForQuiz = (node: any) => {
  const containsTaskList = node?.children.filter(
    (child: any) =>
      child.type === "element" &&
      child.tagName === "li" &&
      child.children.some(
        (child: any) =>
          child.type === "element" &&
          (child.tagName === "ul" || child.tagName === "ol") &&
          // @ts-ignore
          child.properties?.className?.includes("contains-task-list")
      )
  );
  return containsTaskList && containsTaskList.length > 0;
};

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

const extractMetadata = (metadata: string) => {
  const metadataObject: Record<string, string | boolean> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;

  while ((match = regex.exec(metadata)) !== null) {
    const [_, key, value] = match;
    metadataObject[key] = parseBooleans(value);
  }

  return metadataObject;
};

export const Markdowner = ({
  markdown,
  allowCreate = false,
}: {
  markdown: string;
  allowCreate?: boolean;
}) => {
  const { openLink, mode, isCreator, config } = useStore((state) => ({
    openLink: state.openLink,
    mode: state.mode,
    isCreator: state.isCreator,
    config: state.configObject,
  }));

  const creatorModeActivated = isCreator && mode === "creator" && allowCreate;

  return (
    <Markdown
      skipHtml={true}
      remarkPlugins={[remarkGfm, remarkMath, emoji]}
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ href, children }) => {
          if (href) {
            if (isRigoQuestion(href)) {
              return <RigoQuestion href={href}>{children}</RigoQuestion>;
            }
            return (
              <a onClick={() => openLink(href)} target="_blank" href={href}>
                {children}
              </a>
            );
          }
          return <span>{children}</span>;
        },
        h1: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="h1">
                <h1>{children}</h1>
              </CreatorWrapper>
            );
          }
          return <h1>{children}</h1>;
        },
        h2: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="h2">
                <h2>{children}</h2>
              </CreatorWrapper>
            );
          }
          return <h2>{children}</h2>;
        },
        h3: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="h3">
                <h3>{children}</h3>
              </CreatorWrapper>
            );
          }
          return <h3>{children}</h3>;
        },
        h4: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="h4">
                <h4>{children}</h4>
              </CreatorWrapper>
            );
          }
          return <h4>{children}</h4>;
        },
        p: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="p">
                <p>{children}</p>
              </CreatorWrapper>
            );
          }
          return <p>{children}</p>;
        },
        blockquote: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="blockquote">
                <blockquote>{children}</blockquote>
              </CreatorWrapper>
            );
          }
          return <blockquote>{children}</blockquote>;
        },
        // @ts-ignore
        ol: ({ children, node }) => {
          const containsTaskList = checkForQuiz(node);

          if (containsTaskList) {
            if (creatorModeActivated) {
              return (
                <CreatorWrapper node={node} tagName="quiz">
                  <QuizRenderer children={children} />
                </CreatorWrapper>
              );
            }
            return <QuizRenderer children={children} />;
          }

          const start = node?.properties?.start;

          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="ol">
                <ol start={start ? Number(start) : undefined}>{children}</ol>
              </CreatorWrapper>
            );
          }
          return <ol start={start ? Number(start) : undefined}>{children}</ol>;
        },
        // @ts-ignore
        ul: ({ children, node }) => {
          const containsTaskList = checkForQuiz(node);

          if (containsTaskList) {
            if (creatorModeActivated) {
              return (
                <CreatorWrapper node={node} tagName="quiz">
                  <QuizRenderer children={children} />
                </CreatorWrapper>
              );
            }
            return <QuizRenderer children={children} />;
          }

          if (isCreator && mode === "creator" && allowCreate) {
            return (
              <CreatorWrapper node={node} tagName="ul">
                <ul>{children}</ul>
              </CreatorWrapper>
            );
          }

          return <ul onClick={() => console.log(node)}>{children}</ul>;
        },
        img: ({ src, alt, node }) => {
          return (
            <CustomImage
              src={src}
              alt={alt}
              node={node}
              allowCreate={allowCreate}
              isCreator={isCreator}
              mode={mode}
              config={config}
            />
          );
        },

        pre(props) {
          const codeBlocks = props.node?.children.map((child) => {
            // @ts-ignore
            const code = child.children.map((c) => c.value).join("");
            // @ts-ignore
            const classNames = child.properties?.className;
            // @ts-ignore F
            const metadata = child.data?.meta || "";
            let metadataObject: TMetadata = {};
            let lang = "text";
            if (classNames && classNames?.length > 0) {
              lang = classNames[0].split("-")[1];
            }

            if (metadata) {
              metadataObject = extractMetadata(metadata);
            }
            return {
              lang,
              code,
              metadata: metadataObject,
            };
          });
          if (!codeBlocks || codeBlocks.length === 0) {
            return <pre>{props.children}</pre>;
          }

          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={props.node} tagName="pre">
                <CustomCodeBlock
                  node={props.node}
                  code={codeBlocks[0].code}
                  language={codeBlocks[0].lang}
                  metadata={codeBlocks[0].metadata}
                  wholeMD={markdown}
                />
              </CreatorWrapper>
            );
          }
          return (
            <CustomCodeBlock
              node={props.node}
              code={codeBlocks[0].code}
              language={codeBlocks[0].lang}
              metadata={codeBlocks[0].metadata}
              wholeMD={markdown}
            />
          );
        },
      }}
    >
      {markdown}
    </Markdown>
  );
};

const fixSrc = (src: string, slug: string) => {
  // Normalize leading ../../.learn to /.learn
  let normalizedSrc = src.replace(/^(\.\.\/)+\.learn/, "/.learn");

  if (normalizedSrc.includes("/.learn/assets/")) {
    if (DEV_MODE) {
      return "http://localhost:3000" + normalizedSrc + "?slug=" + slug;
    }
    return normalizedSrc + "?slug=" + slug;
  }
  return normalizedSrc;
};

const CustomImage = ({
  src,
  alt,
  node,
  allowCreate,
  isCreator,
  mode,
  config,
}: {
  src?: string;
  alt?: string;
  node?: any;
  allowCreate?: boolean;
  isCreator?: boolean;
  mode?: string;
  config?: any;
}) => {
  const environment = useStore((state) => state.environment);
  const [hasError, setHasError] = useState(false);
  if (src) {
    if (isCreator && mode === "creator" && allowCreate) {
      return (
        <CreatorWrapper node={node} tagName="img">
          {hasError && environment === "creatorWeb" ? (
            <RealtimeImage imageId={src.split("/").pop() || ""} />
          ) : (
            <img
              onError={() => setHasError(true)}
              src={fixSrc(src, config?.config?.slug)}
              alt={alt}
            />
          )}
        </CreatorWrapper>
      );
    }

    return (
      <>
        {hasError && environment === "creatorWeb" ? (
          <RealtimeImage imageId={src.split("/").pop() || ""} />
        ) : (
          <img
            onError={() => setHasError(true)}
            src={fixSrc(src, config?.config?.slug)}
            alt={alt}
          />
        )}
      </>
    );
  }
  return <span>{alt}</span>;
};

const objectToArray = (
  obj: Record<string, string | boolean>
): { key: string; value: string | boolean }[] => {
  // Record<string, string | boolean> is a type that represents an object with string keys and string or boolean values.
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
};

const CustomCodeBlock = ({
  code,
  language,
  metadata,
  wholeMD,
  node,
}: // metadata,
{
  code: string;
  language: string;
  metadata: TMetadata;
  wholeMD: string;
  node: any;
}) => {
  const { getCurrentExercise, isIframe, token, agent, isCreator } = useStore(
    (state) => ({
      getCurrentExercise: state.getCurrentExercise,
      isIframe: state.isIframe,
      token: state.token,
      agent: state.agent,
      isCreator: state.isCreator,
    })
  );

  const { t } = useTranslation();
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  if (language === "stdout" || language === "stderr") {
    return (
      <div className={`${language}`}>
        {language === "stdout" && (
          <p className="stdout-prefix">
            ~/learnpack/{getCurrentExercise().slug}
          </p>
        )}
        {code}
      </div>
    );
  }

  if (language === "question") {
    return (
      <Question
        metadata={metadata}
        wholeMD={wholeMD}
        code={code}
        isCreator={isCreator}
        node={node}
      />
    );
  }
  if (language === "mermaid") {
    return <MermaidRenderer code={code} />;
  }

  if (language === "loader") {
    return <RealtimeLesson />;
  }

  const metadataComponents = {
    runnable: (value: boolean | string) => {
      if (value) {
        return (
          <SimpleButton
            title={t("runCode")}
            svg={svgs.runCustom}
            action={async () => {
              const result = await buildRigo(token, {
                code: code,
                inputs: "{}",
              });
              setExecutionResult(result.stdout);
            }}
            extraClass=""
          />
        );
      }
    },
  };

  const metadataComponentsArray = objectToArray(metadata);

  return (
    <div className="flex-y my-small custom-code-block">
      <div className="d-flex justify-between align-center code-buttons">
        <span className="language">{language}</span>
        <div className="d-flex gap-small">
          {!isIframe && agent !== "vscode" && (
            <SimpleButton
              title={t("copyCodeToClipboard")}
              svg={svgs.copy}
              action={() => {
                navigator.clipboard.writeText(code);
                toast.success(t("copied"));
              }}
              extraClass="color-blue"
            />
          )}
          {metadataComponentsArray.map(({ key, value }) => {
            if (Object.keys(metadataComponents).includes(key)) {
              return metadataComponents[key as keyof typeof metadataComponents](
                value
              );
            }
          })}
        </div>
      </div>

      <SyntaxHighlighter language={language} style={prismStyle}>
        {code}
      </SyntaxHighlighter>
      {executionResult && (
        <div className="stdout">
          <p className="stdout-prefix">
            ~/learnpack/{getCurrentExercise().slug}
          </p>
          {executionResult}
        </div>
      )}
    </div>
  );
};
