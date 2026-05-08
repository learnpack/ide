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

export default i18n;
