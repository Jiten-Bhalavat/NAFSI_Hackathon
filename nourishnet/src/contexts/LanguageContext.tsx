import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { TRANSLATIONS, type LangCode, type Translations } from "../i18n/translations";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: TRANSLATIONS.en,
});

const STORAGE_KEY = "nourishnet-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && stored in TRANSLATIONS) return stored;
    // Auto-detect from browser
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === "es") return "es";
    if (browserLang === "fr") return "fr";
    if (browserLang === "am") return "am";
    return "en";
  });

  const setLang = (l: LangCode) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  // Expose on window for chatbot to read
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__nourishLang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}