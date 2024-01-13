"use client";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import SimpleButton from "../../mockups/Button";

export default function BugButton() {
    const { currentExercisePosition, exercises, lessonTitle, compilerSocket } = useStore(state => ({
        currentExercisePosition: state.currentExercisePosition,
        exercises: state.exercises,
        lessonTitle: state.lessonTitle,
        compilerSocket: state.compilerSocket
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

    const reportBug = () => {
        const data = {
            url,
            exerciseSlug: exercises[currentExercisePosition].slug
        }
        console.log("hello");

        compilerSocket.openWindow(data);
    }
    return <SimpleButton svg={svgs.bugIcon} text="Report a bug" action={reportBug} />
        
}