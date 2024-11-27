"use client";
import useStore from "../../../utils/store";
// import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import SimpleButton from "../../mockups/SimpleButton";
import { svgs } from "../../../assets/svgs";
export default function BugButton() {
  const { t } = useTranslation();
  const { currentExercisePosition, exercises, lessonTitle, openLink } =
    useStore((state) => ({
      currentExercisePosition: state.currentExercisePosition,
      exercises: state.exercises,
      lessonTitle: state.lessonTitle,
      openLink: state.openLink,
    }));
  let defaultTitle = "Bug";

  if (currentExercisePosition != 0) {
    defaultTitle = `Bug in ${exercises[Number(currentExercisePosition)].slug}`;
  }

  const body = `Lesson: ${lessonTitle} %0D%0A
    %0D%0AExplain the problem %0D%0A
    %0D%0AProvide an image or example of the problem %0D%0A

    `;
  const url = `https://github.com/learnpack/learnpack/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=${defaultTitle}&body=${body}`;

  const handleRedirect = (e: any) => {
    e.preventDefault();
    openLink(url);
  };

  return (
    <SimpleButton title={t("report")} action={handleRedirect} svg={svgs.bug} />
  );
}
