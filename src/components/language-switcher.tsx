"use client";
import { Button } from "@/components/ui/button";
import { type Lang } from "@/lib/i18n";
export function LanguageSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
      <button onClick={() => setLang("ar")} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === "ar" ? "bg-white text-black" : "text-zinc-300 hover:text-white"}`}>عربي</button>
      <button onClick={() => setLang("en")} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === "en" ? "bg-white text-black" : "text-zinc-300 hover:text-white"}`}>EN</button>
    </div>
  );
}
