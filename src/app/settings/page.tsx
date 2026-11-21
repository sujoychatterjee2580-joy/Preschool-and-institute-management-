"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Settings,
  CheckCircle2,
  Building,
  CreditCard,
  MessageSquare,
  Save,
  Sliders,
  ExternalLink,
  Eye,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [tenant, setTenant] = useState<any>({
    name: "",
    phone: "",
    email: "",
    address: "",
    currency: "INR",
    upiId: "",
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
    portalNotice: "",
    portalShowAttendance: true,
    portalShowDiary: true,
    receiptNote: "",
    metaWaPhoneId: "",
    metaWaAccessToken: "",
    plan: "PRO",
  });
  const [sampleInvoiceId, setSampleInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.tenant) setTenant(data.tenant);
        if (data.sampleInvoiceId) setSampleInvoiceId(data.sampleInvoiceId);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenant),
      });
      const data = await res.json();
      if (data.success) {
        setAlertBanner(t.savedSuccess);
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.settingsTitle}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.settingsSubtitle}</p>
        </div>

        {sampleInvoiceId && (
          <a
            href={`/pay/${sampleInvoiceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Client Portal Preview ↗</span>
          </a>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* SECTION 1: MONEY COLLECTION DESTINATION & UPI */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Money Collection Methods (পয়সা কালেকশন অপশন)
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Direct to Your Account
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary UPI ID for Payments (Instant PhonePe / GPay / Paytm):
              </label>
              <input
                type="text"
                placeholder="e.g. schoolname@okhdfcbank or director@upi"
                value={tenant.upiId || ""}
                onChange={(e) => setTenant({ ...tenant, upiId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Parents will scan this QR code or 1-click pay directly to your account.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Direct Bank Account Transfer (Optional for NEFT/IMPS parents):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Bank Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={tenant.bankName || ""}
                    onChange={(e) => setTenant({ ...tenant, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Account Number:</label>
                  <input
                    type="text"
                    placeholder="e.g. 50100234567890"
                    value={tenant.bankAccount || ""}
                    onChange={(e) => setTenant({ ...tenant, bankAccount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">IFSC Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={tenant.bankIfsc || ""}
                    onChange={(e) => setTenant({ ...tenant, bankIfsc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CLIENT PORTAL UI CUSTOMIZER */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Client / Parent Portal Customizer (অভিভাবকের স্ক্রিন কন্ট্রোল)
            </h3>
            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
              Controls What Clients See
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Announcement Notice Banner for Parents (Shows on Payment Page):
              </label>
              <textarea
                rows={2}
                placeholder="e.g. School Annual Sports Day will be held on Friday. Kindly settle fee dues before the event."
                value={tenant.portalNotice || ""}
                onChange={(e) => setTenant({ ...tenant, portalNotice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Show Today's Attendance</p>
                  <p className="text-[11px] text-slate-500">Parent sees child's arrival status on page</p>
                </div>
                <input
                  type="checkbox"
                  checked={tenant.portalShowAttendance !== false}
                  onChange={(e) => setTenant({ ...tenant, portalShowAttendance: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>

              <label className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Show Today's Kid Diary</p>
                  <p className="text-[11px] text-slate-500">Parent sees mood & meals update</p>
                </div>
                <input
                  type="checkbox"
                  checked={tenant.portalShowDiary !== false}
                  onChange={(e) => setTenant({ ...tenant, portalShowDiary: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receipt Footer Note (Printed on Official Receipts):
              </label>
              <input
                type="text"
                placeholder="e.g. Fees once paid are non-refundable. Thank you for your continued partnership!"
                value={tenant.receiptNote || ""}
                onChange={(e) => setTenant({ ...tenant, receiptNote: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: CENTER PROFILE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
            {t.centerInfo}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.centerName}:</label>
              <input
                type="text"
                value={tenant.name || ""}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.officialPhone}:</label>
              <input
                type="text"
                value={tenant.phone || ""}
                onChange={(e) => setTenant({ ...tenant, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.officialEmail}:</label>
              <input
                type="email"
                value={tenant.email || ""}
                onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.currency}:</label>
              <select
                value={tenant.currency || "INR"}
                onChange={(e) => setTenant({ ...tenant, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-medium"
              >
                <option value="INR">INR (₹) - India</option>
                <option value="BDT">BDT (৳) - Bangladesh</option>
                <option value="USD">USD ($) - International</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t.address}:</label>
              <input
                type="text"
                value={tenant.address || ""}
                onChange={(e) => setTenant({ ...tenant, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : t.saveSettings}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
