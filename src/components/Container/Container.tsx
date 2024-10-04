import styles from "./Container.module.css";
import CodeEditor from "../composites/Editor/Editor";
import LessonContainer from "../sections/lesson/LessonContainer";
import { useTranslation } from "react-i18next"

export const Container = () => {
    const {t} = useTranslation()
  return (
    <main className={styles.container}>
      <section>
        <h3>{t("instructions")}</h3>
        <LessonContainer />
      </section>
      <section>
        <CodeEditor />
      </section>
    </main>
  );
};
