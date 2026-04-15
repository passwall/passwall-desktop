import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import tr from "./tr";

const savedLocale = localStorage.getItem("passwall_desktop_locale") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: savedLocale,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
