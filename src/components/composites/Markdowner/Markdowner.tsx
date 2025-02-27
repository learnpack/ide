import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import useStore from "../../../utils/store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark as prismStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { QuizRenderer } from "../QuizRenderer/QuizRenderer";
import { RigoQuestion } from "../RigoQuestion/RigoQuestion";
import { CreatorWrapper } from "../../Creator/Creator";

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

export const Markdowner = ({ markdown }: { markdown: string }) => {
  const { openLink, userConsumables, environment } = useStore((state) => ({
    openLink: state.openLink,
    userConsumables: state.userConsumables,
    environment: state.environment,
  }));

  const isCreator =
    userConsumables.ai_generation > 0 && environment !== "localStorage";

  return (
    <Markdown
      skipHtml={true}
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
        p: ({ children, node }) => {
          if (isCreator) {
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

          if (containsTaskList) {
            return <QuizRenderer children={children} />;
          }

          const start = node?.properties?.start;

          // if (isCreator) {
          //   return (
          //     <CreatorWrapper node={node} tagName="ol">
          //       <ol start={start ? Number(start) : undefined}>{children}</ol>
          //     </CreatorWrapper>
          //   );
          // }
          return <ol start={start ? Number(start) : undefined}>{children}</ol>;
        },
        // @ts-ignore
        ul: ({ children, node }) => {
          const containsTaskList = checkForQuiz(node);

          if (containsTaskList) {
            return <QuizRenderer children={children} />;
          }

          // if (isCreator) {
          //   return (
          //     <CreatorWrapper node={node} tagName="ul">
          //       <ul>{children}</ul>
          //     </CreatorWrapper>
          //   );
          // }
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
