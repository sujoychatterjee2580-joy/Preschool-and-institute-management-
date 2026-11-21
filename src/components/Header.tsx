"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe, Bell, QrCode, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Language } from "@/lib/i18n";

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Center Name */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            Little Stars Academy
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.activeStatus}
            </span>
          </h1>
        </div>
      </div>

      {/* Right controls: Language Switcher, Kiosk link, and Director badge */}
      <div className="flex items-center gap-3">
        {/* Language Selector Pill */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                lang === l.code
                  ? "bg-white text-indigo-600 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Quick Kiosk Link */}
        <Link
          href="/attendance"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
        >
          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kiosk</span>
        </Link>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
            PM
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800">Priya M.</p>
            <p className="text-[10px] text-slate-400">Principal</p>
          </div>
        </div>
      </div>
    </header>
  );
}
