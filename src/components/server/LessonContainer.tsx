import { svgs} from "../../resources/svgs"
import { Toaster } from "react-hot-toast"
import LessonContent from "../client/LessonContent"
import useStore from "../../utils/store"
import { StatusBar } from "../client/StaturBar"
import LanguageButton from "../client/LanguageButton"

function LessonOptions () {
    const {currentExercisePosition, setPosition, fetchReadme, exercises, setBuildButtonText, setFeedbackButtonProps, compilerSocket} = useStore();

    const handlePositionChange = (action:string) => {
        if (action === "next" && currentExercisePosition != exercises.length - 1) {
            setPosition(currentExercisePosition + 1);
            const files = exercises[currentExercisePosition].files.filter((f:any) => f.hidden === false);
            // console.log(files);
            
            const data = {
                exerciseSlug: exercises[currentExercisePosition].slug,
                files: files.map((f:any) => f.path)
            }
            // console.log(data);
            
            compilerSocket.emit("open", data);
        }
        else if (action === "prev" && currentExercisePosition != 0) {
            setPosition(currentExercisePosition - 1);
        }
        setBuildButtonText("Run", "");
        setFeedbackButtonProps("Feedback", "");
        fetchReadme();
    }
    return <>
    <div className="lesson-options">
        <div>
            <button onClick={()=>handlePositionChange("prev")}>{svgs.prevArrowButton}</button>
            <button onClick={()=>handlePositionChange("next")}>{svgs.nextArrowButton}</button>
            <StatusBar />
        </div>
        <div>
            <LanguageButton />
        </div>
    </div>
    </>
}



export default function LessonContainer () {
  
    return (
    <div className="lesson-container-component">
        <Toaster/>
        <LessonOptions />
        <LessonContent />
    </div>
    )
}