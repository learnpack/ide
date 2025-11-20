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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TTranslationStatus, TLanguageTranslation } from "../../../utils/storeTypes";
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

const getLanguageName = (langCode: string, currentLanguage: string = 'en'): string => {
  try {
    const displayNames = new Intl.DisplayNames([currentLanguage], { type: 'language' });
    // Normalizar códigos especiales
    const normalizedCode = langCode === 'us' ? 'en' : langCode;
    return displayNames.of(normalizedCode) || langCode;
  } catch {
    return langCode;
  }
};

export default function LanguageButton() {
  const { language, getCurrentExercise, setLanguage, exercises, environment } = useStore(
    (state) => ({
      language: state.language,
      getCurrentExercise: state.getCurrentExercise,
      setLanguage: state.setLanguage,
      exercises: state.exercises,
      environment: state.environment,
    })
  );

  const [showDrop, setShowDropdown] = useState(false);

  const toggleDrop = () => {
    const ex = getCurrentExercise();
    if (ex && ex.translations) {
      const languages = Object.keys(ex.translations);
      const canAddLanguage = environment !== "localStorage";
      
      // Solo abrir dropdown si hay contenido que mostrar
      if (languages.length > 1 || canAddLanguage) {
        setShowDropdown(!showDrop);
      }
    }
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
  }, [language, exercises, getCurrentExercise, setLanguage]);

  const { t } = useTranslation();

  // Verificar si hay contenido para mostrar en el dropdown
  const ex = getCurrentExercise();
  const hasDropdownContent = ex && ex.translations 
    ? Object.keys(ex.translations).length > 1 || environment !== "localStorage"
    : false;

  return (
    <>
      <div id="language-component" className="language-component">
        {hasDropdownContent ? (
          <SimpleButton
            action={toggleDrop}
            text={language}
            svg={svgsLanguageMap[language]}
            title={t("change-language")}
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="language-indicator simple-button-svg">
                <span className="d-flex align-center">{svgsLanguageMap[language]}</span>
                <span className="d-flex align-center">{language}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]">
              <p className="whitespace-normal break-words">
                {getLanguageName(language, i18n.language)}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
        {showDrop && hasDropdownContent && <LanguageDropdown toggleDrop={toggleDrop} />}
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
    pendingTranslations,
  } = useStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getCurrentExercise: state.getCurrentExercise,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    environment: state.environment,
    syllabus: state.syllabus,
    pendingTranslations: state.pendingTranslations,
  }));

  const currentExercise = getCurrentExercise();
  const [allowAddLanguage, setAllowAddLanguage] = useState(false);
  const { t } = useTranslation();

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
  }, [syllabus, environment]);

  if (!currentExercise) return null;

  const languages = Object.keys(currentExercise.translations);

  // Combine existing languages with pending translations
  const allLanguages = [
    ...languages,
    ...pendingTranslations.map(t => t.code).filter(code => !languages.includes(code))
  ];

  // Get translation status for a language
  const getLanguageStatus = (lang: string): TTranslationStatus | null => {
    const pending = pendingTranslations.find(t => t.code === lang);
    return pending ? pending.status : null;
  };

  const changeLanguage = (lang: string) => {
    if (lang === "us") lang = "en";
    i18n.changeLanguage(lang);
  };

  const setLang = (lang: string) => {
    const status = getLanguageStatus(lang);
    
    // Don't allow changing if translation is in progress
    if (status === "pending" || status === "translating") {
      return;
    }
    
    const fixedLang = fixLang(lang, environment);
    setLanguage(fixedLang);
    changeLanguage(fixedLang);
    toggleDrop();
    reportEnrichDataLayer("learnpack_language_change", {
      language: fixedLang,
    });
  };

  const getStatusIcon = (status: TTranslationStatus | null) => {
    if (!status) return null;
    switch (status) {
      case "pending":
        return "⏳";
      case "translating":
        return "🔄";
      case "completed":
        return "✅";
      case "error":
        return "❌";
      default:
        return null;
    }
  };

  const getStatusTooltip = (status: TTranslationStatus | null, lang: string) => {
    if (!status) return getLanguageName(lang, i18n.language);
    switch (status) {
      case "pending":
        return t("translationPending");
      case "translating":
        return t("translationInProgress");
      case "completed":
        return t("translationCompleted", { language: lang });
      case "error":
        return t("translationError", { language: lang });
      default:
        return getLanguageName(lang, i18n.language);
    }
  };

  return (
    <div className="language-dropdown">
      {allLanguages.map((l, index) => {
        if (l === language) return null;
        
        const status = getLanguageStatus(l);
        const isDisabled = status === "pending" || status === "translating";
        
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLang(l)}
                disabled={isDisabled}
                className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
              >
                {svgsLanguageMap[l]}
                <span>{l}</span>
                {status && (
                  <span style={{ marginLeft: "auto" }}>{getStatusIcon(status)}</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getStatusTooltip(status, l)}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
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
      const toastId = toast.loading(t("translatingExercises"));
      
      try {
        console.log("PERFORMING TRANSLATION");
        // Make the HTTP request FIRST to get the correct language codes
        const res = await FetchManager.translateExercises(
          exercises.map((e) => e.slug),
          languages,
          language,
          token
        );
        console.log(res, "TRANSLATION RESPONSE");
        
        // NOW initialize pending translations with the CORRECT language codes from backend
        if (res && res.languageCodes && res.languageCodes.length > 0) {
          const { setPendingTranslations } = useStore.getState();
          
          const newTranslations: TLanguageTranslation[] = res.languageCodes.map((code: string) => ({
            code, // Use the code from backend (e.g., "de"), not the input (e.g., "alemán")
            status: "translating" as TTranslationStatus,
            startedAt: Date.now(),
            totalExercises: exercises.length,
            completedExercises: 0,
          }));
          
          setPendingTranslations(newTranslations);
          toast.success(t("translationStarted"), { id: toastId });
        } else {
          toast.success(t("translationRequestSent"), { id: toastId });
        }
        
        setIsLoading(false);
        setIsOpen(false);
        setShowWarning(false);
        await getSidebar();
      } catch (error) {
        toast.error(t("errorTranslatingExercises"), { id: toastId });
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
            <div>
              <h1 className="d-flex align-center gap-small justify-center big-svg text-bold">
                {warningData.hasEnough ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ transform: 'scale(0.9)' }}>
                      {svgs.rigoSoftBlue}
                    </div>
                  </div>
                ) : (
                  svgs.sadRigo
                )}
                <span>
                  {warningData.hasEnough
                    ? t("ai-generations-warning-title")
                    : t("ai-generations-insufficient")}
                </span>
              </h1>
            </div>
            <div className="rounded padding-medium w-100">
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
