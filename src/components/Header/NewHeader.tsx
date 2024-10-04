import { svgs } from "../../assets/svgs";
import useStore from "../../utils/store";
import LanguageButton from "../sections/header/LanguageButton";
import Sidebar from "../sections/sidebar/Sidebar";
import styles from "./NewHeader.module.css";

export const NewHeader = () => {
  const { handlePositionChange, currentExercisePosition } = useStore(
    (state) => ({
      handlePositionChange: state.handlePositionChange,
      currentExercisePosition: state.currentExercisePosition,
    })
  );
  return (
    <header className={styles.header}>
      <section>
        <button
          disabled={currentExercisePosition === 0}
          onClick={() =>
            handlePositionChange(Number(currentExercisePosition) - 1)
          }
        >
          {svgs.prevArrowButton}
        </button>
        <LanguageButton />
      </section>
      <section>{svgs.learnpackLogo}</section>
      <section>
        <Sidebar />
      </section>
    </header>
  );
};
