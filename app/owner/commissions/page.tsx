"use client";

import { useEffect, useState } from "react";
import { Wallet, CheckCircle, Clock, TrendingUp, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCommissions, getDoctors, markCommissionsPaid } from "@/lib/firebase/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Commission, Doctor } from "@/types";

export default function CommissionsPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [therapists, setTherapists] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTherapist, setFilterTherapist] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [period, setPeriod] = useState<"month" | "all">("month");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    const [comms, docs] = await Promise.all([getCommissions(), getDoctors(false)]);
    setCommissions(comms);
    setTherapists(docs as Doctor[]);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const now = new Date();

  const filtered = commissions.filter((c) => {
    const d = c.sessionDate instanceof Date
      ? c.sessionDate
      : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();

    const matchPeriod = period === "all" || (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
    const matchTherapist = filterTherapist === "all" || c.therapistId === filterTherapist;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchSearch = !search || c.therapistName.toLowerCase().includes(search.toLowerCase()) || c.patientName.toLowerCase().includes(search.toLowerCase());
    return matchPeriod && matchTherapist && matchStatus && matchSearch;
  });

  // Summary by therapist
  const byTherapist = therapists.map((t) => {
    const tComms = commissions.filter((c) => c.therapistId === t.id);
    const pending = tComms.filter((c) => c.status === "pending");
    const thisMonth = pending.filter((c) => {
      const d = c.sessionDate instanceof Date ? c.sessionDate : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      therapist: t,
      totalSessions: tComms.length,
      pendingAmount: pending.reduce((s, c) => s + c.commissionAmount, 0),
      monthlyAmount: thisMonth.reduce((s, c) => s + c.commissionAmount, 0),
      pendingIds: pending.map((c) => c.id),
    };
  }).filter((t) => t.totalSessions > 0);

  const totalPending = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);
  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commissionAmount, 0);

  const handleSelectAll = () => {
    const pendingFiltered = filtered.filter((c) => c.status === "pending");
    if (selectedIds.size === pendingFiltered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFiltered.map((c) => c.id)));
    }
  };

  const handlePaySelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tandai ${selectedIds.size} komisi sebagai sudah dibayar?`)) return;
    setPaying(true);
    try {
      await markCommissionsPaid(Array.from(selectedIds), user?.uid ?? "");
      toast.success(`${selectedIds.size} komisi ditandai lunas`);
      setSelectedIds(new Set());
      await load();
    } catch {
      toast.error("Gagal memperbarui status komisi");
    }
    setPaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Komisi Terapis</h1>
          <p className="text-gray-500 text-sm">Rekap dan pembayaran insentif terapis</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </div>

      {/* Total Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm mb-1">Belum Dibayarkan</p>
          {loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : (
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
          )}
          <p className="text-white/60 text-xs mt-1">
            {commissions.filter((c) => c.status === "pending").length} sesi pending
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm mb-1">Sudah Dibayarkan</p>
          {loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : (
            <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          )}
          <p className="text-white/60 text-xs mt-1">
            {commissions.filter((c) => c.status === "paid").length} sesi
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#1a2744] to-[#2a3a60] rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm mb-1">Total All-Time</p>
          {loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : (
            <p className="text-2xl font-bold">{formatCurrency(totalPending + totalPaid)}</p>
          )}
          <p className="text-white/60 text-xs mt-1">{commissions.length} sesi total</p>
        </div>
      </div>

      {/* Summary by therapist */}
      {byTherapist.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2744]">Ringkasan per Terapis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byTherapist.map(({ therapist, pendingAmount, monthlyAmount, pendingIds, totalSessions }) => (
                <div key={therapist.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-[#1a2744] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{(therapist.fullName ?? "?").charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{therapist.fullName}</p>
                    <p className="text-xs text-gray-500">{totalSessions} total sesi · Bulan ini: {formatCurrency(monthlyAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600 text-sm">{formatCurrency(pendingAmount)}</p>
                    <p className="text-xs text-gray-400">belum dibayar</p>
                  </div>
                  {pendingIds.length > 0 && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                      onClick={async () => {
                        if (!confirm(`Bayar komisi ${therapist.fullName}?`)) return;
                        setPaying(true);
                        await markCommissionsPaid(pendingIds, user?.uid ?? "");
                        toast.success(`Komisi ${therapist.fullName} ditandai lunas`);
                        await load();
                        setPaying(false);
                      }}
                      disabled={paying}
                    >
                      Bayar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Bulk Pay */}
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari terapis / pasien..."
              className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
          </div>
          <select value={filterTherapist} onChange={(e) => setFilterTherapist(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Terapis</option>
            {therapists.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Semua Status</option>
            <option value="pending">Belum Dibayar</option>
            <option value="paid">Sudah Dibayar</option>
          </select>
          <div className="flex gap-1">
            {(["month", "all"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? "bg-[#1a2744] text-white" : "bg-gray-100 text-gray-600"}`}>
                {p === "month" ? "Bulan Ini" : "Semua"}
              </button>
            ))}
          </div>
        </div>
        {selectedIds.size > 0 && (
          <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={handlePaySelected} disabled={paying}>
            <CheckCircle className="w-4 h-4" />
            Bayar {selectedIds.size} Komisi Terpilih
          </Button>
        )}
      </div>

      {/* Commission Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#1a2744]">
            Detail Komisi ({filtered.length})
          </CardTitle>
          {filtered.some((c) => c.status === "pending") && (
            <button onClick={handleSelectAll} className="text-xs text-[#1a2744] hover:underline">
              {selectedIds.size > 0 ? "Batal Pilih Semua" : "Pilih Semua Pending"}
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Belum ada data komisi</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="py-3 px-4 w-8"></th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Tanggal</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Terapis</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Pasien</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Layanan</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Harga</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Rate</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Komisi</th>
                      <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const d = c.sessionDate instanceof Date
                        ? c.sessionDate
                        : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
                      const isSelected = selectedIds.has(c.id);
                      return (
                        <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isSelected ? "bg-orange-50" : ""}`}>
                          <td className="py-3 px-4">
                            {c.status === "pending" && (
                              <input type="checkbox" checked={isSelected}
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  e.target.checked ? next.add(c.id) : next.delete(c.id);
                                  setSelectedIds(next);
                                }}
                                className="rounded" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(d, "dd MMM yyyy")}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{c.therapistName}</td>
                          <td className="py-3 px-4 text-gray-600">{c.patientName}</td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{c.serviceName}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(c.servicePrice)}</td>
                          <td className="py-3 px-4 text-right text-gray-500">{c.commissionRate}%</td>
                          <td className="py-3 px-4 text-right font-bold text-green-700">{formatCurrency(c.commissionAmount)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              c.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {c.status === "paid" ? "Dibayar" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((c) => {
                  const d = c.sessionDate instanceof Date
                    ? c.sessionDate
                    : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <div key={c.id} className={`p-3 ${isSelected ? "bg-orange-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {c.status === "pending" && (
                            <input type="checkbox" checked={isSelected}
                              onChange={(e) => {
                                const next = new Set(selectedIds);
                                e.target.checked ? next.add(c.id) : next.delete(c.id);
                                setSelectedIds(next);
                              }}
                              className="rounded flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{c.therapistName}</p>
                            <p className="text-xs text-gray-500 truncate">{c.patientName} · {c.serviceName}</p>
                            <p className="text-xs text-gray-400">{formatDate(d, "dd MMM yyyy")} · {c.commissionRate}%</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-700 text-sm">{formatCurrency(c.commissionAmount)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {c.status === "paid" ? "Dibayar" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
