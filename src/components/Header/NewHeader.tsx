import { svgs } from "../../assets/svgs";
import useStore from "../../utils/store";
import LanguageButton from "../sections/header/LanguageButton";
import Sidebar from "../sections/sidebar/Sidebar";
import styles from "./NewHeader.module.css";

export const NewHeader = () => {
  const { handlePositionChange, currentExercisePosition, exercises} = useStore(
    (state) => ({
      handlePositionChange: state.handlePositionChange,
      currentExercisePosition: state.currentExercisePosition,
      exercises: state.exercises,
      test: state.test
    })
  );

  return (
    <header className={styles.header}>
      <section>
        <button
          className="svg-button"
          disabled={currentExercisePosition == 0}
          onClick={() =>
            handlePositionChange(Number(currentExercisePosition) - 1)
          }
        >
          {svgs.prevArrowButton}
        </button>
        <button
          className="svg-button"
          disabled={currentExercisePosition === exercises.length - 1}
          onClick={() =>
            handlePositionChange(Number(currentExercisePosition) + 1)
          }
        >
          {svgs.nextArrowButton}
        </button>
        {/* <button onClick={test}>
          TEST
        </button> */}
      </section>
      <section>{svgs.learnpackLogo}</section>
      <section>
        <LanguageButton />
        <Sidebar />
      </section>
    </header>
  );
};
