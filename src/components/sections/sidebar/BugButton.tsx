"use client";
import useStore from "../../../utils/store";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
export default function BugButton() {
    const { t } = useTranslation();
    const { currentExercisePosition, exercises, lessonTitle } = useStore(state => ({
        currentExercisePosition: state.currentExercisePosition,
        exercises: state.exercises,
        lessonTitle: state.lessonTitle,
        // compilerSocket: state.compilerSocket
    }));
    let defaultTitle = "Bug"

    if (currentExercisePosition != 0) {
        defaultTitle = `Bug in ${exercises[currentExercisePosition].slug}`
    }

    const body = `Lesson: ${lessonTitle} %0D%0A
    %0D%0AExplain the problem %0D%0A
    %0D%0AProvide an image or example of the problem %0D%0A

    `
    const url = `https://github.com/learnpack/learnpack/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=${defaultTitle}&body=${body}`
    return <OpenWindowLink href={url} text={t("Report a bug 🪰")} />
}