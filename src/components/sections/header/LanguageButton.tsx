import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { svgs } from "../../../assets/svgs";
import { useEffect, useRef, useState } from "react";
import i18n from "../../../utils/i18n";
import { useTranslation } from "react-i18next";
import { Modal } from "../../mockups/Modal";
import { toast } from "react-hot-toast";
import { FetchManager } from "../../../managers/fetchManager";
import { Markdowner } from "../../composites/Markdowner/Markdowner";
// import { useConsumableCall } from "../../../utils/apiCalls";
// import { TConsumableSlug } from "../../../utils/storeTypes";

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

const shouldChangeLanguage = (language: string, languages: string[]) => {
  if (language === "us" || language === "en") {
    const anyEnglish = languages.some((l) => l === "en" || l === "us");
    return !anyEnglish;
  }
  return !languages.includes(language);
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

    if (
      language &&
      languages.length > 0 &&
      shouldChangeLanguage(language, languages)
    ) {
      const firstLanguage = languages[0];
      setLanguage(firstLanguage);
    }
  }, [language, exercises]);

  const { t } = useTranslation();

  return (
    <>
      <div id="language-component" className="language-component">
        <SimpleButton
          action={toggleDrop}
          text={language}
          svg={svgsLanguageMap[language]}
          title={t("change-language")}
        />
        {showDrop && <LanguageDropdown toggleDrop={toggleDrop} />}
      </div>
    </>
  );
}

interface ILanguageDropdown {
  toggleDrop: () => void;
}

export const fixLang = (lang: string, environment: string) => {
  if (lang === "us" && environment === "creatorWeb") return "en";
  else {
    return lang;
  }
};

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
  const {
    language,
    setLanguage,
    reportEnrichDataLayer,
    environment,
    getCurrentExercise,
    syllabus,
  } = useStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getCurrentExercise: state.getCurrentExercise,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    environment: state.environment,
    syllabus: state.syllabus,
  }));

  const currentExercise = getCurrentExercise();
  const [allowAddLanguage, setAllowAddLanguage] = useState(false);

  if (!currentExercise) return null;

  const languages = Object.keys(currentExercise.translations);

  const changeLanguage = (lang: string) => {
    if (lang === "us") lang = "en";
    i18n.changeLanguage(lang);
  };

  const setLang = (lang: string) => {
    const fixedLang = fixLang(lang, environment);
    setLanguage(fixedLang);
    changeLanguage(fixedLang);
    toggleDrop();
    reportEnrichDataLayer("learnpack_language_change", {
      language: fixedLang,
    });
  };

  useEffect(() => {
    if (
      environment === "creatorWeb" &&
      syllabus?.lessons &&
      syllabus.lessons.length > 0
    ) {
      // Check is there is any not generated lesson
      const anyNotGenerated = syllabus.lessons?.some(
        (lesson) => !lesson.generated
      );
      if (anyNotGenerated) {
        setAllowAddLanguage(false);
      } else {
        setAllowAddLanguage(true);
      }
    }
  }, [syllabus]);

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
      {environment !== "localStorage" && (
        <AddLanguageModal disabled={!allowAddLanguage} />
      )}
    </div>
  );
};

const AddLanguageModal = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const [warningData, setWarningData] = useState<{
    language: string;
    aiGenerationsLeft: number;
    hasEnough: boolean;
  } | null>(null);

  const inputLanguageRef = useRef<HTMLInputElement>(null);
  const exercises = useStore((state) => state.exercises);
  const token = useStore((state) => state.token);
  // const bcToken = useStore((state) => state.bc_token);
  const getSidebar = useStore((state) => state.getSidebar);
  const language = useStore((state) => state.language);
  const userConsumables = useStore((state) => state.userConsumables);
  const getUserConsumables = useStore((state) => state.getUserConsumables);

  const handleAddLanguage = () => {
    if (!disabled) {
      setIsOpen(true);
      getUserConsumables();
    }
  };

  const handleTranslate = async () => {
    if (!inputLanguageRef.current) return;

    const languages = inputLanguageRef.current.value;

    if (!languages) {
      toast.error(t("invalidLanguage"), {
        duration: 5000,
      });
      return;
    }

    const aiGenerationsLeft = userConsumables.ai_generation;

    setWarningData({
      language: languages,
      aiGenerationsLeft,
      hasEnough:
        aiGenerationsLeft === -1 || aiGenerationsLeft >= exercises.length,
    });
    if (aiGenerationsLeft === -1) {
      await handleWarningConfirm(languages);
      setIsOpen(false);
    } else {
      setShowWarning(true);
    }
  };

  const performTranslation = async (languages: string) => {
    setIsLoading(true);
    try {
      console.log("PERFORMING TRANSLATION");
      const res = await FetchManager.translateExercises(
        exercises.map((e) => e.slug),
        languages,
        language,
        token
      );
      console.log(res, "TRANSLATION RESPONSE");
      setIsLoading(false);
      setIsOpen(false);
      setShowWarning(false);
      await getSidebar();
    } catch (error) {
      toast.error(t("errorTranslatingExercises"));
      console.log(error, "Error");
      setIsLoading(false);
    }
  };

  // const consume = async (slug: TConsumableSlug, n: number) => {
  //   const results: boolean[] = [];
  //   const consumablePromise = Promise.all(
  //     Array.from({ length: n }, async (_) => {
  //       const result = await useConsumableCall(bcToken, slug);
  //       if (result) {
  //         results.push(result);
  //       }
  //     })
  //   );

  //   await consumablePromise;
  //   console.log(results, "RESULTS FROM CONSUMPTION");
  //   return results.some((result) => result);
  // };

  const handleWarningConfirm = async (languages?: string) => {
    if (!languages) {
      toast.error(t("invalidLanguage"), {
        duration: 5000,
      });
      return;
    }
    setIsLoading(true);
    await performTranslation(languages);
    setIsLoading(false);
    setIsOpen(false);
    setShowWarning(false);
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setWarningData(null);
  };

  return (
    <>
      <SimpleButton
        disabled={disabled}
        text={t("add-language")}
        title={
          disabled
            ? t("cannotTranslateWhileGenerating")
            : t("translateAllTheCourse")
        }
        svg={svgs.plus}
        action={handleAddLanguage}
        extraClass="w-200px"
      />
      {isOpen && (
        <Modal >
          <div className="flex-y gap-small">
            <div className="flex-x align-center gap-small rigo-message">
              <h2 className="big-svg flex-x align-center">{svgs.happyRigo}</h2>
              <p className="bg-1 rounded padding-medium">
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

      {showWarning && warningData && (
        <Modal>
          <div className="flex-y align-center justify-center gap-medium">
            <div className="flex-y align-center gap-small">
              <div className="big-svg">
                {warningData.hasEnough ? svgs.rigoSoftBlue : svgs.sadRigo}
              </div>
              <h2 className="text-center text-bold">
                {warningData.hasEnough
                  ? t("ai-generations-warning-title")
                  : t("ai-generations-insufficient")}
              </h2>
            </div>
            <div className="bg-white rounded padding-medium w-100">
              <div className="rounded padding-small">
                <Markdowner
                  markdown={
                    warningData.hasEnough
                      ? t("ai-generations-warning", {
                          language: warningData.language,
                          totalGenerations: exercises.length,
                          aiGenerationsLeft: warningData.aiGenerationsLeft,
                        })
                      : t("ai-generations-insufficient-description")
                  }
                />
              </div>
            </div>
            <div className="flex-x justify-center gap-medium">
              <SimpleButton
                extraClass="bg-gray text-black padding-small rounded"
                text={t("cancel")}
                action={handleWarningCancel}
              />
              {warningData.hasEnough && (
                <SimpleButton
                  extraClass="bg-blue-rigo text-white padding-small rounded row-reverse"
                  text={isLoading ? t("translatingExercises") : t("translate")}
                  svg={svgs.rigoSoftBlue}
                  action={() => handleWarningConfirm(warningData?.language)}
                />
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
