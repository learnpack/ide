import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import useStore from "../../../utils/store";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark as prismStyle } from "react-syntax-highlighter/dist/esm/styles/prism";
import { QuizRenderer } from "../QuizRenderer/QuizRenderer";
import { RigoQuestion } from "../RigoQuestion/RigoQuestion";
import { CreatorWrapper } from "../../Creator/Creator";
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

const extractMetadata = (metadata: string) => {
  const metadataObject: Record<string, string> = {};
  const metadataProperties = metadata.split(" ");
  if (metadataProperties.length > 0) {
    metadataProperties.forEach((property) => {
      const [key, value] = property.split("=");
      metadataObject[key] = value;
    });
  }
  return metadataObject;
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
          console.log(props, "PROPS");

          const codeBlocks = props.node?.children.map((child) => {
            // @ts-ignore
            const code = child.children.map((c) => c.value).join("");
            // @ts-ignore
            const classNames = child.properties?.className;
            // @ts-ignore F
            const metadata = child.data?.meta || "";
            let metadataObject: Record<string, string> = {};
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

          return (
            <CustomCodeBlock
              code={codeBlocks[0].code}
              language={codeBlocks[0].lang}
              // metadata={codeBlocks[0].metadata}
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
  // metadata,
}: {
  code: string;
  language: string;
  // metadata: Record<string, string>;
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

  // const metadataComponents = {
  //   runnable: (value: string) => {
  //     if (value.toLowerCase() === "true") {
  //       return (
  //         <SimpleButton
  //           svg={svgs.runCustom}
  //           action={async () => console.log("RUN")}
  //           extraClass="text-black"
  //         />
  //       );
  //     }
  //   },
  //   answer: (value: string) => {
  //     if (value.toLowerCase() === "true") {
  //       return (
  //         <SimpleButton
  //           svg={svgs.runCustom}
  //           action={() => console.log("CHECK")}
  //           extraClass="text-black"
  //         />
  //       );
  //     }
  //   },
  // };

  return (
    <div className="flex-y my-small">
      {/* <div className="d-flex justify-between align-center  code-buttons">
        <span className="language">{language}</span>
        <div>
          <SimpleButton
            svg={svgs.copy}
            action={() => console.log("COPY")}
            extraClass="color-blue"
          />
          {Object.keys(metadata).length > 0 &&
            Object.keys(metadata).map((key) => {
              if (metadataComponents[key as keyof typeof metadataComponents]) {
                return (
                  <div key={key}>
                    {metadataComponents[key as keyof typeof metadataComponents](
                      metadata[key]
                    )}
                  </div>
                );
              }
            })}
        </div>
      </div> */}
      <SyntaxHighlighter language={language} style={prismStyle}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
