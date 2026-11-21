"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  LayoutDashboard,
  Users,
  Receipt,
  BotMessageSquare,
  BookHeart,
  QrCode,
  ShieldAlert,
  Settings,
  GraduationCap,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { name: t.navDashboard, href: "/", icon: LayoutDashboard },
    { name: t.navAdmin, href: "/admin", icon: Users, badge: "Master" },
    { name: t.navFees, href: "/fees", icon: Receipt },
    { name: t.navAdmissions, href: "/admissions", icon: BotMessageSquare, badge: "AI" },
    { name: t.navDiary, href: "/diary", icon: BookHeart },
    { name: t.navAttendance, href: "/attendance", icon: QrCode },
    { name: t.navRetention, href: "/churn", icon: ShieldAlert },
    { name: t.navSettings, href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            {t.brandName}
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
              AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{t.brandTagline}</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        <span>KiddieSync OS v2.0 • India</span>
      </div>
    </aside>
  );
}
