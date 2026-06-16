"use client";
import useStore from "../../../utils/store";
// import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { getLessonDisplayInfo, resolveCourseTitle } from "../../../utils/lib";
export default function BugButton() {
  const { t } = useTranslation();
  const { language, openLink, getCurrentExercise, configObject, sidebar } = useStore((state) => ({
    getCurrentExercise: state.getCurrentExercise,
    language: state.language,
    openLink: state.openLink,
    configObject: state.configObject,
    sidebar: state.sidebar,
  }));

  const courseTitle =
    resolveCourseTitle(configObject?.config?.title, language) ||
    configObject?.config?.slug ||
    "";

  const defaultTitle = courseTitle ? `Bug in ${courseTitle}` : "Bug";

  const currentExercise = getCurrentExercise();
  const exerciseSlug = currentExercise?.slug || "";
  const lessonDisplay = exerciseSlug
    ? getLessonDisplayInfo(
        exerciseSlug,
        sidebar,
        language,
        currentExercise?.title || exerciseSlug
      )
    : null;
  const lessonLabel = lessonDisplay
    ? `${lessonDisplay.id} ${lessonDisplay.formattedTitle}`
    : "";

  let body = lessonLabel
    ? `**Lesson**: ${lessonLabel}\n\nExplain the problem\n\nProvide an image or example of the problem`
    : `**Course**: ${courseTitle}\n\nExplain the problem\n\nProvide an image or example of the problem`;

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
