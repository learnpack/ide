import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useEffect, useRef, useState } from "react";
import i18n from "../../../utils/i18n";
import { useTranslation } from "react-i18next";
import { Modal } from "../../mockups/Modal";
import { toast } from "react-hot-toast";
import { FetchManager } from "../../../managers/fetchManager";

const svgsLanguageMap: Record<string, JSX.Element> = {
  es: svgs.spainFlag,
  en: svgs.usaFlag,
  us: svgs.usaFlag,
  fr: <img src="https://flagcdn.com/w40/fr.png" alt="French" />,
  de: <img src="https://flagcdn.com/w40/de.png" alt="German" />,
  it: <img src="https://flagcdn.com/w40/it.png" alt="Italian" />,
  pt: <img src="https://flagcdn.com/w40/pt.png" alt="Portuguese" />,
  ja: <img src="https://flagcdn.com/w40/jp.png" alt="Japanese" />,
  zh: <img src="https://flagcdn.com/w40/cn.png" alt="Chinese" />,
  ko: <img src="https://flagcdn.com/w40/kr.png" alt="Korean" />,
  ru: <img src="https://flagcdn.com/w40/ru.png" alt="Russian" />,
  ar: <img src="https://flagcdn.com/w40/sa.png" alt="Arabic" />,
  nl: <img src="https://flagcdn.com/w40/nl.png" alt="Dutch" />,
  sv: <img src="https://flagcdn.com/w40/se.png" alt="Swedish" />,
  no: <img src="https://flagcdn.com/w40/no.png" alt="Norwegian" />,
  da: <img src="https://flagcdn.com/w40/dk.png" alt="Danish" />,
  fi: <img src="https://flagcdn.com/w40/fi.png" alt="Finnish" />,
  pl: <img src="https://flagcdn.com/w40/pl.png" alt="Polish" />,
  tr: <img src="https://flagcdn.com/w40/tr.png" alt="Turkish" />,
  hi: <img src="https://flagcdn.com/w40/in.png" alt="Hindi" />,
  th: <img src="https://flagcdn.com/w40/th.png" alt="Thai" />,
};

export default function LanguageButton() {
  const { language, getCurrentExercise, setLanguage, exercises } = useStore(
    (state) => ({
      language: state.language,
      getCurrentExercise: state.getCurrentExercise,
      setLanguage: state.setLanguage,
      exercises: state.exercises,
    })
  );

  const [showDrop, setShowDropdown] = useState(false);

  const toggleDrop = () => {
    setShowDropdown(!showDrop);
  };

  useEffect(() => {
    const ex = getCurrentExercise();

    if (!ex || !ex.translations) return;

    const languages = Object.keys(ex.translations);

    if (language && languages.length > 0 && !languages.includes(language)) {
      const firstLanguage = languages[0];
      setLanguage(firstLanguage);
    }
  }, [language, exercises]);

  return (
    <>
      <div id="language-component" className="language-component">
        <SimpleButton
          action={toggleDrop}
          text={language}
          svg={svgsLanguageMap[language]}
        />
        {showDrop && <LanguageDropdown toggleDrop={toggleDrop} />}
      </div>
    </>
  );
}

interface ILanguageDropdown {
  toggleDrop: () => void;
}

export const fixLang = (lang: string) => {
  if (lang === "us") return "en";
  return lang;
};

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
  const {
    language,
    setLanguage,
    reportEnrichDataLayer,
    environment,
    getCurrentExercise,
  } = useStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getCurrentExercise: state.getCurrentExercise,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    environment: state.environment,
  }));

  const currentExercise = getCurrentExercise();

  if (!currentExercise) return null;

  const languages = Object.keys(currentExercise.translations);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const setLang = (lang: string) => {
    const fixedLang = fixLang(lang);
    setLanguage(fixedLang);
    changeLanguage(fixedLang);
    toggleDrop();
    reportEnrichDataLayer("learnpack_language_change", {
      language: fixedLang,
    });
  };

  return (
    <div className="language-dropdown">
      {languages.map((l, index) =>
        l !== language ? (
          <button key={index} onClick={() => setLang(l)}>
            {svgsLanguageMap[l]}
            {l}
          </button>
        ) : null
      )}
      {environment !== "localStorage" && <AddLanguageModal />}
    </div>
  );
};

const AddLanguageModal = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputLanguageRef = useRef<HTMLInputElement>(null);
  const exercises = useStore((state) => state.exercises);
  const token = useStore((state) => state.token);
  const fetchExercises = useStore((state) => state.fetchExercises);
  const getSidebar = useStore((state) => state.getSidebar);
  const language = useStore((state) => state.language);

  const handleAddLanguage = () => {
    setIsOpen(true);
  };

  const handleTranslate = async () => {
    const toastId = toast.loading(t("translatingExercises"));
    setIsLoading(true);
    try {
      if (!inputLanguageRef.current) return;
      const languages = inputLanguageRef.current.value;

      if (!languages) {
        toast.error(t("invalidLanguage"), {
          duration: 5000,
          id: toastId,
        });
        return;
      }

      await FetchManager.translateExercises(
        exercises.map((e) => e.slug),
        languages,
        language,
        token
      );
      toast.success(t("exercisesTranslated"), { id: toastId });
      setIsLoading(false);
      setIsOpen(false);
      await fetchExercises();
      await getSidebar();
    } catch (error) {
      toast.error(t("errorTranslatingExercises"), { id: toastId });
      console.log(error, "Error");
      setIsLoading(false);
    }
  };

  return (
    <>
      <SimpleButton
        text={t("add-language")}
        svg={svgs.plus}
        action={handleAddLanguage}
        extraClass="w-200px"
      />
      {isOpen && (
        <Modal extraClass="bg-2">
          <div className="flex-y gap-small">
            <div className="flex-x align-center gap-small ">
              <h2 className="big-svg flex-x align-center">{svgs.happyRigo}</h2>
              <p className="bg-white rounded padding-medium">
                {t("rigo-translate-message")}
              </p>
            </div>

            <input
              ref={inputLanguageRef}
              className="input w-100"
              type="text"
              placeholder={t("language-placeholder")}
            />

            <div className="flex-x justify-center gap-medium">
              <SimpleButton
                extraClass="bg-gray text-black padding-small rounded"
                text={t("cancel")}
                action={() => setIsOpen(false)}
              />
              <SimpleButton
                extraClass="bg-blue-rigo text-white padding-small rounded  row-reverse"
                disabled={isLoading}
                text={isLoading ? t("translatingExercises") : t("translate")}
                svg={svgs.rigoSoftBlue}
                action={handleTranslate}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
