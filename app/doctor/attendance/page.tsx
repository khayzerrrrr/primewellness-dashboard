"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, CheckCircle, Camera, MapPin, Clock, Image, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { getClinicSettings } from "@/lib/firebase/firestore-service";
import { ClockInCard, type ClockInResult } from "@/components/attendance/ClockInCard";
import type { AttendanceLocation } from "@/types";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: Date;
  clockIn?: string;
  clockOut?: string;
  clockInPhotoURL?: string;
  clockOutPhotoURL?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  verificationStatus?: "pending" | "verified" | "rejected";
  status: "present" | "absent" | "late" | "leave";
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  leave: "bg-blue-100 text-blue-700",
};
const STATUS_LABELS: Record<string, string> = {
  present: "Hadir",
  absent: "Tidak Hadir",
  late: "Terlambat",
  leave: "Cuti / Izin",
};

export default function TherapistAttendancePage() {
  const { user, role } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicLocation, setClinicLocation] = useState<AttendanceLocation | null>(null);
  const [mode, setMode] = useState<"view" | "clockin" | "clockout">("view");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load clinic location setting
      const settings = await getClinicSettings();
      if (settings?.attendanceLocation) setClinicLocation(settings.attendanceLocation);

      const start = new Date(todayStr); start.setHours(0, 0, 0, 0);
      const end = new Date(todayStr); end.setHours(23, 59, 59, 999);

      const todayQ = query(collection(db, "attendance"),
        where("employeeId", "==", user.uid),
        where("date", ">=", Timestamp.fromDate(start)),
        where("date", "<=", Timestamp.fromDate(end))
      );
      const todaySnap = await getDocs(todayQ);
      if (!todaySnap.empty) {
        const d = todaySnap.docs[0];
        setTodayRecord({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() ?? new Date() } as AttendanceRecord);
      }

      const histStart = new Date();
      histStart.setDate(histStart.getDate() - 30);
      const histQ = query(collection(db, "attendance"),
        where("employeeId", "==", user.uid),
        where("date", ">=", Timestamp.fromDate(histStart)),
        orderBy("date", "desc")
      );
      const histSnap = await getDocs(histQ);
      setHistory(histSnap.docs.map((d) => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() ?? new Date() }) as AttendanceRecord));
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const getStatus = (clockInTime: string): "present" | "late" => {
    const [h, m] = clockInTime.split(":").map(Number);
    const lateMinutes = clinicLocation?.lateAfterMinutes ?? 15;
    const openHour = 8;
    const totalMinutes = h * 60 + m;
    const thresholdMinutes = openHour * 60 + lateMinutes;
    return totalMinutes > thresholdMinutes ? "late" : "present";
  };

  const handleClockIn = async (result: ClockInResult) => {
    if (!user) return;
    const timeNow = result.timestamp.toTimeString().slice(0, 5);
    const status = getStatus(timeNow);
    const ref = await addDoc(collection(db, "attendance"), {
      employeeId: user.uid,
      employeeName: user.displayName || "Staff",
      role: role || "therapist",
      date: Timestamp.fromDate(now),
      clockIn: timeNow,
      clockInPhotoURL: result.photoURL,
      latitude: result.geo.latitude,
      longitude: result.geo.longitude,
      distanceMeters: result.geo.distanceMeters,
      status,
      verificationStatus: "pending",
      notes: status === "late" ? "Terlambat" : "",
    });
    setTodayRecord({
      id: ref.id,
      employeeId: user.uid,
      employeeName: user.displayName || "Staff",
      role: role || "therapist",
      date: now,
      clockIn: timeNow,
      clockInPhotoURL: result.photoURL,
      latitude: result.geo.latitude,
      longitude: result.geo.longitude,
      distanceMeters: result.geo.distanceMeters,
      status,
      verificationStatus: "pending",
    });
    setMode("view");
  };

  const handleClockOut = async (result: ClockInResult) => {
    if (!todayRecord) return;
    const timeNow = result.timestamp.toTimeString().slice(0, 5);
    await updateDoc(doc(db, "attendance", todayRecord.id), {
      clockOut: timeNow,
      clockOutPhotoURL: result.photoURL,
    });
    setTodayRecord((prev) => prev ? { ...prev, clockOut: timeNow, clockOutPhotoURL: result.photoURL } : prev);
    setMode("view");
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Absensi Saya</h1>
        <p className="text-gray-500 text-sm">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
      </div>

      {/* Location info */}
      {clinicLocation && (
        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Area klinik: {clinicLocation.address}</span>
            <br />
            Radius {clinicLocation.radiusMeters}m · Terlambat setelah 08:{String(clinicLocation.lateAfterMinutes).padStart(2,"0")}
          </div>
        </div>
      )}

      {/* Clock In/Out Widget */}
      {mode === "clockin" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#0A1628] flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto Selfie Clock In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClockInCard
              userId={user?.uid || ""}
              clinicLocation={clinicLocation}
              lateAfterMinutes={clinicLocation?.lateAfterMinutes}
              onSuccess={handleClockIn}
              label="Konfirmasi Clock In"
            />
          </CardContent>
        </Card>
      )}

      {mode === "clockout" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#0A1628] flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto Selfie Clock Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClockInCard
              userId={user?.uid || ""}
              clinicLocation={clinicLocation}
              onSuccess={handleClockOut}
              label="Konfirmasi Clock Out"
            />
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      {mode === "view" && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#0A1628] to-[#1B3A6B] text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-white/70 text-sm mb-2">Status Hari Ini</p>
                {!todayRecord ? (
                  <p className="text-2xl font-bold text-white/50">Belum Absen</p>
                ) : (
                  <>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      todayRecord.status === "present" ? "bg-green-400/20 text-green-200"
                        : todayRecord.status === "late" ? "bg-yellow-400/20 text-yellow-200"
                        : "bg-red-400/20 text-red-200"
                    }`}>
                      {STATUS_LABELS[todayRecord.status]}
                    </span>
                    <div className="flex gap-8 mt-4">
                      <div>
                        <p className="text-white/50 text-xs">Masuk</p>
                        <p className="text-2xl font-bold">{todayRecord.clockIn || "—"}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-xs">Keluar</p>
                        <p className="text-2xl font-bold">{todayRecord.clockOut || "—"}</p>
                      </div>
                    </div>
                    {todayRecord.distanceMeters !== undefined && (
                      <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {todayRecord.distanceMeters}m dari klinik saat absen
                      </p>
                    )}
                    {todayRecord.verificationStatus === "pending" && (
                      <p className="text-yellow-300/70 text-xs mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Menunggu verifikasi manager
                      </p>
                    )}
                    {todayRecord.verificationStatus === "verified" && (
                      <p className="text-green-300/70 text-xs mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Sudah diverifikasi
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Photos preview */}
              {todayRecord && (
                <div className="flex gap-2">
                  {todayRecord.clockInPhotoURL && (
                    <div className="text-center">
                      <img src={todayRecord.clockInPhotoURL} alt="Foto masuk" className="w-16 h-16 rounded-xl object-cover border-2 border-white/20" />
                      <p className="text-white/50 text-[10px] mt-1">Masuk</p>
                    </div>
                  )}
                  {todayRecord.clockOutPhotoURL && (
                    <div className="text-center">
                      <img src={todayRecord.clockOutPhotoURL} alt="Foto keluar" className="w-16 h-16 rounded-xl object-cover border-2 border-white/20" />
                      <p className="text-white/50 text-[10px] mt-1">Keluar</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-3">
              {!todayRecord && (
                <Button onClick={() => setMode("clockin")} className="bg-green-500 hover:bg-green-400 text-white gap-2">
                  <LogIn className="w-4 h-4" />
                  Clock In dengan Foto
                </Button>
              )}
              {todayRecord && !todayRecord.clockOut && (
                <Button onClick={() => setMode("clockout")} className="bg-orange-500 hover:bg-orange-400 text-white gap-2">
                  <LogOut className="w-4 h-4" />
                  Clock Out dengan Foto
                </Button>
              )}
              {todayRecord?.clockOut && (
                <div className="flex items-center gap-2 text-green-300 text-sm">
                  <CheckCircle className="w-5 h-5" />
                  Absensi hari ini selesai
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#0A1628]">Riwayat 30 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Belum ada riwayat absensi</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  {rec.clockInPhotoURL ? (
                    <img src={rec.clockInPhotoURL} alt="Foto" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Image className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{formatDate(rec.date, "dd MMM yyyy")}</p>
                    <p className="text-xs text-gray-500">
                      {rec.clockIn || "—"} → {rec.clockOut || "—"}
                      {rec.distanceMeters !== undefined && ` · ${rec.distanceMeters}m`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rec.status]}`}>
                      {STATUS_LABELS[rec.status]}
                    </span>
                    {rec.verificationStatus && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        rec.verificationStatus === "verified" ? "bg-green-100 text-green-700"
                          : rec.verificationStatus === "rejected" ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {rec.verificationStatus === "verified" ? "✓ Verified" : rec.verificationStatus === "rejected" ? "✗ Ditolak" : "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
