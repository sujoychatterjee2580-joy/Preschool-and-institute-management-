"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  BotMessageSquare,
  Send,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdmissionsPage() {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live WhatsApp Simulator
  const [simPhone, setSimPhone] = useState("+91 98319 88776");
  const [simName, setSimName] = useState("Megha Banerjee");
  const [simMessage, setSimMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      sender: "parent",
      text: "Hello, what is the monthly fee for Nursery and can we visit tomorrow?",
      time: "10:14 AM",
    },
    {
      sender: "ai_bot",
      text: "Hello! Thank you for contacting Little Stars Academy. 🌟\n\nOur Nursery program fee is ₹2,200/month (all activity kits included).\n\nWe have open tour slots tomorrow at 10:30 AM and 4:00 PM. Would you like to reserve a visit for your child?",
      time: "10:14 AM",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const fetchAdmissions = () => {
    fetch("/api/admissions")
      .then((res) => res.json())
      .then((data) => {
        setInquiries(data.inquiries || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleSendMessage = async (presetText?: string) => {
    const textToSend = presetText || simMessage;
    if (!textToSend.trim()) return;

    const newHistory = [
      ...chatHistory,
      {
        sender: "parent",
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setChatHistory(newHistory);
    setSimMessage("");
    setIsBotTyping(true);

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentPhone: simPhone,
          parentName: simName,
          messageText: textToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory([
          ...newHistory,
          {
            sender: "ai_bot",
            text: data.aiReply,
            intent: data.detectedIntent,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        fetchAdmissions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleUpdateStatus = async (inquiryId: string, status: string) => {
    try {
      await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STATUS", inquiryId, status }),
      });
      fetchAdmissions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.admissionsTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.admissionsSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lead Funnel Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
              {t.leadPipeline} ({inquiries.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {inquiries.map((inq) => {
              const isDemo = inq.status === "DEMO_BOOKED";
              const isEnrolled = inq.status === "ENROLLED";

              return (
                <div
                  key={inq.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {inq.parentName}
                        <span className="text-xs font-normal text-slate-500">
                          (Child: {inq.childName} • {inq.childAge || "2-3 yrs"})
                        </span>
                      </div>
                      <p className="text-xs text-indigo-600 font-mono mt-0.5">{inq.phone}</p>
                    </div>

                    <div>
                      {isDemo && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" /> {t.demoBooked}
                        </span>
                      )}
                      {isEnrolled && (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-indigo-600" /> {t.enrolled}
                        </span>
                      )}
                      {!isDemo && !isEnrolled && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {inq.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {inq.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <strong>AI Note:</strong> {inq.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(inq.createdAt)}</span>
                    <div className="flex gap-2">
                      {inq.status !== "DEMO_BOOKED" && (
                        <button
                          onClick={() => handleUpdateStatus(inq.id, "DEMO_BOOKED")}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                        >
                          {t.confirmVisit}
                        </button>
                      )}
                      {inq.status !== "ENROLLED" && (
                        <button
                          onClick={() => handleUpdateStatus(inq.id, "ENROLLED")}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                        >
                          {t.completeAdmission}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: WhatsApp Test Simulator (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#0b141a] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[560px]">
            {/* Top Bar */}
            <div className="bg-[#202c33] p-3 flex items-center gap-2.5 text-white border-b border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">Little Stars AI Bot</p>
                <p className="text-[10px] text-emerald-400">Online • Auto-Reply</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-[#0b141a]">
              {chatHistory.map((msg, i) => {
                const isParent = msg.sender === "parent";
                return (
                  <div
                    key={i}
                    className={`flex flex-col ${isParent ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl text-xs whitespace-pre-line leading-relaxed ${
                        isParent
                          ? "bg-[#005c4b] text-white"
                          : "bg-[#202c33] text-slate-100 border border-slate-700"
                      }`}
                    >
                      {msg.text}
                      <div className="text-[9px] mt-1 text-right text-slate-400">
                        {msg.time}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isBotTyping && (
                <div className="bg-[#202c33] text-slate-400 px-3 py-1.5 rounded-xl text-xs w-fit">
                  AI is typing...
                </div>
              )}
            </div>

            {/* Test prompt chips */}
            <div className="bg-[#111b21] p-2 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px]">
              <button
                onClick={() => handleSendMessage("What are the Nursery timings and monthly fees?")}
                className="px-2 py-1 rounded bg-[#202c33] text-slate-300 hover:text-white whitespace-nowrap"
              >
                English: Fees query
              </button>
              <button
                onClick={() => handleSendMessage("नर्सरी की फीस कितनी है और क्या कल आ सकते हैं?")}
                className="px-2 py-1 rounded bg-[#202c33] text-slate-300 hover:text-white whitespace-nowrap"
              >
                हिन्दी: फीस और विजिट
              </button>
              <button
                onClick={() => handleSendMessage("প্লেগ্রুপের ভর্তি ফি কত এবং সময় কী?")}
                className="px-2 py-1 rounded bg-[#202c33] text-slate-300 hover:text-white whitespace-nowrap"
              >
                বাংলা: ভর্তি তথ্য
              </button>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-[#202c33] p-2 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={t.typeParentMsg}
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                className="flex-1 bg-[#2a3942] text-white text-xs px-3 py-2 rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                disabled={isBotTyping || !simMessage.trim()}
                className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
