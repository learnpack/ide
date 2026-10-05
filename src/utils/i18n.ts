import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import es from "../locales/es.json";

const SUPPORTED_LANGUAGES = ["en", "es"];

function getInitialLanguage(): string {
  try {
    const lang = new URLSearchParams(window.location.search).get("language");
    if (lang && SUPPORTED_LANGUAGES.includes(lang)) return lang;
  } catch {}
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    es: {
      translation: es,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

/** Syncs the UI language with the content language ("us" is the content code for English). */
export function syncUiLanguage(lang: string) {
  const uiLang = lang === "us" ? "en" : lang;
  if (i18n.language !== uiLang) i18n.changeLanguage(uiLang);
}

export default i18n;
