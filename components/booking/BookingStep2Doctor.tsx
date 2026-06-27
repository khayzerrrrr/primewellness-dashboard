"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getDoctors } from "@/lib/firebase/firestore-service";
import { getInitials } from "@/lib/utils";
import type { Doctor, Service } from "@/types";

const DAYS_LABEL: Record<number, string> = {
  0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu",
  4: "Kamis", 5: "Jumat", 6: "Sabtu",
};

interface Props {
  service: Service | null;
  selected: Doctor | null;
  onSelect: (doctor: Doctor) => void;
  onBack: () => void;
}

export function BookingStep2Doctor({ service, selected, onSelect, onBack }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctors(true)
      .then((data) => { setDoctors(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pilih Terapis</h2>
          {service && (
            <p className="text-gray-500 text-sm">Layanan: <span className="text-[#1B3A6B] font-medium">{service.name}</span></p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada terapis tersedia saat ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => onSelect(doctor)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                selected?.id === doctor.id
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-gray-100 hover:border-blue-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14 flex-shrink-0">
                  <AvatarFallback className="bg-[#0A1628] text-white text-lg">
                    {getInitials(doctor.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{doctor.fullName}</p>
                  <p className="text-sm text-[#0A1628] mt-0.5">{doctor.specialization}</p>
                  {/* Multi-specializations chips */}
                  {(doctor.specializations ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(doctor.specializations ?? []).slice(0, 4).map((s) => (
                        <span key={s} className="text-xs bg-blue-50 text-[#0A1628] px-2 py-0.5 rounded-full border border-blue-100">{s}</span>
                      ))}
                      {(doctor.specializations ?? []).length > 4 && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          +{(doctor.specializations ?? []).length - 4} lagi
                        </span>
                      )}
                    </div>
                  )}
                  {doctor.schedule.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doctor.schedule.map((s) => (
                        <span key={s.day} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {DAYS_LABEL[s.day]} {s.startTime}–{s.endTime}
                        </span>
                      ))}
                    </div>
                  )}
                  {doctor.bio && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{doctor.bio}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
