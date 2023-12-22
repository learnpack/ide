// import { LessonOptions } from "../header/LessonOptions"
import LessonContent from "./LessonContent"
import "./styles.css"


export default function LessonContainer() {

    return (
        <div className="lesson-container-component">
            {/* <LessonOptions /> */}
            <LessonContent />
        </div>
    )
}