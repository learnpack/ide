import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useRef, useState } from "react";
import i18n from "../../../utils/i18n";
import { useTranslation } from "react-i18next";
import { Modal } from "../../mockups/Modal";
import { toast } from "react-hot-toast";
import { FetchManager } from "../../../managers/fetchManager";

const svgsLanguageMap: any = {
  es: svgs.spainFlag,
  us: svgs.usaFlag,
};

export default function LanguageButton() {
  const { language } = useStore((state) => ({
    language: state.language,
  }));

  const [showDrop, setShowDropdown] = useState(false);

  const toggleDrop = () => {
    setShowDropdown(!showDrop);
  };

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

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
  const {
    language,
    setLanguage,
    getCurrentExercise,
    reportEnrichDataLayer,
    environment,
  } = useStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getCurrentExercise: state.getCurrentExercise,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    environment: state.environment,
  }));

  const languages = Object.keys(getCurrentExercise().translations);

  const changeLanguage = (lang: string) => {
    if (lang === "us") {
      i18n.changeLanguage("en");
    } else {
      i18n.changeLanguage(lang);
    }
  };

  const setLang = (lang: string) => {
    setLanguage(lang);
    changeLanguage(lang);
    toggleDrop();
    reportEnrichDataLayer("learnpack_language_change", {
      language: lang,
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
        token
      );
      toast.success(t("exercisesTranslated"), { id: toastId });
      await fetchExercises();
      await getSidebar();
      setIsLoading(false);
      setIsOpen(false);
    } catch (error) {
      toast.error(t("errorTranslatingExercises"), { id: toastId });
      console.log(error, "Error");
      setIsLoading(false);
    }
  };

  return (
    <>
      <SimpleButton
        text={t("other")}
        svg={svgs.plus}
        action={handleAddLanguage}
        extraClass=""
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
