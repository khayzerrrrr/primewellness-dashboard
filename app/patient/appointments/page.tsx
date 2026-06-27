"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointmentsByPatient } from "@/lib/firebase/firestore-service";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getAppointmentsByPatient(user.uid)
      .then((data) => {
        setAppointments(data as Appointment[]);
        setFiltered(data as Appointment[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      appointments.filter(
        (a) =>
          (a.bookingNumber ?? "").toLowerCase().includes(q) ||
          (a.serviceName ?? "").toLowerCase().includes(q) ||
          (a.doctorName ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, appointments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Appointment Saya</h1>
        <Link href="/booking">
          <Button className="bg-[#1B3A6B] hover:bg-[#0A1628] text-white gap-2">
            <Plus className="w-4 h-4" />
            Buat Appointment
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari nomor booking, layanan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada appointment</p>
            <Link href="/booking">
              <Button className="mt-4 bg-[#1B3A6B] hover:bg-[#0A1628] text-white">
                Buat Appointment Pertama
              </Button>
            </Link>
          </div>
        ) : (
          filtered.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-[#1B3A6B]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{app.serviceName}</p>
                        <AppointmentBadge status={app.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        dr. {app.doctorName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {typeof app.date === "object" && "toDate" in app.date
                          ? formatDate((app.date as { toDate(): Date }).toDate())
                          : formatDate(app.date as Date)}{" "}
                        • {app.timeSlot}
                      </p>
                      <p className="text-xs text-[#1B3A6B] font-mono mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">
                        {app.bookingNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
