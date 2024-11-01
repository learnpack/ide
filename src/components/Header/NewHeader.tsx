import { svgs } from "../../assets/svgs";
import { DEV_MODE } from "../../utils/lib";
import useStore from "../../utils/store";
import LanguageButton from "../sections/header/LanguageButton";
import Sidebar from "../sections/sidebar/Sidebar";
import styles from "./NewHeader.module.css";

export const NewHeader = () => {
  const {
    handlePositionChange,
    currentExercisePosition,
    exercises,
    test,
    isIframe,
    language,
  } = useStore((state) => ({
    handlePositionChange: state.handlePositionChange,
    currentExercisePosition: state.currentExercisePosition,
    exercises: state.exercises,
    test: state.test,
    isIframe: state.isIframe,
    language: state.language,
  }));

  return (
    <header className={styles.header}>
      <section>
        <button
          disabled={currentExercisePosition == 0}
          onClick={() =>
            handlePositionChange(Number(currentExercisePosition) - 1)
          }
        >
          {svgs.prevArrowButton}
        </button>
        <button
          disabled={
            exercises && currentExercisePosition === exercises.length - 1
          }
          onClick={() =>
            handlePositionChange(Number(currentExercisePosition) + 1)
          }
        >
          {svgs.nextArrowButton}
        </button>
        {DEV_MODE && <button onClick={test}>TEST</button>}
      </section>
      <section>{svgs.learnpackLogo}</section>
      <section>
        {!isIframe && language && <LanguageButton />}
        <Sidebar />
      </section>
    </header>
  );
};
