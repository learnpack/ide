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
      }}
      remarkPlugins={[remarkGfm]}
    >
      {markdown}
    </Markdown>
  );
};
