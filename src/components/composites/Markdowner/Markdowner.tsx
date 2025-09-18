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
import { useState } from "react";

import MermaidRenderer from "../MermaidRenderer/MermaidRenderer";
import { Question } from "../OpenQuestion/OpenQuestion";
import RealtimeLesson from "../../Creator/RealtimeLesson";
import { DEV_MODE } from "../../../utils/lib";
import RealtimeImage from "../../Creator/RealtimeImage";
import { RigoAI } from "../../Rigobot/AI";
import { FetchManager } from "../../../managers/fetchManager";
import { DIFF_SEPARATOR } from "../../Rigobot/Agent";
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

const generateHeadingID = (md: string) => {
  // This function should remove specia characters, replace spaces with - and make it lowercase
  return md.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
}

export const Markdowner = ({
  markdown,
  allowCreate = false,
}: {
  markdown: string;
  allowCreate?: boolean;
}) => {
  const { openLink, mode, isCreator, config, getPortion } = useStore((state) => ({
    openLink: state.openLink,
    mode: state.mode,
    isCreator: state.isCreator,
    config: state.configObject,
    getPortion: state.getPortion,
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
          console.log("NODE", node);
          if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {

            const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
            
            return <h1 id={generateHeadingID(md)}>{children}</h1>;
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
          if (node?.position?.start?.offset && node?.position?.end?.offset) {
            const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
            return <h2 id={generateHeadingID(md)}>{children}</h2>;
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
          if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
            const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
            return <h3 id={generateHeadingID(md)}>{children}</h3>;
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
          if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
            const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
            return <h4 id={generateHeadingID(md)}>{children}</h4>;
          }
          return <h4>{children}</h4>;
        },
        h5: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="h5">
                <h5>{children}</h5>
              </CreatorWrapper>
            );
          }
          if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
            const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
            return <h5 id={generateHeadingID(md)}>{children}</h5>;
          }
          return <h5>{children}</h5>;
        },
        h6: ({ children, node }) => {
          if (creatorModeActivated) {
            return (
              <CreatorWrapper node={node} tagName="h6">
                <h6>{children}</h6>
              </CreatorWrapper>
            );
          }
          if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
            const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
            return <h6 id={generateHeadingID(md)}>{children}</h6>;
          }
          return <h6>{children}</h6>;
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

const fixSrc = (src: string, slug: string, environment: string) => {
  // Normalize leading ../../.learn to /.learn
  let normalizedSrc = src.replace(/^(\.\.\/)+\.learn/, "/.learn");

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
  const replaceInReadme = useStore((state) => state.replaceInReadme);
  const [hasError, setHasError] = useState(false);

  const handleGenerationError = () => {
    replaceInReadme("", node.position.start, node.position.end);
  };
  if (src) {
    if (isCreator && mode === "creator" && allowCreate) {
      return (
        <CreatorWrapper node={node} tagName="img">
          {hasError && environment === "creatorWeb" ? (
            <RealtimeImage
              onError={handleGenerationError}
              allowCreate={allowCreate}
              imageId={src.split("/").pop() || ""}
              alt={alt || ""}
              node={node}
            />
          ) : (
            <img
              onError={() => setHasError(true)}
              src={fixSrc(src, config?.config?.slug, environment)}
              alt={alt}
            />
          )}
        </CreatorWrapper>
      );
    }

    return (
      <>
        {hasError && environment === "creatorWeb" ? (
          <RealtimeImage
            alt={alt || ""} 
            allowCreate={allowCreate || false}
            onError={handleGenerationError}
            imageId={src.split("/").pop() || ""}
            node={node}
          />
        ) : (
          <img
            onError={() => setHasError(true)}
            src={fixSrc(src, config?.config?.slug, environment)}
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
  const {
    getCurrentExercise,
    isIframe,
    agent,
    isCreator,
    mode,
    useConsumable,
  } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    isIframe: state.isIframe,
    token: state.token,
    agent: state.agent,
    isCreator: state.isCreator,
    mode: state.mode,
    useConsumable: state.useConsumable,
  }));

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

  if (language === "changesDiff") {
    return <ChangesDiffRenderer node={node} code={code} />;
  }

  if (language === "loader") {
    return <RealtimeLesson />;
  }

  if (language === "new") {
    if (isCreator && mode === "creator") {
      return <CreatorWrapper node={node} tagName="new" />;
    } else return null;
  }

  const metadataComponents = {
    runnable: (value: boolean | string) => {
      if (value) {
        return (
          <SimpleButton
            title={t("runCode")}
            svg={svgs.runCustom}
            action={async () => {
              const tid = toast.loading(t("runningCode"));
              RigoAI.useTemplate({
                slug: "structured-build-learnpack",
                inputs: {
                  code: code,
                  inputs: "{}",
                },
                onComplete: (success, rigoData) => {
                  // console.log(success, rigoData);
                  toast.dismiss(tid);
                  if (success) {
                    setExecutionResult(rigoData.data.parsed.stdout);
                    useConsumable("ai-compilation");
                  } else {
                    toast.error(t("errorRunningCode"));
                    toast.dismiss(tid);
                  }
                },
              });
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

const ChangesDiffRenderer = ({ code, node }: { code: string, node: any }) => {
  const [original, newContent] = code.split(DIFF_SEPARATOR);
  const replaceInReadme = useStore((state) => state.replaceInReadme);
  const setEditingContent = useStore((state) => state.setEditingContent);
  const { t } = useTranslation();

  const acceptChanges = async () => {
    console.log("acceptChanges", newContent, node.position.start, node.position.end);
    await replaceInReadme(newContent, node.position.start, node.position.end);
    toast.success(t("changesAccepted"));
    
    setEditingContent("");
  };

  const rejectChanges = async () => {
    console.log("rejectChanges", original, node.position.start, node.position.end);
    await replaceInReadme(original, node.position.start, node.position.end);
    toast.success(t("changesRejected"));
  };

  return (
    <div className="flex-y gap-medium">
      <div className="flex-y">
        <div className="bg-soft-red padding-small">
            <Markdowner markdown={original} allowCreate={false} />
        </div>
        <div className="bg-soft-green padding-small">
            <Markdowner markdown={newContent} allowCreate={false} />
        </div>
      </div>
        <div className="d-flex gap-small justify-center">
          <SimpleButton
            title={t("acceptChanges")}
            svg={svgs.iconCheck}
            extraClass="bg-soft-green button "
            action={acceptChanges}
            text={t("acceptChanges")}
          />  
          <SimpleButton
            title={t("rejectChanges")}
            svg={svgs.iconClose}
            extraClass="bg-soft-red button"
            action={rejectChanges}
            text={t("rejectChanges")}
          />
        </div>
    </div>
  );
};
