"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Receipt, Ticket, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats, getDoctors, getInvoices } from "@/lib/firebase/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LiveSessionWidget } from "@/components/dashboard/LiveSessionWidget";
import type { Invoice } from "@/types";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0, todayRevenue: 0 });
  const [totalTherapists, setTotalTherapists] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, docs, invs] = await Promise.all([
        getDashboardStats(),
        getDoctors(false),
        getInvoices(),
      ]);
      setStats(s);
      setTotalTherapists(docs.length);
      setInvoices(invs as Invoice[]);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const monthlyRevenue = paidInvoices
    .filter((i) => {
      const d = (i.date as unknown as { toDate?: () => Date })?.toDate?.() ?? i.date as Date;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + i.total, 0);
  const yearlyRevenue = paidInvoices
    .filter((i) => {
      const d = (i.date as unknown as { toDate?: () => Date })?.toDate?.() ?? i.date as Date;
      return d && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + i.total, 0);

  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Selamat datang,</p>
          <p className="font-semibold text-[#1a2744]">{user?.displayName || "Owner"}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Pasien" value={stats.totalPatients} icon={Users} color="bg-blue-100 text-blue-600" loading={loading} />
        <StatsCard title="Total Terapis" value={totalTherapists} icon={UserCheck} color="bg-purple-100 text-purple-600" loading={loading} />
        <StatsCard title="Booking Hari Ini" value={stats.todayAppointments} icon={Calendar} color="bg-orange-100 text-orange-600" loading={loading} />
        <StatsCard title="Pendapatan Hari Ini" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} color="bg-green-100 text-green-600" loading={loading} />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pendapatan Hari Ini", value: stats.todayRevenue, color: "from-blue-500 to-blue-600" },
          { label: "Pendapatan Bulan Ini", value: monthlyRevenue, color: "from-[#1a2744] to-[#2a3a60]" },
          { label: "Pendapatan Tahun Ini", value: yearlyRevenue, color: "from-green-600 to-green-700" },
        ].map((r) => (
          <div key={r.label} className={`bg-gradient-to-br ${r.color} rounded-2xl p-6 text-white`}>
            <p className="text-sm text-white/80 mb-1">{r.label}</p>
            {loading ? (
              <Skeleton className="h-8 w-32 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(r.value)}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-white/70 text-xs">
              <ArrowUpRight className="w-3 h-3" />
              <span>Update realtime</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Sessions */}
      <LiveSessionWidget />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a2744]">
              <Receipt className="w-5 h-5" />
              Ringkasan Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-3">
                {[
                  { label: "Total Invoice", value: invoices.length, color: "text-slate-700" },
                  { label: "Invoice Lunas", value: paidInvoices.length, color: "text-green-600" },
                  { label: "Invoice Belum Bayar", value: unpaidCount, color: "text-yellow-600" },
                  { label: "Total Pendapatan", value: formatCurrency(totalRevenue), color: "text-[#1a2744] font-bold" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600 text-sm">{item.label}</span>
                    <span className={`text-sm ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a2744]">
              <TrendingUp className="w-5 h-5" />
              Target Bisnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Pasien / Hari", current: stats.todayAppointments, target: 80, unit: "pasien" },
                { label: "Omset / Bulan", current: monthlyRevenue, target: 500000000, unit: "IDR", isCurrency: true },
              ].map((t) => {
                const pct = Math.min(100, Math.round((t.current / t.target) * 100));
                return (
                  <div key={t.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t.label}</span>
                      <span className="font-medium text-[#1a2744]">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1a2744] to-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{t.isCurrency ? formatCurrency(t.current) : t.current}</span>
                      <span>Target: {t.isCurrency ? formatCurrency(t.target) : t.target}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
