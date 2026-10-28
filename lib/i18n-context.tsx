"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Locale, getDictionary } from "@/lib/i18n";

type TranslationContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, any>) => string;
};

const LocaleContext = createContext<TranslationContextType | undefined>(undefined);

export function LocaleProvider({ children, initialLocale }: { children: ReactNode, initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const dictionary = getDictionary(locale);

  const t = (path: string, params?: Record<string, any>) => {
    const keys = path.split(".");
    let result: any = dictionary;
    for (const key of keys) {
      if (result[key] === undefined) return path;
      result = result[key];
    }

    if (typeof result === "function" || typeof result === "object" && result !== null && !Array.isArray(result) && !result.toString().startsWith("#")) {
        // This is a bit hacky, but let's see if it works for simple strings
    }
    
    if (typeof result !== "string") return path;

    let str = result;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        str = str.replace(`{${key}}`, value);
      }
    }
    return str;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LocaleProvider");
  }
  return context;
}
