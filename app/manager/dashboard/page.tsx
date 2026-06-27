"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Receipt, ArrowUpRight, ClipboardCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { getDashboardStats, getDoctors, getAppointmentsByDate, getInvoices } from "@/lib/firebase/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LiveSessionWidget } from "@/components/dashboard/LiveSessionWidget";
import type { Appointment, Doctor, Invoice } from "@/types";

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0, todayRevenue: 0 });
  const [therapists, setTherapists] = useState<Doctor[]>([]);
  const [todayApps, setTodayApps] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, docs, apps, invs] = await Promise.all([
        getDashboardStats(),
        getDoctors(false),
        getAppointmentsByDate(new Date()),
        getInvoices(),
      ]);
      setStats(s);
      setTherapists(docs as Doctor[]);
      setTodayApps(apps as Appointment[]);
      setInvoices(invs as Invoice[]);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const activeTherapists = therapists.filter((t) => t.isActive);
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
  const pendingApps = todayApps.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Selamat datang,</p>
          <p className="font-semibold text-[#1a2744]">{user?.displayName || "Manager"}</p>
        </div>
      </div>

      {/* Alert jika ada yang perlu tindakan */}
      {!loading && pendingApps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">{pendingApps.length} appointment menunggu konfirmasi</p>
            <p className="text-xs text-yellow-600">Segera konfirmasi agar pasien mendapat notifikasi</p>
          </div>
          <Link href="/admin/appointments" className="text-xs font-medium text-yellow-700 underline">Lihat</Link>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Pasien" value={stats.totalPatients} icon={Users} color="bg-blue-100 text-blue-600" loading={loading} />
        <StatsCard title="Terapis Aktif" value={activeTherapists.length} icon={UserCheck} color="bg-purple-100 text-purple-600" loading={loading} />
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

      {/* Appointment & Invoice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today Appointments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a2744]">
              <Calendar className="w-5 h-5" />
              Appointment Hari Ini ({todayApps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : todayApps.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">Tidak ada appointment hari ini</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {todayApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{app.patientName}</p>
                      <p className="text-gray-500 text-xs">{app.doctorName} · {app.timeSlot}</p>
                    </div>
                    <AppointmentBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Summary */}
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
      </div>

      {/* Target & Terapis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Bisnis */}
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
                { label: "Pasien / Hari", current: stats.todayAppointments, target: 20, unit: "pasien" },
                { label: "Omset / Bulan", current: monthlyRevenue, target: 50000000, unit: "IDR", isCurrency: true },
              ].map((t) => {
                const pct = Math.min(100, Math.round((t.current / t.target) * 100));
                return (
                  <div key={t.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t.label}</span>
                      <span className="font-medium text-[#1a2744]">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#1a2744] to-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
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

        {/* Daftar Terapis */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a2744]">
              <UserCheck className="w-5 h-5" />
              Daftar Terapis ({activeTherapists.length} aktif)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-40 w-full" /> : activeTherapists.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">Belum ada terapis terdaftar</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeTherapists.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 bg-[#1a2744] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{t.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{t.fullName}</p>
                      <p className="text-gray-500 text-xs truncate">{t.specialization}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Aktif</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2744]">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/admin/appointments", label: "Konfirmasi Booking", icon: Calendar, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { href: "/manager/attendance", label: "Input Absensi", icon: ClipboardCheck, color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
              { href: "/manager/reports", label: "Lihat Laporan", icon: TrendingUp, color: "bg-green-50 text-green-700 hover:bg-green-100" },
              { href: "/owner/commissions", label: "Komisi Terapis", icon: Receipt, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${action.color}`}
              >
                <action.icon className="w-6 h-6" />
                {action.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
