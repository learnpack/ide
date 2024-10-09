import styles from "./Container.module.css";
import CodeEditor from "../composites/Editor/Editor";
import LessonContainer from "../sections/lesson/LessonContainer";
import { useTranslation } from "react-i18next";
import useStore from "../../utils/store";

export const Container = () => {
  const { editorTabs } = useStore((s) => ({
    editorTabs: s.editorTabs,
  }));

  const { t } = useTranslation();
  return (
    <main className={styles.container}>
      <section>
        <h3>{t("instructions")}</h3>
        <LessonContainer />
      </section>
      {editorTabs.length > 0 && (
        <section>
          <CodeEditor />
        </section>
      )}
    </main>
  );
};
