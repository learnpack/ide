import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import { getLanguageName } from "../../../utils/lib";

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

const buildAskRigoTutorContext = (language: string) => {
  const code = language === "us" ? "en" : language;
  const label = getLanguageName(language, "en");
  return (
    "Please answer the question. This is meant to help the student learn something new or understand a concept in depth.\n\n" +
    `IMPORTANT: The student is using the LearnPack UI in ${label} (language code: ${code}). ` +
    `You MUST reply only in ${label} for your entire answer, even if the student's question is phrased in a different language.`
  );
};

export const RigoQuestion = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  const { toggleRigo, setRigoContext, reportEnrichDataLayer, language } =
    useStore((state) => ({
      toggleRigo: state.toggleRigo,
      setRigoContext: state.setRigoContext,
      reportEnrichDataLayer: state.reportEnrichDataLayer,
      language: state.language,
    }));

  return (
    <div
      onClick={() => {
        const userMessage =
          extractQueryFromUrlAndformatAsMessage(href) || (children as string);
        toggleRigo({ ensure: "open" });
        setRigoContext({
          context: buildAskRigoTutorContext(language),
          userMessage,
        });
        reportEnrichDataLayer("open_rigo_question", {
          userMessage,
        });
      }}
      className="d-inline-flex align-items-center gap-small padding-small rounded bg-blue-opaque fit-content active-on-hover"
    >
      <span>{svgs.rigoSvg}</span>
      <span>{children}</span>
    </div>
  );
};
