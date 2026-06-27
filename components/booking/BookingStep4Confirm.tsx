"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Calendar, User, Clock, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { createAppointment, updateAppointmentGoogleEventId } from "@/lib/firebase/firestore-service";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Service, Doctor } from "@/types";

interface BookingDataPartial {
  service: Service | null;
  doctor: Doctor | null;
  date: Date | null;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes: string;
}

interface Props {
  bookingData: BookingDataPartial;
  onUpdate: (data: Partial<BookingDataPartial>) => void;
  onBack: () => void;
  onSuccess: (bookingNumber: string) => void;
}

export function BookingStep4Confirm({ bookingData, onUpdate, onBack, onSuccess }: Props) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const patientName =
    bookingData.patientName ||
    (userData?.displayName as string) ||
    user?.displayName ||
    "";

  const handleConfirm = async () => {
    if (!bookingData.service || !bookingData.doctor || !bookingData.date) {
      toast.error("Data booking tidak lengkap");
      return;
    }
    if (!bookingData.patientName || !bookingData.patientPhone) {
      toast.error("Nama dan nomor HP wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { id: appointmentId, bookingNumber } = await createAppointment({
        patientId: user?.uid || "guest",
        patientName: bookingData.patientName,
        patientEmail: bookingData.patientEmail || user?.email || undefined,
        patientPhone: bookingData.patientPhone,
        doctorId: bookingData.doctor.id,
        doctorName: bookingData.doctor.fullName,
        serviceId: bookingData.service.id,
        serviceName: bookingData.service.name,
        servicePrice: bookingData.service.price,
        serviceDuration: bookingData.service.duration,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        notes: bookingData.notes,
        status: "pending",
      });

      // Sync to Google Calendar (non-blocking)
      try {
        const calRes = await fetch("/api/calendar/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            bookingNumber,
            patientName: bookingData.patientName,
            patientEmail: bookingData.patientEmail || user?.email || undefined,
            doctorName: bookingData.doctor.fullName,
            serviceName: bookingData.service.name,
            date: bookingData.date.toISOString(),
            timeSlot: bookingData.timeSlot,
            durationMinutes: bookingData.service.duration,
            notes: bookingData.notes || undefined,
          }),
        });
        if (calRes.ok) {
          const { eventId } = await calRes.json();
          if (eventId) await updateAppointmentGoogleEventId(appointmentId, eventId);
        }
      } catch {}

      // Send WhatsApp notification
      try {
        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: bookingData.patientPhone,
            type: "booking_created",
            data: {
              bookingNumber,
              patientName: bookingData.patientName,
              serviceName: bookingData.service.name,
              doctorName: bookingData.doctor.fullName,
              date: formatDate(bookingData.date),
              time: bookingData.timeSlot,
            },
          }),
        });
      } catch {}

      onSuccess(bookingNumber);
    } catch {
      toast.error("Gagal membuat booking. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-slate-900">Konfirmasi Booking</h2>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-5 h-5 text-[#1B3A6B]" />
          <div>
            <p className="text-xs text-gray-500">Layanan</p>
            <p className="font-semibold text-slate-800">{bookingData.service?.name}</p>
            <p className="text-[#0A1628] font-bold">{bookingData.service && formatCurrency(bookingData.service.price)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-[#1B3A6B]" />
          <div>
            <p className="text-xs text-gray-500">Dokter</p>
            <p className="font-semibold text-slate-800">{bookingData.doctor?.fullName}</p>
            <p className="text-sm text-gray-600">{bookingData.doctor?.specialization}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#1B3A6B]" />
          <div>
            <p className="text-xs text-gray-500">Tanggal & Jam</p>
            <p className="font-semibold text-slate-800">
              {bookingData.date && formatDate(bookingData.date)} • {bookingData.timeSlot}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">Informasi Pasien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Lengkap *</Label>
            <Input
              value={bookingData.patientName}
              onChange={(e) => onUpdate({ patientName: e.target.value })}
              defaultValue={patientName}
              placeholder="Nama sesuai KTP"
            />
          </div>
          <div className="space-y-2">
            <Label>Nomor HP *</Label>
            <Input
              value={bookingData.patientPhone}
              onChange={(e) => onUpdate({ patientPhone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              type="tel"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Email</Label>
            <Input
              value={bookingData.patientEmail}
              onChange={(e) => onUpdate({ patientEmail: e.target.value })}
              defaultValue={user?.email || ""}
              type="email"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Catatan (opsional)</Label>
            <Textarea
              value={bookingData.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Keluhan atau catatan tambahan..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleConfirm}
        disabled={loading || !bookingData.patientName || !bookingData.patientPhone}
        className="w-full bg-[#1B3A6B] hover:bg-[#0A1628] text-white"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memproses Booking...
          </>
        ) : (
          "Konfirmasi Booking"
        )}
      </Button>
    </div>
  );
}
