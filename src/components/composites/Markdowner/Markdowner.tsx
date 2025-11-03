import Markdown from "react-markdown";
import { Element } from "hast";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { DEV_MODE } from "../../../utils/lib";


import MermaidRenderer from "../MermaidRenderer/MermaidRenderer";
import { Question } from "../OpenQuestion/OpenQuestion";
import RealtimeLesson from "../../Creator/RealtimeLesson";
import RealtimeImage from "../../Creator/RealtimeImage";
import { RigoAI } from "../../Rigobot/AI";
import { FetchManager } from "../../../managers/fetchManager";
import { DIFF_SEPARATOR } from "../../Rigobot/Agent";
import { Icon } from "../../Icon";
import { generateCodeChallenge } from "../../../utils/creator";
import { Loader } from "../Loader/Loader";
import { useCompletionJobStatus } from "../../../hooks/useCompletionJobStatus";
import { AutoResizeTextarea } from "../AutoResizeTextarea/AutoResizeTextarea";


const ClickMeToGetID = ({ id }: { id: string }) => {
  const { t } = useTranslation();

  const copyLinkToClipboard = () => {
    const currentUrl = window.location.origin + window.location.pathname + window.location.search;
    const fullUrl = `${currentUrl}#${id}`;

    navigator.clipboard.writeText(fullUrl);
    toast.success(t("link-copied-to-clipboard"));

    window.location.hash = id;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="heading-link-button"
          onClick={copyLinkToClipboard}
          aria-label={t("copy-link-to-this-section")}
          style={{
            opacity: 0,
            transition: 'opacity 0.2s ease',
            position: 'absolute',
            left: '-25px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--bg-2)',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon name="Link" size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("copy-link-to-this-section")}</p>
      </TooltipContent>
    </Tooltip>
  );
};


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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }, 1000);
        }
      }, 1000);
    }
  }, [markdown]);

  return (
    <>
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
            if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
              const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
              const headingId = generateHeadingID(md);

              return (
                <h1 className="heading-with-link" id={headingId}>
                  {children}
                  <ClickMeToGetID id={headingId} />
                </h1>
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
            if (node?.position?.start?.offset && node?.position?.end?.offset) {
              const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
              const headingId = generateHeadingID(md);

              return (
                <h2 className="heading-with-link" id={headingId}>
                  {children}
                  <ClickMeToGetID id={headingId} />
                </h2>
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
            if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
              const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
              const headingId = generateHeadingID(md);

              return (
                <h3 className="heading-with-link" id={headingId}>
                  {children}
                  <ClickMeToGetID id={headingId} />
                </h3>
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
            if (typeof node?.position?.start?.offset === "number" && typeof node?.position?.end?.offset === "number") {
              const md = getPortion(node?.position?.start?.offset, node?.position?.end?.offset);
              const headingId = generateHeadingID(md);

              return (
                <h4 className="heading-with-link" id={headingId}>
                  {children}
                  <ClickMeToGetID id={headingId} />
                </h4>
              );
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
              const headingId = generateHeadingID(md);

              return (
                <h5 className="heading-with-link" id={headingId}>
                  {children}
                  <ClickMeToGetID id={headingId} />
                </h5>
              );
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
              const headingId = generateHeadingID(md);

              return (
                <h6 className="heading-with-link" id={headingId}>
                  {children}
                  <ClickMeToGetID id={headingId} />
                </h6>
              );
            }
            return <h6>{children}</h6>;
          },
          table: ({ children, node }) => {
            if (creatorModeActivated) {
              return (
                <CreatorWrapper node={node} tagName="table">
                  <table>{children}</table>
                </CreatorWrapper>
              );
            }
            return <table>{children}</table>;
          },
          hr: ({ children, node }) => {
            if (creatorModeActivated) {
              return (
                <CreatorWrapper node={node} tagName="hr">
                  <div className="padding-small">
                    <hr />
                  </div>
                </CreatorWrapper>
              );
            }
            return <h1>{children}</h1>;
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
                    allowCreate={allowCreate}
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
                allowCreate={allowCreate}
              />
            );
          },
        }}
      >
        {markdown}
      </Markdown>
    </>
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
  allowCreate,
}: // metadata,
  {
    code: string;
    language: string;
    metadata: TMetadata;
    wholeMD: string;
    node: any;
    allowCreate: boolean;
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
  const [isExecuting, setIsExecuting] = useState(false);
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

  if (language === "code_challenge_proposal") {
    return <CodeChallengeProposalRenderer node={node} code={code} allowCreate={allowCreate} />;
  }

  if (language === "new") {
    if (isCreator && mode === "creator") {
      return <CreatorWrapper node={node} tagName="new" />;
    } else return null;
  }
  if (language === "fill_in_the_blank" || language === "fill") {
    return <FillInTheBlankRenderer node={node} code={code} metadata={metadata} />;
  }

  const metadataComponents = {
    runnable: (value: boolean | string) => {
      if (value) {
        return (
          <SimpleButton
            title={t("runCode")}
            svg={isExecuting ? <Loader extraClass="svg-blue" svg={svgs.runCustom} text={t("runningCode")} size="sm"/> : svgs.runCustom}
            action={async () => {
              if (isExecuting) return;
              setIsExecuting(true);
              RigoAI.useTemplate({
                slug: "structured-build-learnpack",
                inputs: {
                  code: code,
                  inputs: "{}",
                },
                onComplete: (success, rigoData) => {
                  if (success) {
                    setExecutionResult(rigoData.data.parsed.stdout);
                    useConsumable("ai-compilation");
                  } else {
                    console.error("Error running code", rigoData);

                  }
                  setIsExecuting(false);
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
    toast.success(t("changes-accepted"));

    setEditingContent("");
  };

  const rejectChanges = async () => {
    console.log("rejectChanges", original, node.position.start, node.position.end);
    toast.success(t("changes-rejected"));
    setEditingContent("");

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


const randomFrom0to9 = () => {
  return Math.floor(Math.random() * 10);
};

const FillInTheBlankRenderer = ({ code, metadata }: { code: string, node: any, metadata: TMetadata }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { t } = useTranslation();

  // Extract correct answers from metadata
  const correctAnswers: Record<string, string[]> = {};
  Object.keys(metadata).forEach(key => {
    if (key.match(/^\d+$/)) { // Check if key is a number
      const answers = metadata[key] as string;
      correctAnswers[key] = answers.split(',').map(answer => answer.trim().toLowerCase());
    }
  });

  // Parse the text and create JSX elements
  const parseTextWithInputs = () => {
    const parts: (string | JSX.Element)[] = [];
    const blankRegex = /_(\d+)_/g;
    let lastIndex = 0;
    let match;

    while ((match = blankRegex.exec(code)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        parts.push(code.slice(lastIndex, match.index));
      }

      // Add input field for the blank
      const blankNum = match[1];
      const isCorrect = submitted && correctAnswers[blankNum]?.includes(answers[blankNum]?.toLowerCase());
      const isIncorrect = submitted && answers[blankNum] && !correctAnswers[blankNum]?.includes(answers[blankNum]?.toLowerCase());

      let inputClassName = "fill-blank-input";
      if (submitted) {
        if (isCorrect) {
          inputClassName += " correct-answer";
        } else if (isIncorrect) {
          inputClassName += " incorrect-answer";
        }
      }

      parts.push(
        <input
          key={`blank-${blankNum}`}
          type="text"
          className={inputClassName}
          placeholder="Type your answer..."
          value={answers[blankNum] || ''}
          onChange={(e) => setAnswers(prev => ({ ...prev, [blankNum]: e.target.value }))}
          readOnly={submitted}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < code.length) {
      parts.push(code.slice(lastIndex));
    }

    return parts;
  };

  // Get all blank numbers
  const blankRegex = /_(\d+)_/g;
  const blanks: string[] = [];
  let match;
  while ((match = blankRegex.exec(code)) !== null) {
    blanks.push(match[1]);
  }
  const uniqueBlanks = [...new Set(blanks)].sort((a, b) => parseInt(a) - parseInt(b));

  // Check if all blanks are filled
  const allFilled = uniqueBlanks.every(blankNum => answers[blankNum]?.trim());

  // Calculate score
  const correctCount = uniqueBlanks.filter(blankNum =>
    correctAnswers[blankNum]?.includes(answers[blankNum]?.toLowerCase())
  ).length;
  const totalCount = uniqueBlanks.length;

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResults(true);

    if (correctCount === totalCount) {
      toast.success(`Perfect! You got all ${totalCount} answers correct!`);
    } else {
      toast.error(`You got ${correctCount} out of ${totalCount} correct. ${t("Keep practicing!")}`);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setShowResults(false);
  };

  return (
    <div className="fill-in-the-blank-container">
      <h4 className="fill-blank-title">{t("Fill in the blank")}</h4>
      <p className="fill-blank-help">{t("Fill in the blanks with the correct words to complete the exercise. Type your answers in the input fields and click 'Check Answers' when you're done.")}</p>

      <div className="fill-in-the-blank-content">
        {parseTextWithInputs()}
      </div>

      <div className="fill-blank-buttons">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allFilled}
            className="check-answers-btn"
          >
            {t("Check Answers")}
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="try-again-btn"
          >
            {t("Try again")}
          </button>
        )}
      </div>

      {showResults && (
        <div className="fill-blank-results">
          <div className="results-header">
            <div className="results-title">{t("Results")}</div>
            <div className="score-badge">{correctCount}/{totalCount}</div>
          </div>

          <div className="results-content">
            <div className={`result-message ${correctCount === totalCount ? "perfect" : correctCount > totalCount / 2 ? "good" : "needs-improvement"}`}>
              {correctCount === totalCount ? (
                <>
                  <div className="celebration">🎉</div>
                  <div className="message-text">{t(`perfectSuccess.${randomFrom0to9()}`)}</div>
                </>
              ) : correctCount > totalCount / 2 ? (
                <>
                  <div className="celebration">👍</div>
                  <div className="message-text">{t(`goodSuccess.${randomFrom0to9()}`)}</div>
                </>
              ) : (
                <>
                  <div className="celebration">💪</div>
                  <div className="message-text">{t(`encouragement.${randomFrom0to9()}`)}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const CodeChallengeProposalRenderer = ({ code, node, allowCreate }: { code: string, node: Element, allowCreate: boolean }) => {
  
  const {
    replaceInReadme,
    token,
    currentExercisePosition,
    currentContent,
    configObject,
    fetchReadme,
    fetchExercises
  } = useStore((state) => ({
    replaceInReadme: state.replaceInReadme,
    token: state.token,
    currentExercisePosition: state.currentExercisePosition,
    currentContent: state.currentContent,
    configObject: state.configObject,
    fetchReadme: state.fetchReadme,
    fetchExercises: state.fetchExercises,
  }));
  const { t } = useTranslation();

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState("");

  // Check if this is a generating status
  const isGenerating = code.startsWith("GENERATING(");
  const generatingId = isGenerating ? code.match(/GENERATING\((\d+)\)/)?.[1] : null;
  const originalCode = isGenerating ? code.replace(/GENERATING\(\d+\)\s*/, '') : code;

  // Initialize editedCode when component mounts or originalCode changes
  useEffect(() => {
    if (!isEditing && editedCode === "") {
      setEditedCode(originalCode);
    }
  }, [editedCode, isEditing, originalCode]);

  // Polling hook for completion job status (as fallback)
  const { status: pollingStatus, data: pollingData } = useCompletionJobStatus({
    completionId: generatingId || null,
    token: token || null,
    pollingInterval: 7000,
    enabled: isGenerating && !!generatingId && !!token,
  });

  // Log polling results
  useEffect(() => {
    if (pollingStatus === "SUCCESS") {
      handleCodeChallengeUpdate(pollingStatus);
    } else if (pollingStatus === "ERROR") {
      handleCodeChallengeUpdate(pollingStatus);
    } else if (pollingStatus === "PENDING") {
      console.log("⏳ POLLING: Code challenge running...", pollingData);
    }
  }, [pollingStatus]);

  
  if (!node) return null;

  // Handle socket updates for code challenge completion
  const handleCodeChallengeUpdate = async (status: string) => {
    if (status === "SUCCESS") {
      // Remove the code challenge proposal
      const finalContent = "";
      if (node?.position?.start && node?.position?.end) {
        replaceInReadme(finalContent, node.position.start, node.position.end);
      }

      toast.success(t("code-challenge-generation-completed"));
      setTimeout(async () => {
        await fetchExercises();
        await fetchReadme();

      }, 1000);
    } else if (status === "ERROR") {
      toast.error(t("code-challenge-generation-failed"));
      const errorContent = `\`\`\`code_challenge_proposal
      ${originalCode}
      \`\`\``;
      if (node?.position?.start && node?.position?.end) {
        replaceInReadme(errorContent, node.position.start, node.position.end);
      }
    }
  };


  const handleReject = () => {
    if (!node.position) {
      toast.error(t("error-rejecting-changes"));
      return;
    };
    replaceInReadme("", node.position.start, node.position.end);
    toast.success(t("changes-rejected"));
    console.log("reject");
  };

  const handleAccept = async () => {
    if (!token) {
      toast.error(t("authentication-required"));
      return;
    }

    // Use editedCode if it exists, otherwise fall back to originalCode
    const codeToUse = editedCode || originalCode;

    if (!codeToUse || !currentContent) {
      toast.error(t("missing-required-content"));
      return;
    }

    const courseSlug = configObject?.config?.slug;
    if (!courseSlug) {
      toast.error(t("course-slug-not-found"));
      return;
    }

    const tid = toast.loading(t("generating-code-challenge"));
    try {

      const result = await generateCodeChallenge(
        codeToUse,
        currentContent,
        Number(currentExercisePosition),
        token,
        courseSlug
      );

      if (result.status === "QUEUED") {
        // Update the markdown to show GENERATING status
        const generatingContent = `\`\`\`code_challenge_proposal\nGENERATING(${result.id}) ${codeToUse}\n\`\`\``;
        if (node?.position?.start && node?.position?.end) {
          await replaceInReadme(generatingContent, node.position.start, node.position.end);
        }

        toast.success(t("code-challenge-generation-started"), { id: tid });
        console.log("Code challenge generation started with ID:", result.id);
      } else {
        toast.error(t("failed-to-start-code-challenge-generation"), { id: tid });
      }
    } catch (error) {
      console.error("Error generating code challenge:", error);
      toast.error(t("error-generating-code-challenge-files"), { id: tid });
    }
  };

  // Show loader if generating
  if (isGenerating) {
    return (
      <div className="bg-2 padding-medium rounded border-blue">
        <h4 className="gap-small text-center flex-x align-center justify-center">
          <Icon name="Code" /> {t("code-challenge-proposal")}
        </h4>
        <div className="flex-y gap-small align-center justify-center">
          <Loader
            size="lg"
            text={`Generating code challenge files... (ID: ${generatingId})`}
            svg={svgs.rigoSvg}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-2 padding-medium rounded border-blue">
      <h4 className="gap-small text-center flex-x align-center justify-center"><Icon name="Code" /> {t("code-challenge-proposal")}</h4>
      
      {allowCreate && isEditing ? (
        <div className="flex-y gap-small">
          <AutoResizeTextarea
            defaultValue={editedCode || originalCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-100"
            minHeight="100px"
            placeholder={t("code-challenge-description-placeholder") || "Describe el ejercicio de código..."}
          />
          <div className="d-flex gap-small justify-center">
            <SimpleButton 
              action={() => {
                setIsEditing(false);
                // Update the markdown with edited content
                const updatedContent = `\`\`\`code_challenge_proposal\n${editedCode || originalCode}\n\`\`\``;
                if (node?.position?.start && node?.position?.end) {
                  replaceInReadme(updatedContent, node.position.start, node.position.end);
                }
              }} 
              extraClass="bg-blue-rigo text-white padding-small rounded" 
              text={t("save")} 
              svg={<Icon name="Check" />} 
            />
            <SimpleButton 
              action={() => {
                setIsEditing(false);
                setEditedCode(originalCode);
              }} 
              extraClass="bg-gray padding-small rounded" 
              text={t("cancel")} 
              svg={<Icon name="X" />} 
            />
          </div>
        </div>
      ) : (
        <>
          <p>{editedCode || originalCode}</p>
          {allowCreate && (
            <div className="d-flex gap-small justify-center">
              <SimpleButton 
                action={() => setIsEditing(true)} 
                extraClass="bg-gray padding-small rounded" 
                text={t("edit")} 
                svg={svgs.edit} 
              />
              <SimpleButton 
                action={handleAccept} 
                extraClass="bg-blue-rigo text-white padding-small rounded" 
                text={t("accept")} 
                svg={<Icon name="Check" />} 
              />
              <SimpleButton 
                action={handleReject} 
                extraClass="bg-gray padding-small rounded" 
                text={t("reject")} 
                svg={<Icon name="X" />} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

