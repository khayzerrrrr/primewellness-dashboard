"use client";

import { useState } from "react";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { Doctor } from "@/types";
import { TIME_SLOTS } from "@/lib/constants";
import { id as idLocale } from "date-fns/locale";
import { useBookedSlots } from "@/hooks/useBookedSlots";

interface Props {
  doctor: Doctor | null;
  selectedDate: Date | null;
  selectedTime: string;
  onSelect: (date: Date, timeSlot: string) => void;
  onBack: () => void;
}

export function BookingStep3DateTime({ doctor, selectedDate, selectedTime, onSelect, onBack }: Props) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState(selectedTime);

  const { isBlocked, loading: slotsLoading } = useBookedSlots(doctor?.id, date);

  const availableDays = doctor?.schedule.map((s) => s.day) || [];

  const isDateDisabled = (d: Date) => {
    const dayOfWeek = d.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    if (availableDays.length === 0) return false;
    return !availableDays.includes(dayOfWeek);
  };

  const handleConfirm = () => {
    if (date && time) onSelect(date, time);
  };

  const availableCount = date
    ? TIME_SLOTS.filter((s) => !isBlocked(s)).length
    : TIME_SLOTS.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pilih Tanggal & Jam</h2>
          {doctor && (
            <p className="text-gray-500 text-sm">
              Terapis: <span className="text-[#1B3A6B] font-medium">{doctor.fullName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
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

        {/* Time slots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-slate-700">Pilih Jam</p>
            {date && !slotsLoading && (
              <p className="text-xs text-gray-400">
                {availableCount} slot tersedia
              </p>
            )}
          </div>

          {!date ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Pilih tanggal terlebih dahulu</p>
            </div>
          ) : slotsLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => (
                <div key={slot} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-[#1B3A6B] inline-block" /> Pilihan Anda
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> Tersedia
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Sudah dipesan
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const blocked = isBlocked(slot);
                  const selected = time === slot;

                  return (
                    <div key={slot} className="relative group">
                      <button
                        onClick={() => { if (!blocked) setTime(slot); }}
                        disabled={blocked}
                        className={`w-full py-2.5 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1
                          ${selected
                            ? "bg-[#1B3A6B] text-white shadow-md"
                            : blocked
                              ? "bg-red-50 text-red-300 border border-red-200 cursor-not-allowed"
                              : "bg-green-50 text-green-700 border border-green-200 hover:bg-blue-50 hover:border-blue-300 hover:text-[#0A1628]"
                          }`}
                      >
                        {selected ? (
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        ) : blocked ? (
                          <XCircle className="w-3 h-3 flex-shrink-0 text-red-300" />
                        ) : null}
                        {slot}
                      </button>
                      {blocked && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 hidden group-hover:flex items-center whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg pointer-events-none">
                          Sudah dipesan
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!date || !time}
        className="w-full bg-[#1B3A6B] hover:bg-[#0A1628] text-white"
        size="lg"
      >
        Lanjutkan ke Konfirmasi
      </Button>
    </div>
  );
}
