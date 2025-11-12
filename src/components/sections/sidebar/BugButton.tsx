"use client";
import useStore from "../../../utils/store";
// import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
export default function BugButton() {
  const { t } = useTranslation();
  const { lessonTitle, openLink, getCurrentExercise, configObject } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    lessonTitle: state.lessonTitle,
    openLink: state.openLink,
    configObject: state.configObject,
  }));

  const defaultTitle = lessonTitle ? `Bug in ${lessonTitle}` : "Bug";

  const currentExercise = getCurrentExercise();
  const exerciseSlug = currentExercise?.slug || "";

  let body = exerciseSlug 
    ? `**Lesson**: ${exerciseSlug}\n\nExplain the problem\n\nProvide an image or example of the problem`
    : `**Course**: ${lessonTitle}\n\nExplain the problem\n\nProvide an image or example of the problem`;

  const repository = configObject?.config?.repository || null;
  if (repository) {
    body += `\n\n---\n\n**Repository:** ${repository}`;
  }
  
  const url = `https://github.com/learnpack/learnpack/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=${encodeURIComponent(defaultTitle)}&body=${encodeURIComponent(body)}`;

  const handleRedirect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    openLink(url);
  };

  return (
    <SimpleButton title={t("report")} action={handleRedirect} svg={svgs.bug} />
  );
}
