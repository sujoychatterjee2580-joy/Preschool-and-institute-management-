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
    metaWaPhoneId: "",
    metaWaAccessToken: "",
    plan: "PRO",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.tenant) setTenant(data.tenant);
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
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.settingsTitle}</h2>
        <p className="text-xs text-slate-500 mt-1">{t.settingsSubtitle}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Info */}
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

        {/* UPI Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
            UPI Payments
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.upiIdLabel}:
            </label>
            <input
              type="text"
              placeholder="e.g. schoolname@upi"
              value={tenant.upiId || ""}
              onChange={(e) => setTenant({ ...tenant, upiId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This UPI ID is embedded automatically into all WhatsApp fee reminders and dynamic QR codes.
            </p>
          </div>
        </div>

        {/* Meta WhatsApp Cloud API */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
              Meta WhatsApp Cloud API
            </h3>
            <span className="text-[10px] text-slate-400">Optional (Built-in simulator runs out-of-the-box)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number ID:</label>
              <input
                type="text"
                placeholder="e.g. 109283746592837"
                value={tenant.metaWaPhoneId || ""}
                onChange={(e) => setTenant({ ...tenant, metaWaPhoneId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Access Token:</label>
              <input
                type="password"
                placeholder="EAA..."
                value={tenant.metaWaAccessToken || ""}
                onChange={(e) => setTenant({ ...tenant, metaWaAccessToken: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : t.saveSettings}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
