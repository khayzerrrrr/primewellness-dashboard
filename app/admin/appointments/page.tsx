"use client";

import { useEffect, useState } from "react";
import { Calendar, Search, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
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
import { getAppointments, updateAppointmentStatus } from "@/lib/firebase/firestore-service";
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

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await getAppointments();
    setAppointments(data as Appointment[]);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success(`Status diperbarui`);
      load();
    } catch {
      toast.error("Gagal memperbarui status");
    }
  };

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      a.bookingNumber.toLowerCase().includes(q) ||
      a.patientName.toLowerCase().includes(q) ||
      (a.doctorName ?? "").toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q);
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
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari booking, pasien, terapis..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
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
                  <td className="py-3 px-4 font-mono text-xs text-teal-600">{app.bookingNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{app.patientName}</td>
                  <td className="py-3 px-4 text-gray-600">{app.doctorName ?? "—"}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs max-w-[120px] truncate">{app.serviceName}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {typeof app.date === "object" && "toDate" in app.date
                      ? formatDate((app.date as { toDate(): Date }).toDate())
                      : formatDate(app.date as Date)}
                  </td>
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
                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "confirmed")}>
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />Konfirmasi
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "checked_in")}>
                          <RefreshCw className="w-4 h-4 mr-2 text-purple-500" />Check In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "in_progress")}>
                          <Clock className="w-4 h-4 mr-2 text-indigo-500" />Berlangsung
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "completed")}>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />Selesai
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(app.id, "cancelled")} className="text-red-600">
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
                </div>
                <AppointmentBadge status={app.status} />
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500"><span className="font-medium">Layanan:</span> {app.serviceName}</p>
                <p className="text-xs text-gray-500"><span className="font-medium">Terapis:</span> {app.doctorName ?? "—"}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {typeof app.date === "object" && "toDate" in app.date
                    ? formatDate((app.date as { toDate(): Date }).toDate())
                    : formatDate(app.date as Date)} · {app.timeSlot}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs">Ubah Status</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleStatusChange(app.id, "confirmed")}>
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />Konfirmasi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app.id, "checked_in")}>
                    <RefreshCw className="w-4 h-4 mr-2 text-purple-500" />Check In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app.id, "in_progress")}>
                    <Clock className="w-4 h-4 mr-2 text-indigo-500" />Berlangsung
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app.id, "completed")}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />Selesai
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(app.id, "cancelled")} className="text-red-600">
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
