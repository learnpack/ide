"use client";
import useStore from "../../utils/store";
import { svgs } from "../../resources/svgs";
import SimpleButton from "./Button";

export default function BugButton () {
    const {currentExercisePosition, exercises, lessonTitle} = useStore();
    let defaultTitle = "Bug"

    if (currentExercisePosition != 0) {
        defaultTitle = `Bug in ${exercises[currentExercisePosition].slug}`
    }

    const body = `Lesson: ${lessonTitle} %0D%0A
    %0D%0AExplain the problem %0D%0A
    %0D%0AProvide an image or example of the problem %0D%0A

    `    
    const bugUrl = `https://github.com/learnpack/learnpack/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=${defaultTitle}&body=${body}`
    const reportBug = () => {
        window.open(bugUrl, "_blank");
    }
    return <SimpleButton svg={svgs.bugIcon} text="" action={reportBug} />
}