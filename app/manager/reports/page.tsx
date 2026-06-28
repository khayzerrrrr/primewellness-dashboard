"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, TrendingUp, Download, DollarSign, Users, FileText, Stethoscope, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInvoices, getPatients, getDoctors } from "@/lib/firebase/firestore-service";
import type { Invoice } from "@/types";

const COLORS = ["#0A1628", "#0d9488", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

function getDate(inv: Invoice): Date | null {
  const d = (inv.date as unknown as { toDate?: () => Date })?.toDate?.() ?? inv.date as Date;
  return d instanceof Date ? d : null;
}

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalTherapists, setTotalTherapists] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  useEffect(() => {
    const load = async () => {
      const [invs, patients, docs] = await Promise.all([getInvoices(), getPatients(), getDoctors(false)]);
      setInvoices(invs as Invoice[]);
      setTotalPatients(patients.length);
      setTotalTherapists(docs.length);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const paidInvoices = invoices.filter((i) => i.status === "paid");

  const filterByPeriod = useCallback((invs: Invoice[]) => {
    return invs.filter((i) => {
      const d = getDate(i);
      if (!d) return false;
      if (period === "week") { const ago = new Date(); ago.setDate(ago.getDate() - 7); return d >= ago; }
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }, [period]);

  const periodInvoices = filterByPeriod(paidInvoices);
  const periodRevenue = periodInvoices.reduce((s, i) => s + i.total, 0);
  const allTimeRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);
  const avgTransaction = periodInvoices.length > 0 ? Math.round(periodRevenue / periodInvoices.length) : 0;

  // Revenue bar chart data
  const dailyMap: Record<string, number> = {};
  periodInvoices.forEach((i) => {
    const d = getDate(i);
    if (d) {
      const k = period === "year"
        ? d.toLocaleDateString("id-ID", { month: "short" })
        : formatDate(d, "dd MMM");
      dailyMap[k] = (dailyMap[k] || 0) + i.total;
    }
  });
  const revenueChartData = Object.entries(dailyMap).map(([name, value]) => ({ name, value }));

  // Service pie chart
  const serviceMap: Record<string, number> = {};
  periodInvoices.forEach((i) => {
    const s = i.serviceName || "Lainnya";
    serviceMap[s] = (serviceMap[s] || 0) + i.total;
  });
  const serviceData = Object.entries(serviceMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Monthly trend (last 6 months)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    const rev = paidInvoices.filter((inv) => {
      const id = getDate(inv);
      return id && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
    }).reduce((s, inv) => s + inv.total, 0);
    return { name: label, pendapatan: rev };
  });

  // Export Excel
  const handleExport = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = periodInvoices.map((inv) => {
        const d = getDate(inv);
        return {
          "Tanggal": d ? formatDate(d, "dd/MM/yyyy") : "—",
          "No Invoice": inv.invoiceNumber,
          "Pasien": inv.patientName,
          "Layanan": inv.serviceName || "—",
          "Terapis": inv.therapistName || "—",
          "Subtotal": inv.subtotal,
          "Diskon": inv.discount,
          "Total": inv.total,
          "Metode Bayar": inv.paymentMethod || "—",
          "Status": inv.status,
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      const periodLabel = period === "week" ? "7Hari" : period === "month"
        ? now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).replace(" ", "_")
        : now.getFullYear().toString();
      XLSX.writeFile(wb, `Laporan_PrimeWellness_${periodLabel}.xlsx`);
    } catch { /* ignore */ }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(10, 22, 40);
      doc.text("Laporan Keuangan Prime Wellness", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const periodLabel = period === "week" ? "7 Hari Terakhir" : period === "month" ? `${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}` : String(now.getFullYear());
      doc.text(`Periode: ${periodLabel}`, 14, 32);
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`Total Pendapatan: ${formatCurrency(periodRevenue)}`, 14, 44);
      doc.text(`Total Transaksi: ${periodInvoices.length}`, 14, 52);
      doc.text(`Rata-rata Transaksi: ${formatCurrency(avgTransaction)}`, 14, 60);
      doc.text(`Total Pasien: ${totalPatients}`, 14, 68);
      doc.text(`Total Terapis: ${totalTherapists}`, 14, 76);
      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 82, 196, 82);
      // Table header
      let y = 90;
      doc.setFontSize(10);
      doc.setTextColor(10, 22, 40);
      doc.text("Daftar Transaksi", 14, y);
      y += 7;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("No", 14, y);
      doc.text("Tanggal", 24, y);
      doc.text("Pasien", 58, y);
      doc.text("Layanan", 100, y);
      doc.text("Total", 168, y);
      y += 4;
      doc.line(14, y, 196, y);
      y += 4;
      doc.setTextColor(30, 30, 30);
      periodInvoices.slice(0, 35).forEach((inv, i) => {
        const d = getDate(inv);
        const dateStr = d ? formatDate(d, "dd/MM/yy") : "—";
        doc.text(`${i + 1}`, 14, y);
        doc.text(dateStr, 24, y);
        doc.text((inv.patientName || "—").slice(0, 18), 58, y);
        doc.text((inv.serviceName || "—").slice(0, 18), 100, y);
        doc.text(formatCurrency(inv.total), 152, y);
        y += 6;
        if (y > 272) { doc.addPage(); y = 20; }
      });
      // Total footer
      doc.line(14, y, 196, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(10, 22, 40);
      doc.text(`Total (${periodInvoices.length} transaksi): ${formatCurrency(periodRevenue)}`, 14, y);
      const filename = `Laporan_PrimeWellness_${periodLabel.replace(/ /g, "_")}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error(e);
    }
    setExportingPdf(false);
  };

  const fmt = (v: number) => `Rp ${(v / 1000).toFixed(0)}k`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Laporan Bisnis</h1>
          <p className="text-gray-500 text-sm">Analisis pendapatan dan performa klinik</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            {exporting ? "Mengekspor..." : "Export Excel"}
          </Button>
          <Button onClick={handleExportPDF} disabled={exportingPdf} variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <FileDown className="w-4 h-4" />
            {exportingPdf ? "Membuat PDF..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2">
        {[{ label: "7 Hari", value: "week" }, { label: "Bulan Ini", value: "month" }, { label: "Tahun Ini", value: "year" }].map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value as typeof period)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${period === p.value ? "bg-[#0A1628] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pendapatan Periode", value: formatCurrency(periodRevenue), icon: DollarSign, color: "bg-green-100 text-green-700" },
          { label: "Transaksi Lunas", value: periodInvoices.length, icon: BarChart3, color: "bg-blue-100 text-blue-700" },
          { label: "Rata-rata Transaksi", value: formatCurrency(avgTransaction), icon: TrendingUp, color: "bg-orange-100 text-orange-700" },
          { label: "All-Time Revenue", value: formatCurrency(allTimeRevenue), icon: FileText, color: "bg-purple-100 text-purple-700" },
        ].map((k) => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
                <k.icon className="w-5 h-5" />
              </div>
              {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-xl font-bold text-[#0A1628]">{k.value}</p>}
              <p className="text-sm text-gray-500 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Bar Chart */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Pendapatan per {period === "year" ? "Bulan" : "Hari"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : revenueChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#0A1628" radius={[4, 4, 0, 0]} name="Pendapatan" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Service Pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Pendapatan per Layanan</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-56 w-full" /> : serviceData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {serviceData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="truncate text-gray-600 flex-1">{s.name}</span>
                      <span className="font-medium text-slate-700">{periodRevenue > 0 ? Math.round((s.value / periodRevenue) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6-month trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#0A1628]">Tren Pendapatan 6 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={60} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="pendapatan" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} name="Pendapatan" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Transaction table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#0A1628]">Transaksi ({periodInvoices.length})</CardTitle>
          <div className="flex gap-3 text-xs text-gray-500">
            <span>Total Pasien: <strong className="text-[#0A1628]">{totalPatients}</strong></span>
            <span>Terapis: <strong className="text-[#0A1628]">{totalTherapists}</strong></span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-32 w-full" /> : periodInvoices.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Belum ada transaksi</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Tanggal</th>
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Pasien</th>
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Layanan</th>
                      <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs">Terapis</th>
                      <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodInvoices.slice(0, 30).map((inv) => {
                      const d = getDate(inv);
                      return (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3 text-gray-500 text-xs">{d ? formatDate(d, "dd MMM yy") : "—"}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{inv.patientName}</td>
                          <td className="py-2.5 px-3 text-gray-600 text-xs">{inv.serviceName || "—"}</td>
                          <td className="py-2.5 px-3 text-gray-600 text-xs">{inv.therapistName || "—"}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-green-700">{formatCurrency(inv.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#0A1628] text-white">
                      <td colSpan={4} className="py-2.5 px-3 font-semibold text-sm">Total</td>
                      <td className="py-2.5 px-3 text-right font-bold">{formatCurrency(periodRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {periodInvoices.slice(0, 30).map((inv) => {
                  const d = getDate(inv);
                  return (
                    <div key={inv.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{inv.patientName}</p>
                        <p className="text-xs text-gray-500 truncate">{inv.serviceName || "—"}</p>
                        <p className="text-xs text-gray-400">{d ? formatDate(d, "dd MMM yy") : "—"} · {inv.therapistName || "—"}</p>
                      </div>
                      <p className="font-bold text-green-700 text-sm flex-shrink-0">{formatCurrency(inv.total)}</p>
                    </div>
                  );
                })}
                <div className="bg-[#0A1628] text-white rounded-xl p-3 flex items-center justify-between">
                  <p className="font-semibold text-sm">Total ({periodInvoices.length} transaksi)</p>
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
