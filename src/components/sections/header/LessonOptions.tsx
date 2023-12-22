import { svgs } from "../../../assets/svgs"
import useStore from "../../../utils/store"
import LanguageButton from "../lesson/LanguageButton"


export const LessonOptions = () => {
    const { currentExercisePosition, handlePositionChange, exercises } = useStore();

    return <>
        <div className="lesson-options">
            <div>
                <button
                    disabled={
                        currentExercisePosition === 0
                    }
                    onClick={
                        () => handlePositionChange(currentExercisePosition - 1)
                    }
                >
                    {svgs.prevArrowButton}
                </button>
                <button
                    disabled={
                        currentExercisePosition === exercises.length - 1
                    }
                    onClick={
                        () => handlePositionChange(currentExercisePosition + 1)
                    }
                >
                    {svgs.nextArrowButton}
                </button>
            </div>
            <div>
                <LanguageButton />
            </div>
        </div>
    </>
}
