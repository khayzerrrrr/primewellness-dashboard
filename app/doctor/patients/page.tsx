"use client";

import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointmentsByDate } from "@/lib/firebase/firestore-service";
import { getInitials } from "@/lib/utils";
import type { Appointment } from "@/types";

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getAppointmentsByDate(new Date())
      .then((data) => {
        const mine = (data as Appointment[]).filter((a) => a.doctorId === user.uid);
        setPatients(mine);
        setFiltered(mine);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(patients.filter((p) => p.patientName.toLowerCase().includes(q)));
  }, [search, patients]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Pasien Hari Ini</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari nama pasien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada pasien hari ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-teal-600 text-white">
                      {getInitials(app.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{app.patientName}</p>
                      <AppointmentBadge status={app.status} />
                    </div>
                    <p className="text-sm text-gray-500">{app.serviceName} • {app.timeSlot}</p>
                    <p className="text-xs text-teal-600 font-mono mt-0.5">{app.bookingNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
