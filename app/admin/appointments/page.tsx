"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Search, CheckCircle, XCircle, RefreshCw, Clock, CalendarCheck, CalendarDays, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { getAppointments, updateAppointmentStatus, updateAppointmentGoogleEventId } from "@/lib/firebase/firestore-service";
import { formatDate } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Konfirmasi" },
  { value: "checked_in", label: "Check In" },
  { value: "in_progress", label: "Berlangsung" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

function getAppDate(app: Appointment): Date {
  const d = app.date;
  if (!d) return new Date();
  if (d instanceof Date) return d;
  const ts = d as unknown as { toDate?: () => Date };
  if (typeof ts.toDate === "function") return ts.toDate();
  return new Date(d as unknown as string);
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [calConnected, setCalConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const data = await getAppointments();
    setAppointments(data as Appointment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
    // Check Google Calendar connection status
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((d) => setCalConnected(d.connected))
      .catch(() => {});
  }, [load]);

  const handleStatusChange = async (app: Appointment, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(app.id, status);
      toast.success("Status diperbarui");

      // Google Calendar: send invite on confirm, cancel event on cancellation
      if (calConnected) {
        if (status === "confirmed" && app.googleEventId) {
          // Re-push event so attendee invite is sent
          try {
            const date = getAppDate(app);
            await fetch("/api/calendar/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId: app.id,
                bookingNumber: app.bookingNumber,
                patientName: app.patientName,
                patientEmail: app.patientEmail,
                doctorName: app.doctorName,
                serviceName: app.serviceName,
                date: date.toISOString(),
                timeSlot: app.timeSlot,
                durationMinutes: app.serviceDuration ?? 60,
                notes: app.notes,
                googleEventId: app.googleEventId,
              }),
            });
          } catch {}
        } else if (status === "cancelled" && app.googleEventId) {
          try {
            await fetch("/api/calendar/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ googleEventId: app.googleEventId }),
            });
          } catch {}
        }
      }

      load();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const handleSyncAll = async () => {
    if (!calConnected) {
      toast.error("Google Calendar belum terhubung. Klik 'Hubungkan' terlebih dahulu.");
      return;
    }
    setSyncing(true);
    try {
      const active = appointments.filter(
        (a) => a.status !== "cancelled" && a.status !== "no_show"
      );
      if (active.length === 0) { toast.info("Tidak ada appointment untuk disync"); setSyncing(false); return; }

      const payload = active.map((a) => {
        const date = getAppDate(a);
        return {
          id: a.id,
          appointmentId: a.id,
          bookingNumber: a.bookingNumber,
          patientName: a.patientName,
          patientEmail: a.patientEmail,
          doctorName: a.doctorName,
          serviceName: a.serviceName,
          date: date.toISOString(),
          timeSlot: a.timeSlot,
          durationMinutes: a.serviceDuration ?? 60,
          notes: a.notes,
          googleEventId: a.googleEventId,
        };
      });

      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointments: payload }),
      });
      const data = await res.json();

      // Save eventIds back to Firestore
      const results: Array<{ id: string; eventId: string | null }> = data.results ?? [];
      await Promise.all(
        results
          .filter((r) => r.eventId)
          .map((r) => updateAppointmentGoogleEventId(r.id, r.eventId!))
      );

      const ok = results.filter((r) => r.eventId).length;
      const fail = results.filter((r) => !r.eventId).length;
      toast.success(`Sync selesai: ${ok} berhasil${fail ? `, ${fail} gagal` : ""}`);
      load();
    } catch (err) {
      toast.error("Sync gagal: " + String(err));
    } finally {
      setSyncing(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (a.bookingNumber ?? "").toLowerCase().includes(q) ||
      (a.patientName ?? "").toLowerCase().includes(q) ||
      (a.doctorName ?? "").toLowerCase().includes(q) ||
      (a.serviceName ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Jadwal Appointment</h1>
          <p className="text-gray-500 text-sm">{appointments.length} appointment terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {calConnected ? (
            <Button
              onClick={handleSyncAll}
              disabled={syncing}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm h-9"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
              {syncing ? "Menyinkron..." : "Sync Google Calendar"}
            </Button>
          ) : (
            <a href="/api/calendar/auth" className="inline-flex items-center gap-2 bg-[#1a2744] hover:bg-[#2a3a60] text-white text-sm px-4 h-9 rounded-md font-medium transition-colors">
              <CalendarDays className="w-4 h-4" />
              Hubungkan Google Calendar
            </a>
          )}
        </div>
      </div>

      {/* Google Calendar connection notice */}
      {!calConnected && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <CalendarDays className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium">Google Calendar belum terhubung</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Klik <strong>Hubungkan Google Calendar</strong> untuk setup sekali, lalu tambahkan{" "}
              <code className="bg-amber-100 px-1 rounded">GOOGLE_REFRESH_TOKEN</code> ke environment variables.
            </p>
          </div>
          <a href="/api/calendar/auth" className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-700 underline">
            <LinkIcon className="w-3 h-3" /> Setup
          </a>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari booking, pasien, terapis..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Booking #</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Pasien</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Terapis</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Layanan</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Jam</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  {search || filterStatus !== "all" ? "Tidak ada appointment sesuai filter" : "Tidak ada appointment"}
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-mono text-xs text-teal-600">{app.bookingNumber}</p>
                    {app.googleEventId && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 mt-0.5">
                        <CalendarCheck className="w-3 h-3" /> synced
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{app.patientName}</td>
                  <td className="py-3 px-4 text-gray-600">{app.doctorName ?? "—"}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs max-w-[120px] truncate">{app.serviceName}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{formatDate(getAppDate(app))}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />{app.timeSlot}
                    </span>
                  </td>
                  <td className="py-3 px-4"><AppointmentBadge status={app.status} /></td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs">Ubah Status</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleStatusChange(app, "confirmed")}>
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />Konfirmasi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app, "checked_in")}>
                          <RefreshCw className="w-4 h-4 mr-2 text-purple-500" />Check In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app, "in_progress")}>
                          <Clock className="w-4 h-4 mr-2 text-indigo-500" />Berlangsung
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app, "completed")}>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />Selesai
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app, "cancelled")} className="text-red-600">
                          <XCircle className="w-4 h-4 mr-2" />Batalkan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search || filterStatus !== "all" ? "Tidak ada appointment sesuai filter" : "Tidak ada appointment"}</p>
          </div>
        ) : (
          filtered.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{app.patientName}</p>
                  <p className="text-xs font-mono text-teal-600">{app.bookingNumber}</p>
                  {app.googleEventId && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                      <CalendarCheck className="w-3 h-3" /> synced ke Google Calendar
                    </span>
                  )}
                </div>
                <AppointmentBadge status={app.status} />
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500"><span className="font-medium">Layanan:</span> {app.serviceName}</p>
                <p className="text-xs text-gray-500"><span className="font-medium">Terapis:</span> {app.doctorName ?? "—"}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(getAppDate(app))} · {app.timeSlot}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs">Ubah Status</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStatusChange(app, "confirmed")}>
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />Konfirmasi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app, "checked_in")}>
                    <RefreshCw className="w-4 h-4 mr-2 text-purple-500" />Check In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app, "in_progress")}>
                    <Clock className="w-4 h-4 mr-2 text-indigo-500" />Berlangsung
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app, "completed")}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />Selesai
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app, "cancelled")} className="text-red-600">
                    <XCircle className="w-4 h-4 mr-2" />Batalkan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
