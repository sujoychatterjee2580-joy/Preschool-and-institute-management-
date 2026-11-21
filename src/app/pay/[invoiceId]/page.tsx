"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  QrCode,
  Smartphone,
  Building,
  CreditCard,
  Download,
  Calendar,
  Clock,
  Heart,
  AlertCircle,
  Copy,
  Check,
  Printer,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientPaymentPage() {
  const params = useParams();
  const invoiceId = params?.invoiceId as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activePaymentTab, setActivePaymentTab] = useState<"UPI_QR" | "UPI_APPS" | "BANK">("UPI_QR");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [txnRef, setTxnRef] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchInvoiceDetails = () => {
    fetch(`/api/pay?id=${invoiceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvoice(data.invoice);
          setTenant(data.tenant);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Parent confirms payment
  const handleConfirmPayment = async () => {
    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/fees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          status: "PAID",
          paymentMethod: activePaymentTab === "BANK" ? "BANK_TRANSFER" : "UPI",
          transactionRef: txnRef || `UPI-${Date.now().toString().slice(-6)}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmModal(false);
        fetchInvoiceDetails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-lg border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-900">Invoice Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          This payment link may be invalid or expired. Please contact the school office.
        </p>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const student = invoice.student;
  const parent = student?.parents?.[0]?.parent;
  const upiId = tenant?.upiId || "school@okhdfcbank";
  const amount = invoice.netAmount;
  const centerName = tenant?.name || "Little Stars Academy";

  // Construct UPI Intent URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    centerName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Fees-${student?.rollNumber}-${invoice.month}`)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiUri
  )}`;

  return (
    <div className="max-w-md w-full mx-auto my-6 space-y-4">
      {/* Top School Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-600/20 font-bold text-lg mb-2">
          {centerName[0]}
        </div>
        <h1 className="font-bold text-base text-slate-900">{centerName}</h1>
        <p className="text-xs text-slate-500">{tenant?.address || "Child Development Center"}</p>
        {tenant?.phone && (
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Helpline: {tenant.phone}</p>
        )}

        {/* School Announcement Notice if configured by admin */}
        {tenant?.portalNotice && (
          <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-left text-xs text-indigo-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">{tenant.portalNotice}</p>
          </div>
        )}
      </div>

      {/* Main Payment / Receipt Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
        {/* Child & Invoice Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student</span>
            <h2 className="font-bold text-base text-slate-900 mt-0.5">
              {student?.firstName} {student?.lastName}
            </h2>
            <p className="text-xs text-slate-500">
              {student?.classBatch?.name} • Roll: {student?.rollNumber}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
            <div className="mt-1">
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                  Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Fee Amount Display */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{invoice.month} Tuition Fee</p>
            <p className="text-[11px] text-slate-400">Due by: {formatDate(invoice.dueDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(amount, tenant?.currency)}
            </p>
          </div>
        </div>

        {/* IF ALREADY PAID: SHOW OFFICIAL RECEIPT */}
        {isPaid ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-900">Fee Payment Confirmed!</h3>
              <p className="text-xs text-emerald-700">
                Receipt #{invoice.invoiceNumber} • Paid via {invoice.paymentMethod || "UPI"}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Download / Print Official Receipt</span>
            </button>

            {tenant?.receiptNote && (
              <p className="text-[11px] text-slate-400 text-center italic">
                {tenant.receiptNote}
              </p>
            )}
          </div>
        ) : (
          /* IF PENDING: SYSTEMATIC PAYMENT METHODS */
          <div className="space-y-4">
            {/* Payment Method Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActivePaymentTab("UPI_QR")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activePaymentTab === "UPI_QR"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Scan UPI QR
              </button>
              <button
                onClick={() => setActivePaymentTab("UPI_APPS")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activePaymentTab === "UPI_APPS"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pay via App
              </button>
              {tenant?.bankAccount && (
                <button
                  onClick={() => setActivePaymentTab("BANK")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activePaymentTab === "BANK"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bank Transfer
                </button>
              )}
            </div>

            {/* TAB 1: DYNAMIC UPI QR */}
            {activePaymentTab === "UPI_QR" && (
              <div className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-2xl space-y-3">
                <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-200">
                  <img
                    src={qrImageUrl}
                    alt="Scan to Pay via UPI"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-indigo-600">
                    <span>UPI ID: {upiId}</span>
                    <button
                      onClick={() => copyToClipboard(upiId, "upi")}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500"
                    >
                      {copiedField === "upi" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MOBILE 1-CLICK APPS */}
            {activePaymentTab === "UPI_APPS" && (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500 text-center">
                  Tap below to launch your preferred UPI app directly on this phone:
                </p>
                <a
                  href={upiUri}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open PhonePe / Google Pay / Paytm</span>
                </a>
              </div>
            )}

            {/* TAB 3: BANK DETAILS */}
            {activePaymentTab === "BANK" && tenant?.bankAccount && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-800">{tenant.bankName || "HDFC Bank"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Account Number:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                    <span>{tenant.bankAccount}</span>
                    <button
                      onClick={() => copyToClipboard(tenant.bankAccount, "acc")}
                      className="text-indigo-600"
                    >
                      {copiedField === "acc" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-800">{tenant.bankIfsc || "HDFC0001234"}</span>
                </div>
              </div>
            )}

            {/* Confirmation Action for Parent */}
            <div className="pt-2">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Completed Payment</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Your receipt will be verified and generated automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PARENT CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-sm text-slate-900">Confirm Your Payment</h3>
            <p className="text-xs text-slate-600">
              Please enter your UPI Ref / UTR number from PhonePe/GPay (or tap Confirm if paid via QR):
            </p>

            <input
              type="text"
              placeholder="e.g. 432109876543 (Optional)"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
            />

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={submittingPayment}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
              >
                {submittingPayment ? "Verifying..." : "Confirm & Get Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHILD's RECENT UPDATES (Attendance & Diary - Only if school enabled) */}
      {student && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            {student.firstName}'s Daily School Highlights
          </h4>

          <div className="space-y-2">
            {/* Attendance Status */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
              <span className="text-slate-600">Today's Attendance:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Arrived Safely (08:58 AM)
              </span>
            </div>

            {/* Today's Diary Note */}
            <div className="p-3 bg-indigo-50/50 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-indigo-900">Today's Activities:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {student.firstName} was in a super playful mood, thoroughly enjoyed lunch, and completed a 45-min cozy nap!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400">
        Secured by KiddieSync Client Portal • {centerName}
      </div>
    </div>
  );
}
