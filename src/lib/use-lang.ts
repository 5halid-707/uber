"use client";
import { useState, useEffect, useCallback } from "react";
import { type Lang } from "@/lib/i18n";
const LANG_KEY = "uber_lang";
export function useLang() {
  const [lang, setLangState] = useState<Lang>("ar");
  useEffect(() => { try { const s = localStorage.getItem(LANG_KEY) as Lang | null; if (s === "ar" || s === "en") setLangState(s); } catch {} }, []);
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch {}; if (typeof document !== "undefined") { document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; document.documentElement.lang = l; } }, []);
  useEffect(() => { if (typeof document !== "undefined") { document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = lang; } }, [lang]);
  return { lang, setLang };
}
