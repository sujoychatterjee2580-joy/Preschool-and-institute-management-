"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  HeartHandshake,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function ChurnPredictionPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [retentionSending, setRetentionSending] = useState<string | null>(null);

  const fetchChurnData = () => {
    fetch("/api/churn")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChurnData();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/churn", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAlertBanner("AI Retention analysis completed!");
        fetchChurnData();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSendRetention = async (studentId: string, studentName: string) => {
    setRetentionSending(studentId);
    try {
      const res = await fetch("/api/churn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_RETENTION_MESSAGE", studentId }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertBanner(`Sent warm retention note to ${studentName}'s parent!`);
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRetentionSending(null);
    }
  };

  const highRiskStudents = students.filter((s) => s.churnScore >= 60);
  const mediumRiskStudents = students.filter((s) => s.churnScore >= 30 && s.churnScore < 60);
  const lowRiskStudents = students.filter((s) => s.churnScore < 30);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{alertBanner}</span>
          </div>
          <button onClick={() => setAlertBanner(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.churnTitle}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.churnSubtitle}</p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? "animate-spin" : ""}`} />
          <span>{evaluating ? "Analyzing..." : t.runAIAnalysis}</span>
        </button>
      </div>

      {/* 3 Simple Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-xs font-bold text-rose-700">{t.highRisk}</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{highRiskStudents.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Need attention this week</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs font-bold text-amber-700">{t.mediumRisk}</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{mediumRiskStudents.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Irregular attendance or fee delay</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-700">{t.lowRisk}</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{lowRiskStudents.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active & prompt fee payers</p>
        </div>
      </div>

      {/* Clean Student Cards */}
      <div className="space-y-3">
        {students.map((student) => {
          let riskFactors: any = {};
          try {
            riskFactors = student.churnRiskFactors ? JSON.parse(student.churnRiskFactors) : {};
          } catch (e) {
            riskFactors = {};
          }

          const score = student.churnScore || 10;
          const isHigh = score >= 60;
          const isMed = score >= 30 && score < 60;
          const parent = student.parents?.[0]?.parent;

          return (
            <div
              key={student.id}
              className={`p-4 rounded-2xl border transition bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isHigh
                  ? "border-rose-300"
                  : isMed
                  ? "border-amber-200"
                  : "border-slate-200"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({student.rollNumber} • {student.classBatch?.name})
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isHigh
                        ? "bg-rose-100 text-rose-700"
                        : isMed
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {score}% {t.riskScore}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  <strong className="text-slate-800">{t.aiDiagnosis}</strong>{" "}
                  {riskFactors.reason || "Student is attending regularly."}
                </p>

                {parent && (
                  <p className="text-[11px] text-slate-400">
                    Parent: {parent.name} • <span className="font-mono text-indigo-600">{parent.phone}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {parent?.phone && (
                  <a
                    href={`tel:${parent.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}

                <button
                  onClick={() => handleSendRetention(student.id, student.firstName)}
                  disabled={retentionSending === student.id}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>{retentionSending === student.id ? "Sending..." : t.sendRetentionMsg}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
