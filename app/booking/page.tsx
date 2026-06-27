"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Heart, MessageCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { CLINIC_INFO } from "@/lib/constants";
import { BookingStep1Service } from "@/components/booking/BookingStep1Service";
import { BookingStep2Doctor } from "@/components/booking/BookingStep2Doctor";
import { BookingStep3DateTime } from "@/components/booking/BookingStep3DateTime";
import { BookingStep4Confirm } from "@/components/booking/BookingStep4Confirm";
import type { Service, Doctor } from "@/types";

type BookingData = {
  service: Service | null;
  doctor: Doctor | null;
  date: Date | null;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes: string;
};

const STEPS = [
  { label: "Pilih Layanan", number: 1 },
  { label: "Pilih Terapis", number: 2 },
  { label: "Pilih Waktu", number: 3 },
  { label: "Konfirmasi", number: 4 },
];

export default function BookingPage() {
  const t = useTranslations("booking");
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    doctor: null,
    date: null,
    timeSlot: "",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    notes: "",
  });
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);

  const update = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  if (bookingNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Berhasil!</h2>
          <p className="text-gray-600 mb-4">
            Nomor booking Anda:
          </p>
          <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4 mb-6">
            <p className="text-2xl font-mono font-bold text-teal-700">{bookingNumber}</p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Tim kami akan menghubungi Anda untuk konfirmasi jadwal.
            Harap hadir <strong>15 menit</strong> sebelum waktu yang dijadwalkan.
          </p>

          {/* Clinic info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Lokasi Klinik</p>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <a href={CLINIC_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors">
                {CLINIC_INFO.address}, {CLINIC_INFO.city}
              </a>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href={CLINIC_INFO.waUrl(`Halo, saya baru saja booking dengan nomor *${bookingNumber}*. Mohon konfirmasinya 🙏`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Konfirmasi via WhatsApp
            </a>
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <button className="w-full px-4 py-2.5 border border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors text-sm">
                  Kembali ke Beranda
                </button>
              </Link>
              <button
                onClick={() => {
                  setBookingNumber(null);
                  setStep(1);
                  setBookingData({
                    service: null, doctor: null, date: null, timeSlot: "",
                    patientName: "", patientPhone: "", patientEmail: "", notes: "",
                  });
                }}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
              >
                Booking Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-teal-100 px-4 py-4">
        <div className="container mx-auto max-w-4xl flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-teal-700 font-bold">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            Prime Wellness
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 font-medium">{t("title")}</span>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.number} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 ${idx < STEPS.length - 1 ? "" : ""}`}>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
                      step === s.number
                        ? "bg-teal-600 text-white"
                        : step > s.number
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > s.number ? "✓" : s.number}
                  </div>
                  <span
                    className={`text-sm font-medium whitespace-nowrap hidden sm:block ${
                      step === s.number ? "text-teal-700" : step > s.number ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 flex-shrink-0 ${step > s.number ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 && (
            <BookingStep1Service
              selected={bookingData.service}
              onSelect={(service) => { update({ service }); next(); }}
            />
          )}
          {step === 2 && (
            <BookingStep2Doctor
              service={bookingData.service}
              selected={bookingData.doctor}
              onSelect={(doctor) => { update({ doctor }); next(); }}
              onBack={prev}
            />
          )}
          {step === 3 && (
            <BookingStep3DateTime
              doctor={bookingData.doctor}
              selectedDate={bookingData.date}
              selectedTime={bookingData.timeSlot}
              onSelect={(date, timeSlot) => { update({ date, timeSlot }); next(); }}
              onBack={prev}
            />
          )}
          {step === 4 && (
            <BookingStep4Confirm
              bookingData={bookingData}
              onUpdate={update}
              onBack={prev}
              onSuccess={(num) => setBookingNumber(num)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
