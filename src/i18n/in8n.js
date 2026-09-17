import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.js";
import hy from "./hy.js";
import ru from "./ru.js";

const STORAGE_KEY = "animedia-language";

export const translations = { en, hy, ru };

export const languageOptions = [
  { code: "en", label: "English" },
  { code: "hy", label: "Հայերեն" },
  { code: "ru", label: "Русский" },
];

export const getLanguageLabel = (code) => languageOptions.find((option) => option.code === code)?.label ?? "English";

const getStoredLanguage = () => {
  if (typeof window === "undefined") return "ru";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return languageOptions.some((option) => option.code === saved) ? saved : "ru";
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent("animedia-language-change", { detail: language }));
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language] ?? translations.ru,
      availableLanguages: languageOptions,
    }),
    [language],
  );

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context) {
    return context;
  }

  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => translations[language] ?? translations.ru, [language]);

  return { language, setLanguage, t, availableLanguages: languageOptions };
}

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return React.createElement(
    "div",
    { className: "relative flex items-center" },
    React.createElement("label", { className: "sr-only", htmlFor: "language-select" }, "Language"),
    React.createElement(
      "select",
      {
        id: "language-select",
        value: language,
        onChange: (event) => setLanguage(event.target.value),
        className: "rounded px-2 py-1.5 text-xs transition-all outline-none",
        style: {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(124,58,237,0.2)",
          color: "#e8e8f0",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
        },
      },
      languageOptions.map((option) =>
        React.createElement(
          "option",
          { key: option.code, value: option.code, style: { background: "#13131c" } },
          option.label,
        ),
      ),
    ),
  );
}

export default translations.ru;
