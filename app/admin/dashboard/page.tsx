"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { getDashboardStats, getAppointmentsByDate, getAppointments } from "@/lib/firebase/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    todayRevenue: 0,
  });
  const [todayApps, setTodayApps] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, apps] = await Promise.all([
        getDashboardStats(),
        getAppointmentsByDate(new Date()),
      ]);
      setStats(s);
      setTodayApps(apps as Appointment[]);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pasien"
          value={stats.totalPatients}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          loading={loading}
        />
        <StatsCard
          title="Booking Hari Ini"
          value={stats.todayAppointments}
          icon={Calendar}
          color="bg-purple-100 text-purple-600"
          loading={loading}
        />
        <StatsCard
          title="Pendapatan Hari Ini"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
          loading={loading}
        />
        <StatsCard
          title="Appointment Pending"
          value={todayApps.filter((a) => a.status === "pending").length}
          icon={TrendingUp}
          color="bg-yellow-100 text-yellow-600"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Appointment Hari Ini ({todayApps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg mb-2" />
            ))
          ) : todayApps.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tidak ada appointment hari ini</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Booking #</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Pasien</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Dokter</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Jam</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayApps.map((app) => (
                    <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-[#1B3A6B] font-mono text-xs">{app.bookingNumber}</td>
                      <td className="py-3 font-medium text-slate-800">{app.patientName}</td>
                      <td className="py-3 text-gray-600">{app.doctorName}</td>
                      <td className="py-3 text-gray-600">{app.timeSlot}</td>
                      <td className="py-3">
                        <AppointmentBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
