import React from "react";
import { useTranslation } from "react-i18next";
import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/dist/locomotive-scroll.css";



function App() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-6 font-sans">
      {/* Language Switcher */}
      <div className="flex gap-4 mb-6">
        <span>{t("language")}:</span>
        <button
          onClick={() => changeLanguage("en")}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          {t("english")}
        </button>
        <button
          onClick={() => changeLanguage("hi")}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          {t("hindi")}
        </button>
      </div>

      {/* Content */}
      <h1 className="text-2xl font-bold mb-4">{t("welcome")}</h1>
      <ol className="list-decimal ml-6 space-y-2">
        <li>{t("agreement")}</li>
        <li>{t("warning")}</li>
      </ol>
    </div>
  );
}

export default App;

