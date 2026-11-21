"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BookHeart,
  Send,
  CheckCircle2,
  Smile,
  Utensils,
  Moon,
  Activity,
  History,
} from "lucide-react";

export default function DiaryPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [mood, setMood] = useState("PLAYFUL");
  const [mealIntake, setMealIntake] = useState("FINISHED_ALL");
  const [napMinutes, setNapMinutes] = useState(45);
  const [activities, setActivities] = useState("Finger painting, nursery rhymes, alphabet puzzle");
  const [previewNote, setPreviewNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  const fetchDiaries = () => {
    fetch("/api/diaries")
      .then((res) => res.json())
      .then((data) => {
        setDiaries(data.diaries || []);
        setStudents(data.students || []);
        if (data.students?.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data.students[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  const handleGenerateAndSend = async (sendWhatsApp: boolean) => {
    if (!selectedStudentId) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/diaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          mood,
          mealIntake,
          napMinutes,
          pottyCount: 2,
          activities,
          sendWhatsApp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPreviewNote(data.aiNote);
        if (sendWhatsApp) {
          setAlertBanner("Daily diary sent to parent on WhatsApp!");
        } else {
          setAlertBanner("AI note generated!");
        }
        fetchDiaries();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

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
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.diaryTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.diarySubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.selectStudent}:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.rollNumber} - {s.classBatch?.name})
                </option>
              ))}
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-amber-500" /> {t.moodLabel}:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Playful 🤸", val: "PLAYFUL" },
                { label: "Happy 😊", val: "HAPPY" },
                { label: "Calm 🧘", val: "CALM" },
                { label: "Tired 🥱", val: "TIRED" },
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setMood(m.val)}
                  className={`py-2 rounded-xl text-xs border text-center transition ${
                    mood === m.val
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-500" /> {t.foodLabel}:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Finished All (100%)", val: "FINISHED_ALL" },
                { label: "Ate Half (50%)", val: "ATE_HALF" },
                { label: "A Few Bites", val: "LITTLE" },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => setMealIntake(f.val)}
                  className={`py-2 rounded-xl text-xs border text-center transition ${
                    mealIntake === f.val
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nap */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500" /> {t.napLabel}:
            </label>
            <div className="flex gap-2">
              {[0, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setNapMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-xl text-xs border transition ${
                    napMinutes === mins
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {mins === 0 ? "No Nap" : `${mins} mins`}
                </button>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-500" /> {t.activityLabel}:
            </label>
            <input
              type="text"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => handleGenerateAndSend(false)}
              disabled={generating}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              {t.generateOnly}
            </button>
            <button
              onClick={() => handleGenerateAndSend(true)}
              disabled={generating}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{generating ? "Sending..." : t.sendToParent}</span>
            </button>
          </div>
        </div>

        {/* Right: Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b141a] rounded-2xl border border-slate-800 p-4 text-white shadow-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300">{t.previewTitle}</span>
              <span className="text-[10px] text-emerald-400 font-mono">WhatsApp</span>
            </div>

            <div className="p-3 bg-[#202c33] rounded-xl text-xs text-slate-100 whitespace-pre-line leading-relaxed font-sans">
              {previewNote || (
                `🎒 *${selectedStudent?.firstName || "Kabir"}'s Day at Little Stars*\n\n🌟 *Mood:* Super playful, giggling and sharing toys today!\n\n🎨 *Activities:* Participated in ${activities}.\n\n🥪 *Snack:* Finished snacks completely with good appetite.\n\n💤 *Nap:* Cozy ${napMinutes}-minute nap.\n\nWe love seeing their progress! ❤️`
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-2">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              {t.sentHistory} ({diaries.length})
            </h4>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {diaries.map((d) => (
                <div key={d.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span>{d.student?.firstName} {d.student?.lastName}</span>
                    <span className="text-[10px] text-emerald-600 font-mono">Delivered</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{d.aiGeneratedNote}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
