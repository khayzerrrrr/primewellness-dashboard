"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, Calendar, CreditCard, Clock, CheckCircle, AlertCircle, PhoneCall, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { getDashboardStats, getAppointmentsByDate, getInvoices, updateAppointmentStatus } from "@/lib/firebase/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { Appointment, Invoice } from "@/types";

export default function FrontOfficeDashboardPage() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, todayAppointments: 0, todayRevenue: 0 });
  const [todayApps, setTodayApps] = useState<Appointment[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, apps, invs] = await Promise.all([
      getDashboardStats(),
      getAppointmentsByDate(new Date()),
      getInvoices(),
    ]);
    setStats(s);
    setTodayApps(apps as Appointment[]);
    setUnpaidInvoices((invs as Invoice[]).filter((i) => i.status === "unpaid"));
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  const pendingApps = todayApps.filter((a) => a.status === "pending");
  const completedApps = todayApps.filter((a) => a.status === "completed");

  const handleConfirm = async (app: Appointment) => {
    setConfirmingId(app.id);
    try {
      await updateAppointmentStatus(app.id, "confirmed", {
        userId: user?.uid || "",
        userName: user?.displayName || "",
        userRole: role || "front_office",
        patientName: app.patientName,
        bookingNumber: app.bookingNumber,
      });
      setTodayApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "confirmed" } : a));
      toast.success(`Booking ${app.bookingNumber} dikonfirmasi`);
    } catch { toast.error("Gagal mengkonfirmasi booking"); }
    setConfirmingId(null);
  };

  const handleCheckin = async (app: Appointment) => {
    setConfirmingId(app.id);
    try {
      await updateAppointmentStatus(app.id, "checked_in", {
        userId: user?.uid || "",
        userName: user?.displayName || "",
        userRole: role || "front_office",
        patientName: app.patientName,
        bookingNumber: app.bookingNumber,
      });
      setTodayApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: "checked_in" } : a));
      toast.success(`Pasien ${app.patientName} check-in`);
    } catch { toast.error("Gagal check-in"); }
    setConfirmingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Front Office</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <p className="text-sm font-medium text-[#1a2744]">{user?.displayName}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/front-office/register">
          <Button className="w-full h-16 bg-[#1a2744] hover:bg-[#2a3a60] text-white flex-col gap-1">
            <UserPlus className="w-5 h-5" />
            <span className="text-xs">Registrasi Pasien</span>
          </Button>
        </Link>
        <Link href="/admin/appointments">
          <Button variant="outline" className="w-full h-16 border-[#1a2744] text-[#1a2744] flex-col gap-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Buat Booking</span>
          </Button>
        </Link>
        <Link href="/front-office/payment">
          <Button variant="outline" className="w-full h-16 border-green-600 text-green-700 flex-col gap-1">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">Proses Pembayaran</span>
          </Button>
        </Link>
        <a href="https://wa.me/6282125555558" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full h-16 border-emerald-600 text-emerald-700 flex-col gap-1">
            <PhoneCall className="w-5 h-5" />
            <span className="text-xs">Chat Pasien</span>
          </Button>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Booking Hari Ini" value={stats.todayAppointments} icon={Calendar} color="bg-blue-100 text-blue-600" loading={loading} />
        <StatsCard title="Menunggu Konfirmasi" value={pendingApps.length} icon={Clock} color="bg-yellow-100 text-yellow-600" loading={loading} />
        <StatsCard title="Invoice Belum Bayar" value={unpaidInvoices.length} icon={AlertCircle} color="bg-red-100 text-red-600" loading={loading} />
        <StatsCard title="Pendapatan Hari Ini" value={formatCurrency(stats.todayRevenue)} icon={CreditCard} color="bg-green-100 text-green-600" loading={loading} />
      </div>

      {/* Pending confirmations — priority section */}
      {!loading && pendingApps.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-yellow-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-yellow-700">
              <Clock className="w-5 h-5" />
              Perlu Dikonfirmasi ({pendingApps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApps.map((app) => (
                <div key={app.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{app.patientName}</p>
                    <p className="text-xs text-gray-500">{app.timeSlot} · {app.serviceName} · <span className="font-mono text-yellow-700">{app.bookingNumber}</span></p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" disabled={confirmingId === app.id}
                      onClick={() => handleCheckin(app)}
                      className="text-xs h-8 px-3 border-blue-300 text-blue-700 hover:bg-blue-50">
                      Check-in
                    </Button>
                    <Button size="sm" disabled={confirmingId === app.id}
                      onClick={() => handleConfirm(app)}
                      className="text-xs h-8 px-3 bg-[#1a2744] hover:bg-[#2a3a60]">
                      {confirmingId === app.id ? "..." : "Konfirmasi"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today Queue */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a2744]">
              <Calendar className="w-5 h-5" />
              Antrian Hari Ini
              <span className="ml-auto text-sm font-normal text-gray-500">
                {loading ? "..." : `${completedApps.length}/${todayApps.length} selesai`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : todayApps.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">Tidak ada appointment hari ini</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {todayApps.map((app, idx) => (
                  <div key={app.id} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${app.status === "completed" ? "bg-green-50 opacity-70" : "bg-gray-50"}`}>
                    <span className={`text-xs font-bold w-5 flex-shrink-0 ${app.status === "completed" ? "text-green-400" : "text-gray-400"}`}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{app.patientName}</p>
                      <p className="text-xs text-gray-500">{app.timeSlot} · {app.serviceName}</p>
                    </div>
                    <AppointmentBadge status={app.status} />
                    {app.status === "confirmed" && (
                      <Button size="sm" variant="outline" disabled={confirmingId === app.id}
                        onClick={() => handleCheckin(app)}
                        className="text-xs h-7 px-2 border-blue-300 text-blue-700 flex-shrink-0">
                        In
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpaid Invoices */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1a2744]">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Invoice Belum Bayar ({unpaidInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : unpaidInvoices.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <CheckCircle className="w-10 h-10 text-green-400" />
                <p className="text-gray-400 text-sm">Semua invoice sudah dibayar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {unpaidInvoices.slice(0, 8).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{inv.patientName}</p>
                      <p className="text-xs text-gray-500 font-mono">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{formatCurrency(inv.total)}</p>
                      <Link href="/front-office/payment">
                        <span className="text-xs text-blue-600 hover:underline cursor-pointer">Proses →</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
