"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Users, DollarSign, Calendar, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { getInvoices, getPatients, getDoctors, getBranches } from "@/lib/firebase/firestore-service";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Branch } from "@/types";
import type { Invoice } from "@/types";

const COLORS = ["#0A1628", "#1B3A6B", "#2563EB", "#0d9488", "#f59e0b", "#8b5cf6", "#ef4444"];

function getInvDate(inv: Invoice): Date | null {
  const d = (inv.date as unknown as { toDate?: () => Date })?.toDate?.() ?? inv.date as Date;
  return d instanceof Date ? d : null;
}

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const PERIOD_OPTIONS = [
  { label: "7 Hari", value: "week" },
  { label: "Bulan Ini", value: "month" },
  { label: "3 Bulan", value: "3months" },
  { label: "Tahun Ini", value: "year" },
];

export default function OwnerAnalyticsPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalTherapists, setTotalTherapists] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "3months" | "year">("month");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [invs, pts, docs, brs] = await Promise.all([
          getInvoices(),
          getPatients(),
          getDoctors(false),
          getBranches(),
        ]);
        setAllInvoices(invs as Invoice[]);
        setInvoices(invs as Invoice[]);
        setTotalPatients(pts.length);
        setTotalTherapists(docs.length);
        setBranches(brs as Branch[]);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (selectedBranch === "all") {
      setInvoices(allInvoices);
    } else {
      setInvoices(allInvoices.filter(i => (i as unknown as { branchId?: string }).branchId === selectedBranch));
    }
  }, [selectedBranch, allInvoices]);

  const now = new Date();
  const paidInvoices = invoices.filter((i) => i.status === "paid");

  const filterByPeriod = useCallback((invs: Invoice[]) => {
    return invs.filter((i) => {
      const d = getInvDate(i);
      if (!d) return false;
      if (period === "week") { const ago = new Date(); ago.setDate(ago.getDate() - 7); return d >= ago; }
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === "3months") { const ago = new Date(); ago.setMonth(ago.getMonth() - 3); return d >= ago; }
      return d.getFullYear() === now.getFullYear();
    });
  }, [period]);

  const periodInvoices = filterByPeriod(paidInvoices);
  const periodRevenue = periodInvoices.reduce((s, i) => s + i.total, 0);
  const avgTransaction = periodInvoices.length > 0 ? Math.round(periodRevenue / periodInvoices.length) : 0;

  // 1. Line chart: Patient trend per month (6 months)
  const patientTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = `${MONTHS_ID[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
    const count = paidInvoices.filter((inv) => {
      const id = getInvDate(inv);
      return id && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
    }).length;
    return { name: label, pasien: count };
  });

  // 2. Bar chart: Revenue per month
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = `${MONTHS_ID[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
    const rev = paidInvoices.filter((inv) => {
      const id = getInvDate(inv);
      return id && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
    }).reduce((s, inv) => s + inv.total, 0);
    return { name: label, pendapatan: rev };
  });

  // 3. Pie chart: Top services
  const serviceMap: Record<string, number> = {};
  periodInvoices.forEach((i) => {
    const s = i.serviceName || "Lainnya";
    serviceMap[s] = (serviceMap[s] || 0) + 1;
  });
  const serviceData = Object.entries(serviceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // 4. Bar chart: Busy hours (time slots)
  const timeMap: Record<string, number> = {};
  periodInvoices.forEach((i) => {
    const slot = (i as unknown as { timeSlot?: string }).timeSlot;
    if (slot) {
      const hour = slot.split(":")[0];
      const key = `${hour}:00`;
      timeMap[key] = (timeMap[key] || 0) + 1;
    }
  });
  const timeData = Object.entries(timeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const fmt = (v: number) => `Rp ${(v / 1000).toFixed(0)}k`;

  const kpiCards = [
    { label: "Total Pendapatan", value: loading ? "—" : formatCurrency(periodRevenue), icon: DollarSign, color: "bg-green-100 text-green-700", sub: "periode terpilih" },
    { label: "Transaksi Lunas", value: loading ? "—" : String(periodInvoices.length), icon: Calendar, color: "bg-blue-100 text-blue-700", sub: "periode terpilih" },
    { label: "Total Pasien", value: loading ? "—" : String(totalPatients), icon: Users, color: "bg-purple-100 text-purple-700", sub: "terdaftar" },
    { label: "Total Terapis", value: loading ? "—" : String(totalTherapists), icon: Activity, color: "bg-orange-100 text-orange-700", sub: "terdaftar" },
    { label: "Rata-rata Transaksi", value: loading ? "—" : formatCurrency(avgTransaction), icon: TrendingUp, color: "bg-teal-100 text-teal-700", sub: "per transaksi" },
    { label: "Layanan Berbeda", value: loading ? "—" : String(serviceData.length), icon: BarChart3, color: "bg-pink-100 text-pink-700", sub: "periode terpilih" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm">Analisis mendalam kinerja klinik Prime Wellness</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Branch filter */}
          {branches.length > 0 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          {/* Period filter */}
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as typeof period)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p.value ? "bg-[#0A1628] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${k.color}`}>
                <k.icon className="w-4 h-4" />
              </div>
              {loading ? <Skeleton className="h-6 w-20 mb-1" /> : (
                <p className="text-lg font-bold text-[#0A1628] leading-tight">{k.value}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{k.label}</p>
              <p className="text-xs text-gray-400">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart: Patient trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Tren Pasien 6 Bulan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : patientTrend.every((d) => d.pasien === 0) ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={patientTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pasien" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} name="Pasien" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar chart: Revenue per month */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Revenue 6 Bulan Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : revenueTrend.every((d) => d.pendapatan === 0) ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={revenueTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} width={56} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="pendapatan" fill="#1B3A6B" radius={[4, 4, 0, 0]} name="Pendapatan" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart: Top services */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Layanan Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : serviceData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                      {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} sesi`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-1 mt-1">
                  {serviceData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate text-gray-600 flex-1">{s.name}</span>
                      <span className="font-semibold text-slate-700">{s.value} sesi</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar chart: Busy hours */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Jam Tersibuk</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52 w-full" /> : timeData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Belum ada data slot waktu</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={timeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => `${v} sesi`} />
                  <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} name="Jumlah Sesi" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#0A1628]">
            Ringkasan Periode ({periodInvoices.length} transaksi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-32 w-full" /> : periodInvoices.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Belum ada data untuk periode ini</p>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Pasien</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Layanan</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Terapis</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodInvoices.slice(0, 20).map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-slate-800 text-sm">{inv.patientName}</td>
                        <td className="py-2 px-3 text-gray-600 text-xs">{inv.serviceName || "—"}</td>
                        <td className="py-2 px-3 text-gray-600 text-xs">{inv.therapistName || "—"}</td>
                        <td className="py-2 px-3 text-right font-semibold text-green-700 text-sm">{formatCurrency(inv.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0A1628] text-white">
                      <td colSpan={3} className="py-2 px-3 font-semibold text-sm">Total ({periodInvoices.length} transaksi)</td>
                      <td className="py-2 px-3 text-right font-bold">{formatCurrency(periodRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Mobile */}
              <div className="md:hidden space-y-2">
                {periodInvoices.slice(0, 10).map((inv) => (
                  <div key={inv.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{inv.patientName}</p>
                      <p className="text-xs text-gray-500 truncate">{inv.serviceName || "—"}</p>
                    </div>
                    <p className="font-bold text-green-700 text-sm flex-shrink-0">{formatCurrency(inv.total)}</p>
                  </div>
                ))}
                <div className="bg-[#0A1628] text-white rounded-xl p-3 flex justify-between items-center">
                  <p className="font-semibold text-sm">Total ({periodInvoices.length})</p>
                  <p className="font-bold">{formatCurrency(periodRevenue)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
