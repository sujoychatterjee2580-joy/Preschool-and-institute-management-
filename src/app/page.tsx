"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users,
  Receipt,
  QrCode,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  BotMessageSquare,
  BookHeart,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Send,
  PhoneCall,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleQuickReminder = async (invoiceId: string) => {
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const result = await res.json();
      if (result.success) {
        setReminderStatus("WhatsApp reminder sent successfully!");
        setTimeout(() => setReminderStatus(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const tenant = data?.tenant || {};
  const collectionPercent =
    metrics.monthlyRevenue > 0
      ? Math.round((metrics.totalCollected / metrics.monthlyRevenue) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {reminderStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{reminderStatus}</span>
          </div>
          <button onClick={() => setReminderStatus(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.dashWelcome}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.dashSubtitle}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/fees"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide transition shadow-sm flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t.sendFeeReminders}</span>
          </Link>
          <Link
            href="/attendance"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs tracking-wide transition flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.takeAttendance}</span>
          </Link>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.totalStudents}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.totalStudents || 5}</div>
          <p className="text-[11px] text-slate-400 mt-1">{t.activeEnrolled}</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.monthlyCollection}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(metrics.totalCollected || 0, tenant.currency)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Rate: <strong className="text-emerald-600">{collectionPercent}%</strong></span>
            <span className="text-rose-500 font-medium">Due: {formatCurrency(metrics.totalPendingFees || 0, tenant.currency)}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.todayAttendance}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{metrics.todayAttendanceRate || 80}%</div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-medium">{t.present}: {metrics.presentCount || 4}</span>
            <span>•</span>
            <span className="text-rose-500 font-medium">{t.absent}: {metrics.absentCount || 1}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{t.retentionAlert}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{metrics.highRiskStudentsCount || 1}</div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">{t.needAttention}</p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Urgent Attention List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">{t.urgentFollowUps}</h3>
            <span className="text-[11px] text-slate-400">Action items</span>
          </div>

          <div className="space-y-3">
            {/* Action 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <span>Aarav Chakraborty</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                    Overdue ₹2,200
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Absent for 4 days • Parent: Debabrata</p>
              </div>
              <button
                onClick={() => handleQuickReminder("inv-aarav")}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
              >
                {t.sendReminderBtn}
              </button>
            </div>

            {/* Action 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <span>Aria Banerjee</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Demo Visit Booked
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Saturday 11:00 AM • Parent: Megha</p>
              </div>
              <Link
                href="/admissions"
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition"
              >
                {t.viewChatBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Recent WhatsApp Log Stream */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">{t.recentActivity}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-Synced
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Sunita Sen (Kabir)</span>
                <span className="text-[10px] text-emerald-600 font-bold">Delivered</span>
              </div>
              <p className="text-slate-500 text-[11px] line-clamp-1">
                🌟 Kabir has arrived safely at Little Stars Academy at 08:58 AM.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Megha Banerjee (Aria)</span>
                <span className="text-[10px] text-emerald-600 font-bold">Replied</span>
              </div>
              <p className="text-slate-500 text-[11px] line-clamp-1">
                AI Bot scheduled school visit for Saturday 11 AM.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Sunita Sen (Kabir)</span>
                <span className="text-[10px] text-emerald-600 font-bold">Sent</span>
              </div>
              <p className="text-slate-500 text-[11px] line-clamp-1">
                🎒 Kabir's Day: Playful mood, finished lunch 100%, 45m nap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
