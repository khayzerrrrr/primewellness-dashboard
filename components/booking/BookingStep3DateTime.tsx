"use client";

import { useState } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { Doctor } from "@/types";
import { TIME_SLOTS } from "@/lib/constants";
import { id as idLocale } from "date-fns/locale";

interface Props {
  doctor: Doctor | null;
  selectedDate: Date | null;
  selectedTime: string;
  onSelect: (date: Date, timeSlot: string) => void;
  onBack: () => void;
}

const DAY_MAP: Record<number, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
};

export function BookingStep3DateTime({ doctor, selectedDate, selectedTime, onSelect, onBack }: Props) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState(selectedTime);

  const availableDays = doctor?.schedule.map((s) => s.day) || [];
  const availableSlots = doctor?.schedule.find((s) => date && s.day === date.getDay())
    ? TIME_SLOTS.slice(0, doctor.schedule.find((s) => date && s.day === date.getDay())?.quota || 8)
    : TIME_SLOTS;

  const isDateDisabled = (d: Date) => {
    const dayOfWeek = d.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    if (availableDays.length === 0) return false;
    return !availableDays.includes(dayOfWeek);
  };

  const handleConfirm = () => {
    if (date && time) {
      onSelect(date, time);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pilih Tanggal & Jam</h2>
          {doctor && (
            <p className="text-gray-500 text-sm">Dokter: <span className="text-teal-600 font-medium">{doctor.fullName}</span></p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="font-medium text-slate-700 mb-3">Pilih Tanggal</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); setTime(""); }}
              disabled={isDateDisabled}
              locale={idLocale}
              className="p-3"
            />
          </div>
        </div>

        <div>
          <p className="font-medium text-slate-700 mb-3">Pilih Jam</p>
          {!date ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Pilih tanggal terlebih dahulu</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setTime(slot)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    time === slot
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!date || !time}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        size="lg"
      >
        Lanjutkan ke Konfirmasi
      </Button>
    </div>
  );
}
