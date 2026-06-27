"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointments } from "@/lib/firebase/firestore-service";
import { formatDate, formatCurrency } from "@/lib/utils";
import { where, orderBy } from "firebase/firestore";
import type { Appointment } from "@/types";

const WORK_HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
const DAYS_ID = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getAppDate(app: Appointment): Date {
  const d = (app.date as unknown as { toDate?: () => Date })?.toDate?.() ?? app.date as Date;
  return d instanceof Date ? d : new Date(d);
}

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const [allApps, setAllApps] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [selected, setSelected] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getAppointments([where("doctorId", "==", user.uid), orderBy("date", "asc")])
      .then((data) => { setAllApps(data as Appointment[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const getAppsForDay = (day: Date) => allApps.filter((a) => isSameDay(getAppDate(a), day));
  const getAppForSlot = (day: Date, hour: string) =>
    allApps.filter((a) => isSameDay(getAppDate(a), day) && a.timeSlot?.startsWith(hour.substring(0, 5)));

  const todayApps = allApps.filter((a) => isSameDay(getAppDate(a), new Date()));
  const weekApps = weekDays.flatMap((d) => getAppsForDay(d));

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.getDate()} ${MONTHS_ID[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS_ID[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const statusIcon = (s: Appointment["status"]) => {
    if (s === "completed") return <CheckCircle className="w-3 h-3 text-green-500" />;
    if (s === "cancelled") return <XCircle className="w-3 h-3 text-red-500" />;
    return <AlertCircle className="w-3 h-3 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jadwal Saya</h1>
          <p className="text-gray-500 mt-1">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={goToday} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-[#1a2744] font-medium">Hari Ini</button>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Hari Ini", value: todayApps.length, color: "text-blue-700" },
          { label: "Minggu Ini", value: weekApps.length, color: "text-[#1a2744]" },
          { label: "Selesai Minggu Ini", value: weekApps.filter((a) => a.status === "completed").length, color: "text-green-700" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Calendar Grid */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-gray-50">
          <CardTitle className="text-base font-semibold text-[#1a2744]">
            Kalender Mingguan — {weekLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <Skeleton className="h-64 w-full m-4" /> : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Day headers */}
                <div className="grid grid-cols-8 border-b bg-gray-50">
                  <div className="py-2 px-3 text-xs text-gray-400 font-medium">Waktu</div>
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    const dayApps = getAppsForDay(day);
                    return (
                      <div key={i} className={`py-2 px-1 text-center border-l ${isToday ? "bg-blue-50" : ""}`}>
                        <p className={`text-xs font-medium ${isToday ? "text-blue-600" : "text-gray-500"}`}>{DAYS_ID[day.getDay()]}</p>
                        <p className={`text-lg font-bold ${isToday ? "text-blue-600" : "text-slate-700"}`}>{day.getDate()}</p>
                        {dayApps.length > 0 && (
                          <span className="text-xs bg-[#1a2744] text-white rounded-full px-1.5 py-0.5">{dayApps.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Time slots */}
                {WORK_HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b hover:bg-gray-50/50 transition-colors min-h-[52px]">
                    <div className="py-2 px-3 text-xs text-gray-400 font-mono flex items-start pt-2">{hour}</div>
                    {weekDays.map((day, i) => {
                      const isToday = isSameDay(day, new Date());
                      const slotApps = getAppForSlot(day, hour);
                      return (
                        <div key={i} className={`py-1 px-1 border-l min-h-[52px] ${isToday ? "bg-blue-50/30" : ""}`}>
                          {slotApps.map((app) => (
                            <button key={app.id} onClick={() => setSelected(app)}
                              className={`w-full text-left rounded p-1.5 text-xs mb-1 transition-all hover:shadow-sm border ${
                                app.status === "completed" ? "bg-green-50 border-green-200 text-green-800"
                                  : app.status === "cancelled" ? "bg-red-50 border-red-200 text-red-700 opacity-60"
                                  : app.status === "confirmed" ? "bg-blue-50 border-blue-200 text-blue-800"
                                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
                              }`}>
                              <div className="flex items-center gap-1 mb-0.5">
                                {statusIcon(app.status)}
                                <span className="font-medium truncate">{app.patientName}</span>
                              </div>
                              <p className="text-[10px] opacity-70 truncate">{app.serviceName}</p>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today detail list */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800">
            Hari Ini ({todayApps.length} Appointment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg mb-3" />)
          ) : todayApps.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Tidak ada jadwal hari ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayApps.map((app, idx) => (
                <div key={app.id} onClick={() => setSelected(app)}
                  className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">{idx + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{app.patientName}</p>
                      <AppointmentBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{app.serviceName}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {app.timeSlot}
                      <span className="ml-2 font-mono text-teal-600">{app.bookingNumber}</span>
                    </div>
                    {app.notes && <p className="text-xs text-gray-400 mt-1 italic">Catatan: {app.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1a2744]">Detail Appointment</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <AppointmentBadge status={selected.status} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Pasien", value: selected.patientName },
                  { label: "Booking", value: selected.bookingNumber },
                  { label: "Layanan", value: selected.serviceName },
                  { label: "Waktu", value: selected.timeSlot },
                  { label: "Tanggal", value: (() => { try { return formatDate(getAppDate(selected), "dd MMM yyyy"); } catch { return "—"; } })() },
                  { label: "Harga", value: selected.servicePrice ? formatCurrency(selected.servicePrice) : "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="font-medium text-slate-800 text-sm mt-0.5">{item.value || "—"}</p>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">Catatan Pasien</p>
                  <p className="text-sm text-blue-800 mt-1">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
