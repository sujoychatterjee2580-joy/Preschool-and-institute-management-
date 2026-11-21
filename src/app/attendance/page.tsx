"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AttendancePage() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"CLASS_VIEW" | "KIOSK_VIEW">("CLASS_VIEW");
  const [scanningStudent, setScanningStudent] = useState<string | null>(null);

  const fetchAttendance = () => {
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.classes || []);
        if (data.classes?.length > 0 && !selectedClassId) {
          setSelectedClassId(data.classes[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleMark = async (studentId: string, status: "PRESENT" | "ABSENT") => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status, sendAlert: true }),
      });
      const data = await res.json();
      if (data.success) {
        const studentName = `${data.student.firstName} ${data.student.lastName}`;
        setAlertBanner(
          status === "PRESENT"
            ? `Marked ${studentName} Present & WhatsApp alert sent to parent.`
            : `Marked ${studentName} Absent.`
        );
        fetchAttendance();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateQRScan = async (student: any) => {
    setScanningStudent(student.id);
    setTimeout(async () => {
      await handleMark(student.id, "PRESENT");
      setScanningStudent(null);
    }, 600);
  };

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const allStudents = classes.flatMap((c) => c.students || []);

  const presentCount = allStudents.filter(
    (s) => s.attendance?.[0]?.status === "PRESENT"
  ).length;
  const absentCount = allStudents.filter(
    (s) => s.attendance?.[0]?.status === "ABSENT"
  ).length;

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.attendanceTitle}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.attendanceSubtitle}</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("CLASS_VIEW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "CLASS_VIEW"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.classView}
          </button>
          <button
            onClick={() => setActiveTab("KIOSK_VIEW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === "KIOSK_VIEW"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{t.kioskView}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">{t.totalStudents}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{allStudents.length}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs text-emerald-700 font-medium">{t.present}</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
          <span className="text-[11px] text-slate-400">{t.safeArrivalPing}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-xs text-rose-700 font-medium">{t.absent}</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
          <span className="text-[11px] text-slate-400">Follow-up alert active</span>
        </div>
      </div>

      {/* Class Register View */}
      {activeTab === "CLASS_VIEW" && (
        <div className="space-y-4">
          {/* Class Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedClassId === cls.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cls.name} ({cls.students?.length || 0})
              </button>
            ))}
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {currentClass?.students?.map((student: any) => {
              const att = student.attendance?.[0];
              const isPresent = att?.status === "PRESENT";
              const isAbsent = att?.status === "ABSENT";
              const parent = student.parents?.[0]?.parent;

              return (
                <div
                  key={student.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {student.firstName} {student.lastName}
                      <span className="text-xs text-slate-400 font-mono font-normal">
                        ({student.rollNumber})
                      </span>
                    </div>
                    {parent && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Parent: {parent.name} • {parent.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {att && (
                      <span className="text-xs font-bold mr-2">
                        {isPresent ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {att.checkInTime || "On time"}
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </span>
                        )}
                      </span>
                    )}

                    <button
                      onClick={() => handleMark(student.id, "PRESENT")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isPresent
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700"
                      }`}
                    >
                      {t.markPresent}
                    </button>
                    <button
                      onClick={() => handleMark(student.id, "ABSENT")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isAbsent
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700"
                      }`}
                    >
                      {t.markAbsent}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kiosk Mode */}
      {activeTab === "KIOSK_VIEW" && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                {t.kioskView}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Front desk tablet scanner — instant arrival safety ping sent to parents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allStudents.map((student: any) => {
              const isPresent = student.attendance?.[0]?.status === "PRESENT";
              const isScanning = scanningStudent === student.id;

              return (
                <div
                  key={student.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    isPresent
                      ? "bg-emerald-950/40 border-emerald-700"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{student.firstName} {student.lastName}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{student.rollNumber}</p>
                  </div>

                  <button
                    onClick={() => handleSimulateQRScan(student)}
                    disabled={isScanning || isPresent}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{isScanning ? "..." : isPresent ? "Checked In" : t.scanQR}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
