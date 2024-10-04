import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import LanguageButton from "./LanguageButton";

export const LessonOptions = () => {
  const { currentExercisePosition, handlePositionChange, exercises } = useStore(
    (state) => ({
      currentExercisePosition: state.currentExercisePosition,
      handlePositionChange: state.handlePositionChange,
      exercises: state.exercises,
    })
  );

  return (
    <>
      <div className="lesson-options">
        <div>
          <button
            disabled={currentExercisePosition === 0}
            onClick={() =>
              handlePositionChange(Number(currentExercisePosition) - 1)
            }
          >
            {svgs.prevArrowButton}
          </button>
          <button
            disabled={currentExercisePosition === exercises.length - 1}
            onClick={() =>
              handlePositionChange(Number(currentExercisePosition) + 1)
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
  );
};
