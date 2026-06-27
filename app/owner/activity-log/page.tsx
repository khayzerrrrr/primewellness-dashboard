"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity, Search, Filter, RefreshCw, Loader2, User,
  LogIn, LogOut, Calendar, Receipt, FileText, Settings,
  UserPlus, Trash2, Pencil, CheckCircle2, BookOpen,
  Clock, Building2, TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getActivityLogs } from "@/lib/firebase/firestore-service";
import { ROLE_LABELS } from "@/lib/constants";
import type { AuditLog, AuditAction } from "@/types";

// ── Icon + color per action ────────────────────────────────────────────────
const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  login:               { icon: LogIn,        color: "bg-green-100 text-green-600",   label: "Login" },
  logout:              { icon: LogOut,       color: "bg-gray-100 text-gray-500",     label: "Logout" },
  create_appointment:  { icon: Calendar,     color: "bg-blue-100 text-blue-600",     label: "Buat Appointment" },
  update_appointment:  { icon: Pencil,       color: "bg-blue-50 text-blue-500",      label: "Update Appointment" },
  cancel_appointment:  { icon: Trash2,       color: "bg-red-100 text-red-500",       label: "Batalkan Appointment" },
  complete_appointment:{ icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600", label: "Selesaikan Sesi" },
  create_invoice:      { icon: Receipt,      color: "bg-yellow-100 text-yellow-600", label: "Buat Invoice" },
  update_invoice:      { icon: Pencil,       color: "bg-yellow-50 text-yellow-500",  label: "Update Invoice" },
  confirm_payment:     { icon: CheckCircle2, color: "bg-emerald-100 text-emerald-600", label: "Konfirmasi Pembayaran" },
  create_patient:      { icon: UserPlus,     color: "bg-purple-100 text-purple-600", label: "Daftar Pasien" },
  update_patient:      { icon: Pencil,       color: "bg-purple-50 text-purple-500",  label: "Update Pasien" },
  create_service:      { icon: Settings,     color: "bg-teal-100 text-teal-600",     label: "Tambah Layanan" },
  update_service:      { icon: Pencil,       color: "bg-teal-50 text-teal-500",      label: "Update Layanan" },
  delete_service:      { icon: Trash2,       color: "bg-red-100 text-red-500",       label: "Hapus Layanan" },
  create_sop:          { icon: FileText,     color: "bg-indigo-100 text-indigo-600", label: "Buat SOP" },
  update_sop:          { icon: Pencil,       color: "bg-indigo-50 text-indigo-500",  label: "Update SOP" },
  delete_sop:          { icon: Trash2,       color: "bg-red-100 text-red-500",       label: "Hapus SOP" },
  acknowledge_sop:     { icon: BookOpen,     color: "bg-indigo-100 text-indigo-600", label: "Konfirmasi SOP" },
  mark_attendance:     { icon: Clock,        color: "bg-orange-100 text-orange-600", label: "Catat Absensi" },
  update_attendance:   { icon: Pencil,       color: "bg-orange-50 text-orange-500",  label: "Update Absensi" },
  pay_commission:      { icon: TrendingUp,   color: "bg-green-100 text-green-600",   label: "Bayar Komisi" },
  create_commission:   { icon: TrendingUp,   color: "bg-green-50 text-green-500",    label: "Catat Komisi" },
  create_branch:       { icon: Building2,    color: "bg-slate-100 text-slate-600",   label: "Tambah Cabang" },
  update_branch:       { icon: Pencil,       color: "bg-slate-50 text-slate-500",    label: "Update Cabang" },
  delete_branch:       { icon: Trash2,       color: "bg-red-100 text-red-500",       label: "Hapus Cabang" },
  create_account:      { icon: UserPlus,     color: "bg-purple-100 text-purple-600", label: "Buat Akun" },
  update_account:      { icon: Pencil,       color: "bg-purple-50 text-purple-500",  label: "Update Akun" },
  deactivate_account:  { icon: Trash2,       color: "bg-red-100 text-red-500",       label: "Nonaktifkan Akun" },
  update_settings:     { icon: Settings,     color: "bg-gray-100 text-gray-600",     label: "Update Pengaturan" },
  other:               { icon: Activity,     color: "bg-gray-100 text-gray-500",     label: "Aktivitas Lain" },
};

const DEFAULT_META = { icon: Activity, color: "bg-gray-100 text-gray-500", label: "Aktivitas" };

const RESOURCE_LABELS: Record<string, string> = {
  auth: "Autentikasi",
  appointment: "Appointment",
  invoice: "Invoice",
  patient: "Pasien",
  service: "Layanan",
  sop: "SOP",
  attendance: "Absensi",
  commission: "Komisi",
  branch: "Cabang",
  account: "Akun",
  settings: "Pengaturan",
};

function formatDateTime(d: AuditLog["createdAt"]) {
  const date = d instanceof Date ? d
    : typeof d === "object" && "toDate" in d ? (d as { toDate(): Date }).toDate()
    : new Date();
  return {
    date: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    relative: relativeTime(date),
  };
}

function relativeTime(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return `${Math.floor(diff / 604800)} minggu lalu`;
}

function groupByDate(logs: AuditLog[]) {
  const groups: Record<string, AuditLog[]> = {};
  for (const log of logs) {
    const d = log.createdAt instanceof Date ? log.createdAt
      : typeof log.createdAt === "object" && "toDate" in log.createdAt
        ? (log.createdAt as { toDate(): Date }).toDate()
        : new Date();
    const key = d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }
  return groups;
}

const ROLES = ["all", "therapist", "front_office", "manager", "super_admin", "owner"];
const RESOURCES = ["all", "auth", "appointment", "invoice", "patient", "service", "sop", "attendance", "commission", "branch", "account"];

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [limitCount, setLimitCount] = useState(100);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs({
        limitCount,
        fromDate: dateFrom ? new Date(dateFrom) : undefined,
        toDate: dateTo ? new Date(dateTo + "T23:59:59") : undefined,
      });
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [limitCount, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((log) => {
    const meta = ACTION_META[log.action] ?? DEFAULT_META;
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      log.userName?.toLowerCase().includes(searchLower) ||
      meta.label.toLowerCase().includes(searchLower) ||
      log.resourceLabel?.toLowerCase().includes(searchLower) ||
      log.action.includes(searchLower);
    const matchRole = roleFilter === "all" || log.userRole === roleFilter;
    const matchResource = resourceFilter === "all" || log.resource === resourceFilter;
    return matchSearch && matchRole && matchResource;
  });

  const grouped = groupByDate(filtered);
  const totalToday = logs.filter((l) => {
    const d = l.createdAt instanceof Date ? l.createdAt
      : typeof l.createdAt === "object" && "toDate" in l.createdAt
        ? (l.createdAt as { toDate(): Date }).toDate() : new Date();
    return d.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Log Aktivitas Karyawan</h1>
          <p className="text-gray-500 text-sm">Rekam jejak semua aksi yang dilakukan staf</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Log", value: logs.length, color: "bg-[#1a2744] text-white" },
          { label: "Hari Ini", value: totalToday, color: "bg-teal-50 text-teal-700" },
          { label: "Ditampilkan", value: filtered.length, color: "bg-blue-50 text-blue-700" },
          { label: "Staff Aktif", value: new Set(logs.map((l) => l.userId)).size, color: "bg-purple-50 text-purple-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari nama, aksi, atau resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
          {(roleFilter !== "all" || resourceFilter !== "all" || dateFrom || dateTo) && (
            <span className="w-2 h-2 bg-teal-500 rounded-full" />
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r === "all" ? "Semua Role" : ROLE_LABELS[r] ?? r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Resource</label>
                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {RESOURCES.map((r) => (
                    <option key={r} value={r}>{r === "all" ? "Semua Resource" : RESOURCE_LABELS[r] ?? r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Dari Tanggal</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Sampai Tanggal</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((n) => (
                  <button
                    key={n}
                    onClick={() => setLimitCount(n)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      limitCount === n ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {n} log
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setRoleFilter("all"); setResourceFilter("all"); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-red-500 hover:underline"
              >
                Reset filter
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada log aktivitas</p>
          <p className="text-gray-400 text-sm mt-1">
            Log akan muncul otomatis saat karyawan melakukan aksi di sistem
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{date}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-1.5">
                {dateLogs.map((log) => {
                  const meta = ACTION_META[log.action] ?? DEFAULT_META;
                  const Icon = meta.icon;
                  const dt = formatDateTime(log.createdAt);
                  const isExpanded = expandedId === log.id;
                  const hasDetails = log.details && Object.keys(log.details).length > 0;

                  return (
                    <div
                      key={log.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div
                        className={`flex items-center gap-3 px-4 py-3 ${hasDetails ? "cursor-pointer hover:bg-gray-50" : ""}`}
                        onClick={() => hasDetails && setExpandedId(isExpanded ? null : log.id)}
                      >
                        {/* Action icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm">{log.userName || "—"}</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {ROLE_LABELS[log.userRole] ?? log.userRole}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-medium text-slate-600">{meta.label}</span>
                            {log.resourceLabel && (
                              <span className="text-gray-400"> · {log.resourceLabel}</span>
                            )}
                          </p>
                        </div>

                        {/* Time */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-slate-600">{dt.time}</p>
                          <p className="text-xs text-gray-400">{dt.relative}</p>
                        </div>

                        {/* Expand toggle */}
                        {hasDetails && (
                          <div className="text-gray-400 ml-1">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        )}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && hasDetails && (
                        <div className="px-4 pb-3 border-t border-gray-50">
                          <div className="bg-gray-50 rounded-lg p-3 mt-2">
                            <p className="text-xs font-semibold text-gray-400 mb-2">Detail</p>
                            <div className="space-y-1">
                              {Object.entries(log.details!).map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-xs">
                                  <span className="text-gray-400 font-medium min-w-24">{k}</span>
                                  <span className="text-slate-600">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length >= limitCount && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setLimitCount((n) => n + 100)}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Muat 100 log berikutnya
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
