import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useStore from "../../../utils/store";


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
            // toast.success("No code blocks found");
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
  if (language === "stdout") {
    return (
      <div
        // style={{ backgroundColor: "black", color: "red" }}
        className={`stdout`}
      >
        <p className="stdout-prefix">~/learnpack</p>
        {code}
      </div>
    );
  }
  if (language === "stderr") {
    return (
      <div
        // style={{ backgroundColor: "black", color: "red" }}
        className={`stderr`}
      >
        {code}
      </div>
    );
  }

  return <pre className={`language-${language}`}>{code}</pre>;
};
