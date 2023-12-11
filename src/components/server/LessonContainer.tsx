import { svgs } from "../../resources/svgs"
import { Toaster, toast } from "react-hot-toast"
import LessonContent from "../client/LessonContent"
import useStore from "../../utils/store"
import { StatusBar } from "../client/StaturBar"
import LanguageButton from "../client/LanguageButton"

function LessonOptions() {
    const { currentExercisePosition, setPosition, fetchReadme, exercises, setBuildButtonText, setFeedbackButtonProps, configObject, allowedActions, fetchSingleExercise } = useStore();

    const handlePositionChange = (action: string) => {
        if (action === "next" && currentExercisePosition != exercises.length - 1) {
            if (configObject.config.grading == "isolated" || (configObject.config.grading == "incremental" && exercises[currentExercisePosition].done) || (!allowedActions.includes("test"))) {
                // setShowVideoTutorial(true);
                const nextPosition = currentExercisePosition +1
                setPosition(nextPosition);
                
                // const files = exercises[nextPosition].files.filter((f: any) => f.hidden === false);
                
                // const data = {
                //     exerciseSlug: exercises[nextPosition].slug,
                //     files: files.map((f: any) => f.path)
                // }
                // // console.log(data);
                // compilerSocket.emit("open", data);

                // Call app to open exercise
                fetchSingleExercise(nextPosition);
                console.log("NEXT POSITION TO OPEN: ", nextPosition);
                
            }

            else {
                toast.error("You are in incremental mode! Pass the tests for this exercise to continue with the next one!")
            }
        }
        else if (action === "prev" && currentExercisePosition != 0) {
            setPosition(currentExercisePosition - 1);
            fetchSingleExercise(currentExercisePosition - 1)
        }
        setBuildButtonText("Run", "");
        setFeedbackButtonProps("Feedback", "");
        fetchReadme();
    }
    return <>
        <div className="lesson-options">
            <div>
                <button onClick={() => handlePositionChange("prev")}>{svgs.prevArrowButton}</button>
                <button onClick={() => handlePositionChange("next")}>{svgs.nextArrowButton}</button>
                <StatusBar />
            </div>
            <div>
                <LanguageButton />
            </div>
        </div>
    </>
}



export default function LessonContainer() {

    return (
        <div className="lesson-container-component">
            <Toaster />
            <LessonOptions />
            <LessonContent />
        </div>
    )
}