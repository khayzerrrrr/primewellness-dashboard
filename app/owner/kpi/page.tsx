"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Users, ChevronDown, ChevronUp,
  Calendar, Clock, BookOpen, Stethoscope, Loader2,
  Medal, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { calculateKpi } from "@/lib/firebase/firestore-service";
import { ROLE_LABELS } from "@/lib/constants";
import type { KpiScore, KpiGrade } from "@/types";

const GRADE_CONFIG: Record<KpiGrade, { label: string; bg: string; text: string; border: string }> = {
  A: { label: "Sangat Baik", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  B: { label: "Baik",        bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-300" },
  C: { label: "Cukup",       bg: "bg-yellow-100",  text: "text-yellow-700",  border: "border-yellow-300" },
  D: { label: "Kurang",      bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-300" },
  E: { label: "Buruk",       bg: "bg-red-100",      text: "text-red-700",     border: "border-red-300" },
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right">{value}</span>
    </div>
  );
}

function KpiCard({ kpi, rank }: { kpi: KpiScore; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const grade = GRADE_CONFIG[kpi.grade];

  return (
    <Card className={`border-0 shadow-sm overflow-hidden transition-all duration-200`}>
      <div className={`h-1 ${
        kpi.grade === "A" ? "bg-emerald-400" :
        kpi.grade === "B" ? "bg-blue-400" :
        kpi.grade === "C" ? "bg-yellow-400" :
        kpi.grade === "D" ? "bg-orange-400" : "bg-red-400"
      }`} />
      <CardContent className="p-4">
        {/* Top row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Rank */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            rank === 1 ? "bg-yellow-400 text-white" :
            rank === 2 ? "bg-gray-300 text-gray-700" :
            rank === 3 ? "bg-amber-600 text-white" :
            "bg-gray-100 text-gray-500"
          }`}>
            {rank <= 3 ? <Medal className="w-4 h-4" /> : rank}
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 truncate">{kpi.userName}</p>
            <p className="text-xs text-gray-400">{ROLE_LABELS[kpi.role] ?? kpi.role}</p>
          </div>

          {/* Grade badge */}
          <div className={`px-3 py-1 rounded-full border text-sm font-bold ${grade.bg} ${grade.text} ${grade.border}`}>
            {kpi.grade} <span className="font-normal text-xs">· {kpi.totalScore}</span>
          </div>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Score bars summary */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="w-28">Kehadiran (30%)</span>
            <ScoreBar value={kpi.attendanceScore} color="bg-[#2563EB]" />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="w-28">{kpi.role === "therapist" ? "Sesi (35%)" : "Kinerja (35%)"}</span>
            <ScoreBar value={kpi.sessionScore} color="bg-blue-400" />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="w-28">Kepatuhan SOP (20%)</span>
            <ScoreBar value={kpi.sopScore} color="bg-purple-400" />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="w-28">Ketepatan Waktu (15%)</span>
            <ScoreBar value={kpi.punctualityScore} color="bg-orange-400" />
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#1B3A6B]">{kpi.presentDays}</p>
              <p className="text-xs text-gray-500">Hari Hadir</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{kpi.lateDays}</p>
              <p className="text-xs text-gray-500">Terlambat</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{kpi.absentDays}</p>
              <p className="text-xs text-gray-500">Absen</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{kpi.leaveDays}</p>
              <p className="text-xs text-gray-500">Izin/Cuti</p>
            </div>

            {kpi.role === "therapist" && (
              <>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{kpi.completedSessions}</p>
                  <p className="text-xs text-gray-500">Sesi Selesai</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{kpi.cancelledSessions}</p>
                  <p className="text-xs text-gray-500">Sesi Batal</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{kpi.totalSessions}</p>
                  <p className="text-xs text-gray-500">Total Sesi</p>
                </div>
              </>
            )}

            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{kpi.acknowledgedSops}/{kpi.totalSops}</p>
              <p className="text-xs text-gray-500">SOP Dibaca</p>
            </div>

            {/* Insights */}
            <div className="col-span-2 md:col-span-4 space-y-2 mt-1">
              {kpi.absentDays > 3 && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Absen melebihi batas wajar ({kpi.absentDays} hari). Perlu evaluasi.</span>
                </div>
              )}
              {kpi.sopScore < 60 && (
                <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg p-2">
                  <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Kepatuhan SOP rendah. Hanya {kpi.acknowledgedSops} dari {kpi.totalSops} SOP telah dibaca.</span>
                </div>
              )}
              {kpi.role === "therapist" && kpi.totalSessions > 0 && kpi.sessionScore < 70 && (
                <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Tingkat penyelesaian sesi rendah. {kpi.cancelledSessions} sesi dibatalkan.</span>
                </div>
              )}
              {kpi.totalScore >= 90 && (
                <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Performa sangat baik! Karyawan ini layak mendapat apresiasi.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KpiPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [kpiData, setKpiData] = useState<KpiScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await calculateKpi(year, month);
      // Sort by totalScore desc
      data.sort((a, b) => b.totalScore - a.totalScore);
      setKpiData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]);

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const filtered = roleFilter === "all" ? kpiData : kpiData.filter((k) => k.role === roleFilter);

  const avgScore = kpiData.length > 0
    ? Math.round(kpiData.reduce((s, k) => s + k.totalScore, 0) / kpiData.length)
    : 0;

  const gradeCounts = kpiData.reduce<Record<KpiGrade, number>>(
    (acc, k) => { acc[k.grade] = (acc[k.grade] || 0) + 1; return acc; },
    { A: 0, B: 0, C: 0, D: 0, E: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">KPI Karyawan</h1>
          <p className="text-gray-500 text-sm">Penilaian kinerja berbasis kehadiran, sesi, SOP, dan ketepatan waktu</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {MONTH_NAMES.map((n, i) => (
              <option key={i} value={i + 1}>{n}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={load} variant="outline" size="sm" disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            Hitung KPI
          </Button>
        </div>
      </div>

      {/* Algorithm info */}
      <div className="bg-[#0A1628]/5 border border-[#0A1628]/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-[#0A1628] mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Algoritma Penilaian KPI
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Kehadiran", weight: "30%", desc: "Hadir penuh + 50% terlambat", color: "bg-[#2563EB]" },
            { label: "Kinerja/Sesi", weight: "35%", desc: "Terapis: completion rate sesi", color: "bg-blue-500" },
            { label: "Kepatuhan SOP", weight: "20%", desc: "Persentase SOP yang dibaca", color: "bg-purple-500" },
            { label: "Ketepatan Waktu", weight: "15%", desc: "Rasio hadir vs terlambat", color: "bg-orange-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.color}`} />
              <div>
                <p className="text-xs font-semibold text-slate-700">{item.label} <span className="text-[#0A1628] font-bold">{item.weight}</span></p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {!loading && kpiData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 bg-[#0A1628] rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">{avgScore}</p>
            <p className="text-xs text-white/60 mt-0.5">Rata-rata Skor Tim</p>
            <p className="text-xs font-semibold mt-1 text-blue-300">
              {avgScore >= 90 ? "Tim sangat solid!" : avgScore >= 80 ? "Tim berjalan baik" : avgScore >= 70 ? "Perlu peningkatan" : "Butuh evaluasi segera"}
            </p>
          </div>
          {(["A", "B", "C", "D", "E"] as KpiGrade[]).map((g) => (
            <div key={g} className={`rounded-xl p-4 ${GRADE_CONFIG[g].bg}`}>
              <p className={`text-2xl font-bold ${GRADE_CONFIG[g].text}`}>{gradeCounts[g]}</p>
              <p className={`text-xs font-semibold ${GRADE_CONFIG[g].text}`}>Grade {g}</p>
              <p className="text-xs text-gray-500">{GRADE_CONFIG[g].label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter by role */}
      {!loading && kpiData.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {["all", "therapist", "front_office", "manager", "super_admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                roleFilter === r
                  ? "bg-[#0A1628] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r === "all" ? `Semua (${kpiData.length})` : `${ROLE_LABELS[r] ?? r} (${kpiData.filter((k) => k.role === r).length})`}
            </button>
          ))}
        </div>
      )}

      {/* KPI List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {kpiData.length === 0
              ? "Belum ada data karyawan aktif"
              : "Tidak ada karyawan dengan role ini"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Pastikan data absensi sudah diisi untuk periode ini
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((kpi, idx) => (
            <KpiCard
              key={kpi.userId}
              kpi={kpi}
              rank={kpiData.indexOf(kpi) + 1}
            />
          ))}
        </div>
      )}

      {/* Grade legend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Keterangan Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(["A", "B", "C", "D", "E"] as KpiGrade[]).map((g) => (
              <div key={g} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${GRADE_CONFIG[g].bg}`}>
                <span className={`font-bold ${GRADE_CONFIG[g].text}`}>{g}</span>
                <span className={`text-xs ${GRADE_CONFIG[g].text}`}>
                  {g === "A" ? "≥ 90" : g === "B" ? "80–89" : g === "C" ? "70–79" : g === "D" ? "60–69" : "< 60"} — {GRADE_CONFIG[g].label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
