"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Receipt,
  Send,
  CheckCircle2,
  Clock,
  QrCode,
  AlertCircle,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FeesPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [selectedInvoiceForUPI, setSelectedInvoiceForUPI] = useState<any | null>(null);

  const fetchInvoices = () => {
    fetch(`/api/fees?status=${filter}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.invoices || []);
        setTenant(data.tenant);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const handleSendReminder = async (invoiceId: string) => {
    setSendingId(invoiceId);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertBanner("WhatsApp reminder & UPI payment link sent!");
        fetchInvoices();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingId(null);
    }
  };

  const handleBulkReminders = async () => {
    setBulkSending(true);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertBanner(`Sent WhatsApp reminders to ${data.count} parents!`);
        fetchInvoices();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBulkSending(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const res = await fetch("/api/fees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, status: "PAID", paymentMethod: "UPI" }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertBanner(t.paidSuccess);
        fetchInvoices();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").length;

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.feesTitle}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.feesSubtitle}</p>
        </div>

        <button
          onClick={handleBulkReminders}
          disabled={bulkSending || pendingCount === 0}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{bulkSending ? "Sending..." : `${t.sendAllReminders} (${pendingCount})`}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { key: "ALL", label: t.allInvoices },
          { key: "PENDING", label: t.pending },
          { key: "OVERDUE", label: t.overdue },
          { key: "PAID", label: t.paid },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === tab.key
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">{t.studentName}</th>
                <th className="px-5 py-3">{t.classBatch}</th>
                <th className="px-5 py-3">{t.parentWhatsApp}</th>
                <th className="px-5 py-3">{t.amountDue}</th>
                <th className="px-5 py-3">{t.dueDate}</th>
                <th className="px-5 py-3">{t.status}</th>
                <th className="px-5 py-3 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const student = inv.student;
                  const parent = student?.parents?.[0]?.parent;
                  const isPaid = inv.status === "PAID";
                  const isOverdue = inv.status === "OVERDUE";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {student?.firstName} {student?.lastName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {student?.rollNumber}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {student?.classBatch?.name}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{parent?.name || "Parent"}</div>
                        <span className="text-[11px] text-indigo-600 font-mono">{parent?.phone}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(inv.netAmount, tenant?.currency)}
                        </div>
                        <span className="text-[10px] text-slate-400">{inv.month}</span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(inv.dueDate)}
                      </td>

                      <td className="px-5 py-3.5">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t.paid}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> {t.overdue}
                          </span>
                        )}
                        {!isPaid && !isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> {t.pending}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid ? (
                            <>
                              <button
                                onClick={() => handleSendReminder(inv.id)}
                                disabled={sendingId === inv.id}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition"
                              >
                                {sendingId === inv.id ? "..." : "WhatsApp"}
                              </button>

                              <button
                                onClick={() => setSelectedInvoiceForUPI(inv)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title={t.showUPIQR}
                              >
                                <QrCode className="w-4 h-4 text-slate-600" />
                              </button>

                              <button
                                onClick={() => handleMarkAsPaid(inv.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
                              >
                                {t.paid}
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              Receipt Sent <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPI QR Modal */}
      {selectedInvoiceForUPI && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-6 text-center space-y-4 shadow-xl animate-fade-in">
            <h3 className="font-bold text-sm text-slate-900">
              {selectedInvoiceForUPI.student?.firstName} {selectedInvoiceForUPI.student?.lastName}
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=${encodeURIComponent(
                  tenant?.upiId || "littlestars@okhdfcbank"
                )}%26pn=${encodeURIComponent(tenant?.name || "Little Stars")}%26am=${
                  selectedInvoiceForUPI.netAmount
                }%26cu=INR`}
                alt="UPI QR"
                className="w-40 h-40 object-contain"
              />
              <p className="text-xs font-mono font-bold text-slate-800 mt-2">
                UPI: {tenant?.upiId || "littlestars@okhdfcbank"}
              </p>
              <p className="text-xs font-bold text-indigo-600 mt-0.5">
                {formatCurrency(selectedInvoiceForUPI.netAmount, tenant?.currency)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedInvoiceForUPI(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.close}
              </button>
              <button
                onClick={() => {
                  handleMarkAsPaid(selectedInvoiceForUPI.id);
                  setSelectedInvoiceForUPI(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
              >
                {t.confirmPaid}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
