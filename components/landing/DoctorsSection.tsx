"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDoctors } from "@/lib/firebase/firestore-service";
import { getInitials } from "@/lib/utils";
import type { Doctor } from "@/types";

const SAMPLE_DOCTORS: Doctor[] = [
  {
    id: "1",
    userId: "1",
    fullName: "Budi Santoso, TCM",
    specialization: "Terapis TCM & Akupunktur",
    email: "budi@primewellness.id",
    phone: "08123456789",
    certificationNumber: "CERT-001",
    specializations: ["Akupunktur Tanpa Jarum", "Terapis Bekam (Cupping)"],
    isActive: true,
    schedule: [
      { day: 1, startTime: "08:00", endTime: "12:00", quota: 10 },
      { day: 3, startTime: "08:00", endTime: "12:00", quota: 10 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    userId: "2",
    fullName: "Sari Dewi, RMT",
    specialization: "Terapis Pijat & Relaksasi",
    email: "sari@primewellness.id",
    phone: "08234567890",
    certificationNumber: "CERT-002",
    specializations: ["Pijat Refleksi", "Pijat Relaksasi"],
    isActive: true,
    schedule: [
      { day: 2, startTime: "09:00", endTime: "13:00", quota: 10 },
      { day: 4, startTime: "09:00", endTime: "13:00", quota: 10 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    userId: "3",
    fullName: "Ahmad Rizki, CHT",
    specialization: "Terapis Herbal & Bioteknologi",
    email: "ahmad@primewellness.id",
    phone: "08345678901",
    certificationNumber: "CERT-003",
    specializations: ["Herbal TCM", "Moxibustion"],
    isActive: true,
    schedule: [
      { day: 1, startTime: "13:00", endTime: "17:00", quota: 8 },
      { day: 5, startTime: "08:00", endTime: "12:00", quota: 8 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DAYS_LABEL: Record<number, string> = {
  0: "Min", 1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam", 5: "Jum", 6: "Sab",
};

export function DoctorsSection() {
  const t = useTranslations();
  const [doctors, setDoctors] = useState<Doctor[]>(SAMPLE_DOCTORS);

  useEffect(() => {
    getDoctors(true)
      .then((data) => { if (data.length > 0) setDoctors(data); })
      .catch(() => {});
  }, []);

  return (
    <section id="doctors" className="py-20 bg-gradient-to-br from-teal-50 to-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t("doctors.title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("doctors.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-[#1a2744] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                    {doctor.photoURL ? (
                      <img
                        src={doctor.photoURL}
                        alt={doctor.fullName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {getInitials(doctor.fullName)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">
                      {doctor.fullName}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-1 bg-blue-100 text-[#1a2744] text-xs"
                    >
                      {doctor.specialization}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Jadwal Terapi:</p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.schedule.map((s) => (
                      <span
                        key={s.day}
                        className="text-xs bg-blue-50 text-[#1a2744] border border-blue-200 px-2 py-1 rounded-md"
                      >
                        {DAYS_LABEL[s.day]} {s.startTime}-{s.endTime}
                      </span>
                    ))}
                  </div>
                </div>

                <Link href="/booking">
                  <Button className="w-full bg-[#1a2744] hover:bg-[#2a3a60] text-white gap-2">
                    <Calendar className="w-4 h-4" />
                    {t("doctors.bookAppointment")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
