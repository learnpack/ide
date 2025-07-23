import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";

const extractQueryFromUrlAndformatAsMessage = (url: string) => {
  const urlObj = new URL(url);
  const query = urlObj.searchParams.get("query");
  const words = query?.split("-");

  if (words && words.length > 0) {
    words[0] =
      words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    return words?.join(" ");
  }
  return query;
};

export const RigoQuestion = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  const { toggleRigo, setRigoContext, reportEnrichDataLayer } = useStore(
    (state) => ({
      toggleRigo: state.toggleRigo,
      setRigoContext: state.setRigoContext,
      reportEnrichDataLayer: state.reportEnrichDataLayer,
    })
  );

  return (
    <div
      onClick={() => {
        toggleRigo({ ensure: "open" });
        setRigoContext({
          context:
            "Please answer the question. This is mean to help the student to learn something new or understand a concept in deep.",
          userMessage:
            extractQueryFromUrlAndformatAsMessage(href) || (children as string),
        });
        reportEnrichDataLayer("open_rigo_question", {
          userMessage: extractQueryFromUrlAndformatAsMessage(href),
        });
      }}
      className="d-inline-flex align-items-center gap-small padding-small rounded bg-blue-opaque fit-content active-on-hover"
    >
      <span>{svgs.rigoSvg}</span>
      <span>{children}</span>
    </div>
  );
};
