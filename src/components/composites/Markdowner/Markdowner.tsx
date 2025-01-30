import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useStore from "../../../utils/store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark as prismStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { QuizRenderer } from "../QuizRenderer/QuizRenderer";

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

export const Markdowner = ({ markdown }: { markdown: string }) => {
  const { openLink } = useStore((state) => ({
    openLink: state.openLink,
  }));

  return (
    <Markdown
      components={{
        a: ({ href, children }) => {
          if (href) {
            return (
              <a onClick={() => openLink(href)} target="_blank" href={href}>
                {children}
              </a>
            );
          }
          return <span>{children}</span>;
        },
        // @ts-ignore
        ol: ({ children, node }) => {
          const containsTaskList = checkForQuiz(node);

          if (containsTaskList) {
            return <QuizRenderer children={children} />;
          }

          const start = node?.properties?.start;

          return <ol start={start ? Number(start) : undefined}>{children}</ol>;
        },
        // @ts-ignore
        ul: ({ children, node }) => {
          const containsTaskList = checkForQuiz(node);

          if (containsTaskList) {
            return <QuizRenderer children={children} />;
          }

          return <ul onClick={() => console.log(node)}>{children}</ul>;
        },
        pre(props) {
          const codeBlocks = props.node?.children.map((child) => {
            // @ts-ignore
            const code = child.children.map((c) => c.value).join("");
            // @ts-ignore
            const classNames = child.properties?.className;
            let lang = "text";
            if (classNames && classNames?.length > 0) {
              lang = classNames[0].split("-")[1];
            }
            return {
              lang,
              code,
            };
          });
          if (!codeBlocks || codeBlocks.length === 0) {
            return <pre>{props.children}</pre>;
          }

          return (
            <CustomCodeBlock
              code={codeBlocks[0].code}
              language={codeBlocks[0].lang}
            />
          );
        },
      }}
      remarkPlugins={[remarkGfm]}
    >
      {markdown}
    </Markdown>
  );
};

const CustomCodeBlock = ({
  code,
  language,
}: {
  code: string;
  language: string;
}) => {
  const { getCurrentExercise } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
  }));

  if (language === "stdout" || language === "stderr") {
    return (
      <div
        // style={{ backgroundColor: "black", color: "red" }}
        className={`${language}`}
      >
        {language === "stdout" && (
          <p className="stdout-prefix">
            ~/learnpack/{getCurrentExercise().slug}
          </p>
        )}
        {code}
      </div>
    );
  }

  return (
    <SyntaxHighlighter language={language} style={prismStyle}>
      {code}
    </SyntaxHighlighter>
  );
};
