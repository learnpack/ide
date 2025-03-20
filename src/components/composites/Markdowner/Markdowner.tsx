import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import useStore from "../../../utils/store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark as prismStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { QuizRenderer } from "../QuizRenderer/QuizRenderer";
import { RigoQuestion } from "../RigoQuestion/RigoQuestion";
import { CreatorWrapper } from "../../Creator/Creator";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { buildRigo, checkAnswer } from "../../../managers/EventProxy";
import { useRef, useState } from "react";
import { Notifier } from "../../../managers/Notifier";
import { playEffect } from "../../../utils/lib";
import { SpeechToTextButton } from "../SpeechRecognitionButton/SpeechRecognitionButton";
// import { slugToTitle } from "../../Rigobot/utils";
// import SimpleButton from "../../mockups/SimpleButton";
// import { svgs } from "../../../assets/svgs";

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

type TMetadata = Record<string, string | boolean>;

export const Markdowner = ({ markdown }: { markdown: string }) => {
  const { openLink, mode, isCreator } = useStore((state) => ({
    openLink: state.openLink,
    mode: state.mode,
    isCreator: state.isCreator,
  }));

  return (
    <Markdown
      skipHtml={true}
      remarkPlugins={[remarkGfm, remarkMath]}
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
          if (isCreator && mode === "creator") {
            return (
              <CreatorWrapper node={node} tagName="h1">
                <h1>{children}</h1>
              </CreatorWrapper>
            );
          }
          return <h1>{children}</h1>;
        },
        h2: ({ children, node }) => {
          if (isCreator && mode === "creator") {
            return (
              <CreatorWrapper node={node} tagName="h2">
                <h2>{children}</h2>
              </CreatorWrapper>
            );
          }
          return <h2>{children}</h2>;
        },
        p: ({ children, node }) => {
          if (isCreator && mode === "creator") {
            return (
              <CreatorWrapper node={node} tagName="p">
                <p>{children}</p>
              </CreatorWrapper>
            );
          }
          return <p>{children}</p>;
        },
        // @ts-ignore
        ol: ({ children, node }) => {
          const containsTaskList = checkForQuiz(node);
          const creatorModeActivated = isCreator && mode === "creator";

          if (containsTaskList) {
            // if (creatorModeActivated) {
            //   return (
            //     <CreatorWrapper node={node} tagName="ol">
            //       <QuizRenderer children={children} />
            //     </CreatorWrapper>
            //   );
            // }
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
            return <QuizRenderer children={children} />;
          }

          if (isCreator && mode === "creator") {
            return (
              <CreatorWrapper node={node} tagName="ul">
                <ul>{children}</ul>
              </CreatorWrapper>
            );
          }

          return <ul onClick={() => console.log(node)}>{children}</ul>;
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

          if (isCreator && mode === "creator") {
            return (
              <CreatorWrapper node={props.node} tagName="pre">
                <CustomCodeBlock
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
}: // metadata,
{
  code: string;
  language: string;
  metadata: TMetadata;
  wholeMD: string;
}) => {
  const { getCurrentExercise, isIframe, token, agent } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    isIframe: state.isIframe,
    token: state.token,
    agent: state.agent,
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
    return <Question metadata={metadata} wholeMD={wholeMD} />;
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

const Question = ({
  metadata,
  wholeMD,
}: {
  metadata: TMetadata;
  wholeMD: string;
}) => {
  const { t } = useTranslation();
  const { token } = useStore((state) => ({
    token: state.token,
  }));

  const [exitCode, setExitCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const evaluateAnswer = async () => {
    if (!answerRef.current?.value) {
      toast.error(t("pleaseEnterAnAnswer"));
      return;
    }
    setIsLoading(true);
    const result = await checkAnswer(token, {
      eval: metadata.eval as string,
      lesson_content: wholeMD,
      student_response: answerRef.current.value,
    });
    console.log(result);
    setExitCode(result.exit_code);
    if (result.exit_code === 0) {
      Notifier.confetti();
      playEffect("success");
    } else {
      playEffect("error");
    }
    setIsLoading(false);
  };

  const handleTranscription = (text: string) => {
    if (answerRef.current) {
      answerRef.current.value += ` ${text}`;
    }
  };

  return (
    <div
      className={`stdin rounded ${exitCode === 0 && "bg-soft-green"} ${
        exitCode === 1 && "bg-soft-red"
      }`}
    >
      <section className="d-flex gap-small align-center">
        <textarea
          ref={answerRef}
          className="w-100 input"
          name="answer"
          placeholder={t("yourAnswerHere")}
        />
        <SpeechToTextButton onTranscription={handleTranscription} />
      </section>
      <div className="d-flex gap-small padding-small">
        <SimpleButton
          disabled={isLoading}
          text={isLoading ? t("evaluating") : t("submitForReview")}
          title={isLoading ? t("evaluating") : t("submitForReview")}
          svg={svgs.rigoSoftBlue}
          action={evaluateAnswer}
          extraClass="active-on-hover padding-small rounded"
        />
      </div>
    </div>
  );
};
