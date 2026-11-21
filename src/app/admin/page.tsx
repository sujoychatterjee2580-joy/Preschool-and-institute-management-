"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Phone,
  GraduationCap,
  X,
  Save,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminControlPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"STUDENTS" | "BATCHES">("STUDENTS");
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  // Student Modal State (Add or Edit)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    rollNumber: "",
    classBatchId: "",
    parentName: "",
    parentPhone: "",
  });

  // Batch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: "",
    room: "Room A",
    monthlyFee: "1800",
    defaultStartTime: "09:00 AM",
    defaultEndTime: "12:30 PM",
  });

  const fetchData = () => {
    fetch(`/api/students?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setBatches(data.batches || []);
        if (data.batches?.length > 0 && !studentForm.classBatchId) {
          setStudentForm((prev) => ({ ...prev, classBatchId: data.batches[0].id }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Open modal to Add student
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      firstName: "",
      lastName: "",
      rollNumber: `ST-${Date.now().toString().slice(-4)}`,
      classBatchId: batches[0]?.id || "",
      parentName: "",
      parentPhone: "+91 ",
    });
    setIsStudentModalOpen(true);
  };

  // Open modal to Edit student
  const handleOpenEditStudent = (student: any) => {
    setEditingStudent(student);
    const parent = student.parents?.[0]?.parent;
    setStudentForm({
      firstName: student.firstName,
      lastName: student.lastName,
      rollNumber: student.rollNumber,
      classBatchId: student.classBatchId,
      parentName: parent?.name || "",
      parentPhone: parent?.phone || "",
    });
    setIsStudentModalOpen(true);
  };

  // Save student (POST or PUT)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/students";
      const method = editingStudent ? "PUT" : "POST";
      const payload = editingStudent
        ? { id: editingStudent.id, ...studentForm }
        : studentForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setAlertBanner(
          editingStudent ? "Student updated successfully!" : "New student added successfully!"
        );
        setIsStudentModalOpen(false);
        fetchData();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`${t.deleteConfirm} (${name})`)) return;

    try {
      const res = await fetch(`/api/students?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAlertBanner("Student deleted successfully.");
        fetchData();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save batch (POST)
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm),
      });
      const data = await res.json();
      if (data.success) {
        setAlertBanner("New batch created successfully!");
        setIsBatchModalOpen(false);
        setBatchForm({
          name: "",
          room: "Room A",
          monthlyFee: "1800",
          defaultStartTime: "09:00 AM",
          defaultEndTime: "12:30 PM",
        });
        fetchData();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete batch
  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`${t.deleteConfirm} (${name})`)) return;

    try {
      const res = await fetch(`/api/batches?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAlertBanner("Batch deleted.");
        fetchData();
        setTimeout(() => setAlertBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.adminTitle}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.adminSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "STUDENTS" ? (
            <button
              onClick={handleOpenAddStudent}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewStudent}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewBatch}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("STUDENTS")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "STUDENTS"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t.tabStudents} ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("BATCHES")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === "BATCHES"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {t.tabBatches} ({batches.length})
        </button>
      </div>

      {/* TAB 1: STUDENTS DIRECTORY */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3">{t.studentName}</th>
                    <th className="px-5 py-3">{t.classBatch}</th>
                    <th className="px-5 py-3">{t.parentName}</th>
                    <th className="px-5 py-3">{t.parentPhone}</th>
                    <th className="px-5 py-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Loading students...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const parent = student.parents?.[0]?.parent;
                      const fullName = `${student.firstName} ${student.lastName}`;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{fullName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Roll: {student.rollNumber}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-slate-600">
                            {student.classBatch?.name}
                          </td>

                          <td className="px-5 py-3.5 font-medium text-slate-800">
                            {parent?.name || "Parent"}
                          </td>

                          <td className="px-5 py-3.5 text-indigo-600 font-mono">
                            {parent?.phone || "N/A"}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditStudent(student)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title={t.editStudent}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id, fullName)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                                title={t.deleteStudent}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* TAB 2: BATCHES & FEES SETUP */}
      {activeTab === "BATCHES" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{batch.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Room: {batch.room || "Room A"}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {formatCurrency(batch.monthlyFee, "INR")}/mo
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <p>Timings: {batch.defaultStartTime || "09:00 AM"} - {batch.defaultEndTime || "12:30 PM"}</p>
                  <p className="text-[11px] text-slate-400">
                    Students Enrolled: {batch._count?.students || 0}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDeleteBatch(batch.id, batch.name)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteStudent}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD / EDIT STUDENT */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingStudent ? t.editStudent : t.addNewStudent}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.firstName} *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.lastName}</label>
                  <input
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.rollNumber} *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.rollNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.selectBatch} *</label>
                  <select
                    value={studentForm.classBatchId}
                    onChange={(e) => setStudentForm({ ...studentForm, classBatchId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-medium"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.parentName} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Mukherjee"
                  value={studentForm.parentName}
                  onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.parentPhone} *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={studentForm.parentPhone}
                  onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                >
                  {t.saveStudent}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BATCH */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">{t.addNewBatch}</h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.batchName} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upper Kindergarten (UKG)"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.monthlyFee} *</label>
                  <input
                    type="number"
                    required
                    value={batchForm.monthlyFee}
                    onChange={(e) => setBatchForm({ ...batchForm, monthlyFee: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t.roomName}</label>
                  <input
                    type="text"
                    value={batchForm.room}
                    onChange={(e) => setBatchForm({ ...batchForm, room: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t.timing}</label>
                <input
                  type="text"
                  placeholder="09:00 AM - 12:30 PM"
                  value={batchForm.defaultStartTime}
                  onChange={(e) => setBatchForm({ ...batchForm, defaultStartTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
