"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, CheckCircle, Clock, TrendingUp, Wallet, Percent, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAppointmentsByDoctor,
  getAppointmentsByDate,
  getCommissions,
  completeAppointmentWithCommission,
  getServices,
} from "@/lib/firebase/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Appointment, Commission, Service } from "@/types";

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [todayApps, setTodayApps] = useState<Appointment[]>([]);
  const [allApps, setAllApps] = useState<Appointment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = async () => {
    if (!user?.uid) return;
    const [today, all, comms, svcs] = await Promise.all([
      getAppointmentsByDate(new Date()),
      getAppointmentsByDoctor(user.uid),
      getCommissions(user.uid),
      getServices(true),
    ]);
    const myToday = (today as Appointment[]).filter((a) => a.doctorId === user.uid);
    setTodayApps(myToday);
    setAllApps(all as Appointment[]);
    setCommissions(comms);
    setServices(svcs);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, [user?.uid]);

  const handleComplete = async (app: Appointment) => {
    setCompleting(app.id);
    try {
      // Find service price
      const svc = services.find((s) => s.id === app.serviceId);
      const price = svc?.price ?? 300000;

      await completeAppointmentWithCommission(app.id, {
        doctorId: app.doctorId,
        doctorName: app.doctorName,
        patientName: app.patientName,
        serviceName: app.serviceName,
        servicePrice: price,
        date: (app.date as unknown as { toDate?: () => Date })?.toDate?.() ?? app.date as Date,
      });
      toast.success(`Sesi ${app.patientName} selesai! Komisi otomatis tercatat.`);
      await load();
    } catch {
      toast.error("Gagal menyelesaikan sesi");
    }
    setCompleting(null);
  };

  // Commission calculations
  const now = new Date();
  const pendingComm = commissions.filter((c) => c.status === "pending");
  const thisMonthComm = pendingComm.filter((c) => {
    const d = c.sessionDate instanceof Date ? c.sessionDate : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayComm = pendingComm.filter((c) => {
    const d = c.sessionDate instanceof Date ? c.sessionDate : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
    return d.toDateString() === now.toDateString();
  });

  const totalPending = pendingComm.reduce((s, c) => s + c.commissionAmount, 0);
  const monthlyComm = thisMonthComm.reduce((s, c) => s + c.commissionAmount, 0);
  const todayCommTotal = todayComm.reduce((s, c) => s + c.commissionAmount, 0);
  const allTimeComm = commissions.reduce((s, c) => s + c.commissionAmount, 0);

  const completed = todayApps.filter((a) => a.status === "completed").length;
  const activeApps = todayApps.filter((a) => ["confirmed", "checked_in", "in_progress"].includes(a.status));
  const uniquePatients = new Set(allApps.map((a) => a.patientId)).size;
  const commRate = commissions[0]?.commissionRate ?? 15;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Dashboard Terapis</h1>
          <p className="text-gray-500 text-sm">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
          <Percent className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">Komisi {commRate}%/sesi</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Sesi Hari Ini" value={todayApps.length} icon={Calendar} color="bg-blue-100 text-blue-600" loading={loading} />
        <StatsCard title="Selesai Hari Ini" value={completed} icon={CheckCircle} color="bg-green-100 text-green-600" loading={loading} />
        <StatsCard title="Total Pasien" value={uniquePatients} icon={Users} color="bg-purple-100 text-purple-600" loading={loading} />
        <StatsCard title="Komisi Hari Ini" value={formatCurrency(todayCommTotal)} icon={Wallet} color="bg-orange-100 text-orange-600" loading={loading} />
      </div>

      {/* Commission Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Komisi Bulan Ini", value: monthlyComm, color: "from-[#1a2744] to-[#2a3a60]", sub: `${thisMonthComm.length} sesi` },
          { label: "Belum Dibayarkan", value: totalPending, color: "from-orange-500 to-orange-600", sub: `${pendingComm.length} sesi menunggu` },
          { label: "Total Komisi (All-Time)", value: allTimeComm, color: "from-green-600 to-green-700", sub: `${commissions.length} sesi total` },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white`}>
            <p className="text-white/70 text-xs mb-1">{c.label}</p>
            {loading ? (
              <Skeleton className="h-8 w-32 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(c.value)}</p>
            )}
            <p className="text-white/60 text-xs mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule with Complete button */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Jadwal Hari Ini ({todayApps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : todayApps.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tidak ada sesi hari ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayApps.map((app) => {
                  const canComplete = ["confirmed", "checked_in", "in_progress"].includes(app.status);
                  const svc = services.find((s) => s.id === app.serviceId);
                  const commAmt = Math.round((svc?.price ?? 300000) * commRate / 100);
                  return (
                    <div key={app.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-800 text-sm">{app.patientName}</p>
                            <AppointmentBadge status={app.status} />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{app.serviceName} · {app.timeSlot}</p>
                          {canComplete && (
                            <p className="text-xs text-orange-600 font-medium mt-0.5">
                              Komisi: +{formatCurrency(commAmt)}
                            </p>
                          )}
                        </div>
                        {canComplete && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 flex-shrink-0 gap-1"
                            onClick={() => handleComplete(app)}
                            disabled={completing === app.id}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {completing === app.id ? "..." : "Selesai"}
                          </Button>
                        )}
                        {app.status === "completed" && (
                          <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Selesai</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission history */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Riwayat Komisi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada riwayat komisi</p>
                <p className="text-gray-300 text-xs mt-1">Komisi akan muncul setelah sesi selesai</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {commissions.slice(0, 15).map((c) => {
                  const d = c.sessionDate instanceof Date
                    ? c.sessionDate
                    : (c.sessionDate as unknown as { toDate?: () => Date })?.toDate?.() ?? new Date();
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.patientName}</p>
                        <p className="text-xs text-gray-500">{c.serviceName} · {formatDate(d, "dd MMM")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-700">+{formatCurrency(c.commissionAmount)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          c.status === "paid" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                        }`}>
                          {c.status === "paid" ? "Dibayar" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
