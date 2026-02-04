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
import { getLanguageName } from "../../../utils/lib";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TTranslationStatus, TLanguageTranslation, TExercise, Lesson, Syllabus } from "../../../utils/storeTypes";
import { Loader } from "../../composites/Loader/Loader";
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

/** Returns exercise slugs that don't have a translation file for the given language (en = README.md, others = README.lang.md). */
function getMissingSlugsForLang(exercises: TExercise[], lang: string): string[] {
  return exercises.filter(
    (ex) => !(ex.translations && ex.translations[lang])
  ).map((ex) => ex.slug);
}

/** Returns true if the language has missing lessons AND the most recent startedAt is > 20 min ago. */
function shouldShowRetryForLanguage(
  syllabus: Syllabus,
  exercises: TExercise[],
  lang: string
): boolean {
  const missingCount = getMissingSlugsForLang(exercises, lang).length;
  if (missingCount === 0) return false;

  let maxStartedAt = 0;
  syllabus?.lessons?.forEach((lesson) => {
    const lessonWithTranslations = lesson as Lesson & { translations?: Record<string, { startedAt?: number; completedAt?: number }> };
    const t = lessonWithTranslations.translations?.[lang];
    if (t?.startedAt) {
      maxStartedAt = Math.max(maxStartedAt, t.startedAt);
    }
  });
  if (maxStartedAt === 0) return false;
  return Date.now() - maxStartedAt > 20 * 60 * 1000;
}

const LanguageDropdown = ({ toggleDrop }: ILanguageDropdown) => {
  const {
    language,
    setLanguage,
    reportEnrichDataLayer,
    environment,
    getCurrentExercise,
    syllabus,
    pendingTranslations,
    exercises,
    token,
    getSidebar,
    setPendingTranslations,
    mode,
  } = useStore((state) => ({
    language: state.language,
    setLanguage: state.setLanguage,
    getCurrentExercise: state.getCurrentExercise,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
    environment: state.environment,
    syllabus: state.syllabus,
    pendingTranslations: state.pendingTranslations,
    exercises: state.exercises,
    token: state.token,
    getSidebar: state.getSidebar,
    setPendingTranslations: state.setPendingTranslations,
    mode: state.mode,
  }));

  const currentExercise = getCurrentExercise();
  const [allowAddLanguage, setAllowAddLanguage] = useState(false);
  const [retryingLang, setRetryingLang] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleRetryTranslation = async (lang: string) => {
    if (!exercises?.length || !token) return;
    const missingSlugs = getMissingSlugsForLang(exercises, lang);
    if (missingSlugs.length === 0) {
      toast.success(t("allLessonsAlreadyTranslated", { language: getLanguageName(lang, i18n.language) }));
      return;
    }
    setRetryingLang(lang);
    const toastId = toast.loading(t("translatingExercises"));
    try {
      const res = await FetchManager.translateExercises(
        missingSlugs,
        lang,
        language,
        token
      );
      const translatingLanguages = res?.translatingLanguages || res?.languageCodes || [];
      if (translatingLanguages.includes(lang)) {
        setPendingTranslations((prev) => {
          const rest = prev.filter((t) => t.code !== lang);
          const newEntry: TLanguageTranslation = {
            code: lang,
            status: "translating",
            startedAt: Date.now(),
            totalExercises: missingSlugs.length,
            completedExercises: 0,
          };
          return [...rest, newEntry];
        });
        toast.success(t("translationStarted", { languages: getLanguageName(lang, i18n.language) }), { id: toastId });
      } else {
        toast.success(t("translationRequestSent"), { id: toastId });
      }
      await getSidebar();
    } catch (err) {
      toast.error(t("errorTranslatingExercises"), { id: toastId });
    } finally {
      setRetryingLang(null);
    }
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
  }, [syllabus, environment]);

  if (!currentExercise) return null;

  const languages = Object.keys(currentExercise.translations);
  const syllabusLanguages = new Set<string>();
  syllabus?.lessons?.forEach((lesson: Lesson & { translations?: Record<string, unknown> }) => {
    Object.keys(lesson.translations || {}).forEach((code) => syllabusLanguages.add(code));
  });
  const allLanguages = [
    ...new Set([
      ...languages,
      ...pendingTranslations.map((t) => t.code),
      ...syllabusLanguages,
    ]),
  ].filter((l) => l !== language);

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
        return <Loader size="sm" color="var(--color-blue-rigo)" />;
      case "translating":
        return <Loader size="sm" color="var(--color-blue-rigo)" />;
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

  const getLanguageCompletionRate = (lang: string) => {
    const pending = pendingTranslations.find(t => t.code === lang);
    return pending && typeof pending.completedExercises === 'number' && typeof pending.totalExercises === 'number' ? `${pending.completedExercises} / ${pending.totalExercises}` : "";
  };

  return (
    <div className="language-dropdown">
      {allLanguages.map((l, index) => {
        if (l === language) return null;

        const status = getLanguageStatus(l);
        const isDisabled = status === "pending" || status === "translating";

        const showRetry = mode === "creator" && exercises?.length > 0 && getMissingSlugsForLang(exercises, l).length > 0 && shouldShowRetryForLanguage(syllabus, exercises, l);
        const missingCount = showRetry ? getMissingSlugsForLang(exercises, l).length : 0;

        return (
          <div
            key={index}
            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setLang(l)}
                    disabled={isDisabled}
                    className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", width: "20px", height: "20px", flexShrink: 0, overflow: "hidden" }}>
                      {svgsLanguageMap[l]}
                    </span>
                    <span>{l}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getLanguageName(l, i18n.language)}</p>
                </TooltipContent>
              </Tooltip>
              {status && (status === "pending" || status === "translating" && !shouldShowRetryForLanguage(syllabus, exercises, l)) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="d-flex align-center gap-small">
                      <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {getStatusIcon(status)}
                      </span>
                      {status === "translating" && (
                        <span className="text-small text-gray-500">{getLanguageCompletionRate(l)}</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getStatusTooltip(status, l)}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {showRetry && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRetryTranslation(l); }}
                    disabled={retryingLang === l}
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px" }}
                    className="rounded hover:bg-gray-100 disabled:opacity-50"
                    aria-label={t("translateRemaining")}
                  >
                    {retryingLang === l ? (
                      <Loader size="sm" color="var(--color-blue-rigo)" />
                    ) : (
                      <span style={{ width: 14, height: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {svgs.resetIconV2}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px]" side="left">
                  <p className="whitespace-normal break-words">
                    {t("lessonsPendingTranslationTooltip", { count: missingCount })}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
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

      // Handle response with existing and translating languages
      const translatingLanguages = res?.translatingLanguages || []
      const existingLanguages = res?.existingLanguages || []

      // Case 1: All languages already exist
      if (translatingLanguages.length === 0 && existingLanguages.length > 0) {
        const existingNames = existingLanguages
          .map((code: string) => getLanguageName(code, i18n.language))
          .join(", ");

        toast.success(t("translationAlreadyExists", { languages: existingNames }), {
          id: toastId,
          duration: 6000
        });
      }
      // Case 2: Some languages exist, some are being translated
      else if (translatingLanguages.length > 0 && existingLanguages.length > 0) {
        const { setPendingTranslations } = useStore.getState();

        const newTranslations: TLanguageTranslation[] = translatingLanguages.map((code: string) => ({
          code,
          status: "translating" as TTranslationStatus,
          startedAt: Date.now(),
          totalExercises: exercises.length,
          completedExercises: 0,
        }));

        setPendingTranslations(newTranslations);

        const translatingNames = translatingLanguages
          .map((code: string) => getLanguageName(code, i18n.language))
          .join(", ");
        const existingNames = existingLanguages
          .map((code: string) => getLanguageName(code, i18n.language))
          .join(", ");

        toast.success(
          t("translationPartiallyStarted", {
            translating: translatingNames,
            existing: existingNames
          }),
          {
            id: toastId,
            duration: 6000
          }
        );
      }
      // Case 3: All languages are being translated (normal case)
      else if (translatingLanguages.length > 0) {
        const { setPendingTranslations } = useStore.getState();

        const newTranslations: TLanguageTranslation[] = translatingLanguages.map((code: string) => ({
          code,
          status: "translating" as TTranslationStatus,
          startedAt: Date.now(),
          totalExercises: exercises.length,
          completedExercises: 0,
        }));

        setPendingTranslations(newTranslations);

        const translatingNames = translatingLanguages
          .map((code: string) => getLanguageName(code, i18n.language))
          .join(", ");

        toast.success(t("translationStarted", { languages: translatingNames }), {
          id: toastId,
          duration: 6000
        });
      }
      // Case 4: Fallback (backward compatibility)
      else if (res && res.languageCodes && res.languageCodes.length > 0) {
        const { setPendingTranslations } = useStore.getState();

        const newTranslations: TLanguageTranslation[] = res.languageCodes.map((code: string) => ({
          code,
          status: "translating" as TTranslationStatus,
          startedAt: Date.now(),
          totalExercises: exercises.length,
          completedExercises: 0,
        }));

        setPendingTranslations(newTranslations);

        const languageNames = res.languageCodes
          .map((code: string) => getLanguageName(code, i18n.language))
          .join(", ");

        toast.success(t("translationStarted", { languages: languageNames }), {
          id: toastId,
          duration: 6000
        });
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
