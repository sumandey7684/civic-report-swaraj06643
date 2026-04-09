import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend) // load translations from public
  .use(LanguageDetector) // detect user language (localStorage, browser, etc.)
  .use(initReactI18next) // hook for react
  .init({
    fallbackLng: "en",
    load: "languageOnly",
    debug: true,
    backend: {
      loadPath: '/{{lng}}-translation.json'
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
