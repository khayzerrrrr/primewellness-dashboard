"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle, XCircle, Calendar, Download, Plus, ChevronLeft, ChevronRight, Users, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { collection, getDocs, query, where, orderBy, Timestamp, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getDoctors, getPatients } from "@/lib/firebase/firestore-service";
import { logActivity } from "@/lib/firebase/firestore-service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: Date;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "absent" | "late" | "leave";
  notes?: string;
}

interface Employee { id: string; displayName?: string; fullName?: string; role: string; }

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  leave: "bg-blue-100 text-blue-700",
};
const STATUS_LABELS: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak Hadir",
  late: "Terlambat",
  leave: "Cuti / Izin",
};

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function AttendancePage() {
  const { user, role } = useAuth();
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Bulk dialog
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkRows, setBulkRows] = useState<{ emp: Employee; status: string; clockIn: string; clockOut: string; notes: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const [docs] = await Promise.all([getDoctors(false)]);
      const all: Employee[] = docs.map((d: { id: string; displayName?: string; fullName?: string; specialization?: string }) => ({ id: d.id, displayName: d.displayName || d.fullName, role: "therapist" }));
      setEmployees(all);
    };
    fetchEmployees().catch(() => {});
  }, []);

  const loadDaily = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const start = new Date(dateStr); start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr); end.setHours(23, 59, 59, 999);
      const q = query(collection(db, "attendance"),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end)),
        orderBy("date", "asc")
      );
      const snap = await getDocs(q);
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() ?? new Date() })) as AttendanceRecord[]);
    } catch { setRecords([]); }
    setLoading(false);
  }, []);

  const loadMonthly = useCallback(async (month: Date) => {
    setLoading(true);
    try {
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
      const q = query(collection(db, "attendance"),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end)),
        orderBy("date", "asc")
      );
      const snap = await getDocs(q);
      setMonthlyRecords(snap.docs.map((d) => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() ?? new Date() })) as AttendanceRecord[]);
    } catch { setMonthlyRecords([]); }
    setLoading(false);
  }, []);

  useEffect(() => { if (view === "daily") loadDaily(selectedDate); }, [selectedDate, view, loadDaily]);
  useEffect(() => { if (view === "monthly") loadMonthly(viewMonth); }, [viewMonth, view, loadMonthly]);

  const summary = {
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    absent: records.filter((r) => r.status === "absent").length,
    leave: records.filter((r) => r.status === "leave").length,
  };

  const openBulk = () => {
    setBulkRows(employees.map((emp) => ({ emp, status: "present", clockIn: "08:00", clockOut: "17:00", notes: "" })));
    setBulkOpen(true);
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      for (const row of bulkRows) {
        const date = new Date(bulkDate); date.setHours(12, 0, 0, 0);
        await addDoc(collection(db, "attendance"), {
          employeeId: row.emp.id,
          employeeName: row.emp.displayName || "—",
          role: row.emp.role,
          date: Timestamp.fromDate(date),
          status: row.status,
          clockIn: row.clockIn,
          clockOut: row.clockOut,
          notes: row.notes,
          createdAt: Timestamp.now(),
        });
      }
      if (user) {
        logActivity({
          userId: user.uid, userName: user.displayName || "", userRole: role || "manager",
          action: "mark_attendance", resource: "attendance",
          resourceLabel: `Absensi massal ${bulkDate} — ${bulkRows.length} karyawan`,
        });
      }
      toast.success(`Absensi ${bulkDate} berhasil disimpan`);
      setBulkOpen(false);
      loadDaily(bulkDate);
      setSelectedDate(bulkDate);
      setView("daily");
    } catch { toast.error("Gagal menyimpan absensi"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data absensi ini?")) return;
    await deleteDoc(doc(db, "attendance", id));
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success("Data absensi dihapus");
  };

  const handleExportMonthly = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = monthlyRecords.map((r) => ({
        "Tanggal": formatDate(r.date, "dd/MM/yyyy"),
        "Karyawan": r.employeeName,
        "Role": r.role,
        "Status": STATUS_LABELS[r.status] ?? r.status,
        "Masuk": r.clockIn || "—",
        "Keluar": r.clockOut || "—",
        "Keterangan": r.notes || "—",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Absensi");
      XLSX.writeFile(wb, `Absensi_${MONTHS_ID[viewMonth.getMonth()]}_${viewMonth.getFullYear()}.xlsx`);
    } catch { toast.error("Gagal export"); }
    setExporting(false);
  };

  // Monthly recap: per employee summary
  const employeeMonthly: Record<string, { name: string; role: string; present: number; late: number; absent: number; leave: number }> = {};
  monthlyRecords.forEach((r) => {
    if (!employeeMonthly[r.employeeId]) {
      employeeMonthly[r.employeeId] = { name: r.employeeName, role: r.role, present: 0, late: 0, absent: 0, leave: 0 };
    }
    const s = employeeMonthly[r.employeeId];
    if (r.status === "present") s.present++;
    else if (r.status === "late") s.late++;
    else if (r.status === "absent") s.absent++;
    else if (r.status === "leave") s.leave++;
  });
  const monthlyEmpList = Object.values(employeeMonthly);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Absensi Karyawan</h1>
          <p className="text-gray-500 text-sm">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={openBulk} size="sm" className="gap-2 bg-[#1a2744] hover:bg-[#2a3a60]">
            <Plus className="w-4 h-4" />
            Input Massal
          </Button>
          {view === "monthly" && (
            <Button onClick={handleExportMonthly} disabled={exporting} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              {exporting ? "..." : "Export Excel"}
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {[{ label: "Harian", value: "daily" }, { label: "Rekap Bulanan", value: "monthly" }].map((v) => (
          <button key={v.value} onClick={() => setView(v.value as "daily" | "monthly")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === v.value ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "daily" && (
        <>
          <div className="flex items-center gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
            <span className="text-sm text-gray-500">{records.length} karyawan tercatat</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Hadir", count: summary.present, icon: CheckCircle, color: "bg-green-100 text-green-700" },
              { label: "Terlambat", count: summary.late, icon: Clock, color: "bg-yellow-100 text-yellow-700" },
              { label: "Tidak Hadir", count: summary.absent, icon: XCircle, color: "bg-red-100 text-red-700" },
              { label: "Cuti / Izin", count: summary.leave, icon: Calendar, color: "bg-blue-100 text-blue-700" },
            ].map((s) => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-[#1a2744]">{s.count}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1a2744]">Absensi — {selectedDate}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                : records.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Belum ada data absensi untuk tanggal ini</p>
                    <p className="text-sm mt-1">Gunakan tombol &quot;Input Massal&quot; untuk mengisi absensi</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Karyawan</th>
                            <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Role</th>
                            <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Masuk</th>
                            <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Keluar</th>
                            <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Status</th>
                            <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Keterangan</th>
                            <th className="py-2.5 px-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((rec) => (
                            <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-800">{rec.employeeName}</td>
                              <td className="py-2.5 px-3 text-gray-600 capitalize text-xs">{rec.role}</td>
                              <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{rec.clockIn || "—"}</td>
                              <td className="py-2.5 px-3 text-gray-600 font-mono text-xs">{rec.clockOut || "—"}</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[rec.status]}`}>
                                  {STATUS_LABELS[rec.status]}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-500 text-xs">{rec.notes || "—"}</td>
                              <td className="py-2.5 px-3">
                                <button onClick={() => handleDelete(rec.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-2">
                      {records.map((rec) => (
                        <div key={rec.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold text-slate-800 text-sm truncate">{rec.employeeName}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[rec.status]}`}>
                                {STATUS_LABELS[rec.status]}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 capitalize">{rec.role}</p>
                            <div className="flex gap-4 mt-1">
                              <span className="text-xs text-gray-600 font-mono">Masuk: {rec.clockIn || "—"}</span>
                              <span className="text-xs text-gray-600 font-mono">Keluar: {rec.clockOut || "—"}</span>
                            </div>
                            {rec.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{rec.notes}</p>}
                          </div>
                          <button onClick={() => handleDelete(rec.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        </>
      )}

      {view === "monthly" && (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-semibold text-[#1a2744] min-w-40 text-center">
              {MONTHS_ID[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Hadir", count: monthlyRecords.filter((r) => r.status === "present").length, color: "bg-green-100 text-green-700" },
              { label: "Terlambat", count: monthlyRecords.filter((r) => r.status === "late").length, color: "bg-yellow-100 text-yellow-700" },
              { label: "Tidak Hadir", count: monthlyRecords.filter((r) => r.status === "absent").length, color: "bg-red-100 text-red-700" },
              { label: "Cuti / Izin", count: monthlyRecords.filter((r) => r.status === "leave").length, color: "bg-blue-100 text-blue-700" },
            ].map((s) => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-[#1a2744]">{loading ? "..." : s.count}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1a2744]">
                Rekap per Karyawan — {MONTHS_ID[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-32 w-full" /> : monthlyEmpList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Tidak ada data absensi bulan ini</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Karyawan</th>
                          <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Role</th>
                          <th className="text-center py-2.5 px-3 text-green-600 font-medium text-xs">Hadir</th>
                          <th className="text-center py-2.5 px-3 text-yellow-600 font-medium text-xs">Terlambat</th>
                          <th className="text-center py-2.5 px-3 text-red-600 font-medium text-xs">Absen</th>
                          <th className="text-center py-2.5 px-3 text-blue-600 font-medium text-xs">Cuti</th>
                          <th className="text-center py-2.5 px-3 text-gray-500 font-medium text-xs">Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyEmpList.map((emp) => {
                          const total = emp.present + emp.late + emp.absent + emp.leave;
                          const pct = total > 0 ? Math.round(((emp.present + emp.late) / total) * 100) : 0;
                          return (
                            <tr key={emp.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-800">{emp.name}</td>
                              <td className="py-2.5 px-3 text-gray-500 capitalize text-xs">{emp.role}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-green-700">{emp.present}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-yellow-700">{emp.late}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-red-700">{emp.absent}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-blue-700">{emp.leave}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={`text-xs font-medium ${pct >= 80 ? "text-green-700" : pct >= 60 ? "text-yellow-700" : "text-red-700"}`}>
                                    {pct}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-2">
                    {monthlyEmpList.map((emp) => {
                      const total = emp.present + emp.late + emp.absent + emp.leave;
                      const pct = total > 0 ? Math.round(((emp.present + emp.late) / total) * 100) : 0;
                      return (
                        <div key={emp.name} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{emp.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{emp.role}</p>
                            </div>
                            <span className={`text-sm font-bold ${pct >= 80 ? "text-green-700" : pct >= 60 ? "text-yellow-700" : "text-red-700"}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center">
                            <div><p className="text-xs font-bold text-green-700">{emp.present}</p><p className="text-[10px] text-gray-400">Hadir</p></div>
                            <div><p className="text-xs font-bold text-yellow-700">{emp.late}</p><p className="text-[10px] text-gray-400">Telat</p></div>
                            <div><p className="text-xs font-bold text-red-700">{emp.absent}</p><p className="text-[10px] text-gray-400">Absen</p></div>
                            <div><p className="text-xs font-bold text-blue-700">{emp.leave}</p><p className="text-[10px] text-gray-400">Cuti</p></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Bulk Input Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1a2744]">Input Absensi Massal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Tanggal:</label>
              <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
            </div>
            {bulkRows.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Tidak ada karyawan ditemukan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-2 text-xs text-gray-500">Nama</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500">Status</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500">Masuk</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500">Keluar</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, i) => (
                      <tr key={row.emp.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium text-slate-800">{row.emp.displayName || "—"}</td>
                        <td className="py-2 px-2">
                          <select value={row.status}
                            onChange={(e) => setBulkRows((prev) => prev.map((r, j) => j === i ? { ...r, status: e.target.value } : r))}
                            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#1a2744]">
                            <option value="present">Hadir</option>
                            <option value="late">Terlambat</option>
                            <option value="absent">Tidak Hadir</option>
                            <option value="leave">Cuti/Izin</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input type="time" value={row.clockIn}
                            onChange={(e) => setBulkRows((prev) => prev.map((r, j) => j === i ? { ...r, clockIn: e.target.value } : r))}
                            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none w-24" />
                        </td>
                        <td className="py-2 px-2">
                          <input type="time" value={row.clockOut}
                            onChange={(e) => setBulkRows((prev) => prev.map((r, j) => j === i ? { ...r, clockOut: e.target.value } : r))}
                            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none w-24" />
                        </td>
                        <td className="py-2 px-2">
                          <input type="text" value={row.notes} placeholder="Opsional"
                            onChange={(e) => setBulkRows((prev) => prev.map((r, j) => j === i ? { ...r, notes: e.target.value } : r))}
                            className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none w-28" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Batal</Button>
              <Button onClick={handleBulkSave} disabled={saving || bulkRows.length === 0} className="bg-[#1a2744] hover:bg-[#2a3a60]">
                {saving ? "Menyimpan..." : `Simpan (${bulkRows.length} karyawan)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
