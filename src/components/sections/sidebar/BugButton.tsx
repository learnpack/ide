"use client";
import useStore from "../../../utils/store";
// import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
import { getLessonDisplayInfo, resolveCourseTitle } from "../../../utils/lib";

const toUiLanguage = (language: string) => (language === "es" ? "es" : "en");

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

  const uiLanguage = toUiLanguage(language);
  const tOpts = { lng: uiLanguage };

  const defaultTitle = courseTitle
    ? t("bug-report-title", { ...tOpts, courseTitle })
    : t("bug-report-title-fallback", tOpts);

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

  const introLine = lessonLabel
    ? t("bug-report-lesson-line", { ...tOpts, lesson: lessonLabel })
    : t("bug-report-course-line", { ...tOpts, course: courseTitle });

  let body = [
    introLine,
    t("bug-report-explain-problem", tOpts),
    t("bug-report-provide-example", tOpts),
  ].join("\n\n");

  const repository = configObject?.config?.repository || null;
  if (repository) {
    body += `\n\n---\n\n${t("bug-report-repository-line", { ...tOpts, repository })}`;
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
