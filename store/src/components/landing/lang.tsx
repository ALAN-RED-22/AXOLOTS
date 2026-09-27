"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "es" | "en";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "es",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LangContext value={{ lang, setLang }}>{children}</LangContext>;
}

export const useLang = () => useContext(LangContext);

/** Texto bilingüe: el español es el valor por defecto (SSR), el inglés se aplica al cambiar de idioma. */
export function T({ es, en }: { es: string; en: string }) {
  const { lang } = useLang();
  return <>{lang === "en" ? en : es}</>;
}
