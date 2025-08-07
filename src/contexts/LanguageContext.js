// src/contexts/LanguageContext.js
import React, { createContext, useContext, useState } from "react";
import i18n from "../i18n";  // i18nのパスは自分のプロジェクトに合わせて！

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // i18n.languageは "ja-JP" みたいになる場合がある
  const [language, setLanguage] = useState(i18n.language?.substring(0,2) || "en");

  const changeLanguage = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang); // i18nの言語も変更
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);