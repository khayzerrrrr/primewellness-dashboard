"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation, Save, CheckCircle, Info, Camera, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getClinicSettings, updateClinicSettings } from "@/lib/firebase/firestore-service";
import { collection, getDocs, query, where, orderBy, Timestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { AttendanceLocation } from "@/types";

interface AttRec {
  id: string;
  employeeName: string;
  role: string;
  date: Date;
  clockIn?: string;
  clockOut?: string;
  clockInPhotoURL?: string;
  clockOutPhotoURL?: string;
  distanceMeters?: number;
  latitude?: number;
  longitude?: number;
  verificationStatus?: "pending" | "verified" | "rejected";
  status: string;
}

const VERIFY_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function LocationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [gettingGeo, setGettingGeo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attLoc, setAttLoc] = useState<AttendanceLocation>({
    latitude: 3.5952,
    longitude: 98.6722,
    address: "Jl. Wahidin No.207 Medan",
    radiusMeters: 150,
    lateAfterMinutes: 15,
  });

  // Pending verification
  const [pendingRecs, setPendingRecs] = useState<AttRec[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const settings = await getClinicSettings();
      if (settings?.attendanceLocation) setAttLoc(settings.attendanceLocation);

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const q = query(
        collection(db, "attendance"),
        where("verificationStatus", "==", "pending"),
        where("date", ">=", Timestamp.fromDate(threeDaysAgo)),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      setPendingRecs(snap.docs.map((d) => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() ?? new Date() }) as AttRec));
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const handleGetGPS = () => {
    setGettingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAttLoc((p) => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGettingGeo(false);
        toast.success("Koordinat GPS berhasil diambil");
      },
      () => { toast.error("Gagal mendapatkan GPS"); setGettingGeo(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClinicSettings({ attendanceLocation: attLoc });
      toast.success("Pengaturan lokasi absensi disimpan");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(false);
  };

  const handleVerify = async (rec: AttRec, status: "verified" | "rejected") => {
    setVerifyLoading(true);
    try {
      await updateDoc(doc(db, "attendance", rec.id), { verificationStatus: status });
      setPendingRecs((prev) => prev.filter((r) => r.id !== rec.id));
      toast.success(status === "verified" ? `${rec.employeeName} diverifikasi ✓` : `Absensi ${rec.employeeName} ditolak`);
    } catch { toast.error("Gagal mengubah status"); }
    setVerifyLoading(false);
  };

  if (loading) return (
    <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Setup Lokasi Absensi</h1>
        <p className="text-gray-500 text-sm">Konfigurasi geofencing dan verifikasi foto karyawan</p>
      </div>

      {/* Geofencing Setup */}
      <Card className="border-0 shadow-sm border-l-4 border-l-[#2563EB]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#0A1628] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#1B3A6B]" />
            Pengaturan Geofencing Klinik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 text-xs text-[#0A1628] bg-blue-50 px-3 py-2 rounded-lg">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Karyawan FO dan Terapis hanya bisa clock-in jika berada dalam radius yang ditentukan dari koordinat ini.
              Koordinat bisa diambil langsung dari GPS perangkat manager, atau input manual dari Google Maps.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama/Alamat Lokasi</label>
              <input value={attLoc.address} onChange={(e) => setAttLoc((p) => ({ ...p, address: e.target.value }))}
                placeholder="Contoh: Klinik Prime Wellness — Jl. Wahidin 207"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="0.000001" value={attLoc.latitude}
                onChange={(e) => setAttLoc((p) => ({ ...p, latitude: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="0.000001" value={attLoc.longitude}
                onChange={(e) => setAttLoc((p) => ({ ...p, longitude: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radius Toleransi (meter)</label>
              <input type="number" min={50} max={1000} value={attLoc.radiusMeters}
                onChange={(e) => setAttLoc((p) => ({ ...p, radiusMeters: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
              <p className="text-xs text-gray-400 mt-1">Disarankan 100–200 meter untuk klinik</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toleransi Keterlambatan (menit)</label>
              <input type="number" min={0} max={60} value={attLoc.lateAfterMinutes}
                onChange={(e) => setAttLoc((p) => ({ ...p, lateAfterMinutes: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]" />
              <p className="text-xs text-gray-400 mt-1">Clock-in setelah 08:{String(attLoc.lateAfterMinutes).padStart(2,"0")} → &quot;Terlambat&quot;</p>
            </div>
          </div>

          {/* Map preview */}
          <div className="bg-gray-100 rounded-xl overflow-hidden h-52 border border-gray-200">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${attLoc.longitude - 0.004},${attLoc.latitude - 0.004},${attLoc.longitude + 0.004},${attLoc.latitude + 0.004}&layer=mapnik&marker=${attLoc.latitude},${attLoc.longitude}`}
              className="w-full h-full border-0"
              title="Peta Lokasi Klinik"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleGetGPS} disabled={gettingGeo}
              className="gap-2 border-[#2563EB] text-[#0A1628] hover:bg-blue-50">
              <Navigation className="w-4 h-4" />
              {gettingGeo ? "Mengambil GPS..." : "Gunakan GPS Perangkat Ini"}
            </Button>
            <a href={`https://maps.google.com/?q=${attLoc.latitude},${attLoc.longitude}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50">
                <MapPin className="w-4 h-4" />
                Buka di Google Maps
              </Button>
            </a>
          </div>

          <Button onClick={handleSave} disabled={saving}
            className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-700" : "bg-[#0A1628] hover:bg-[#1B3A6B]"}`}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Tersimpan!</> : <><Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Pengaturan Lokasi"}</>}
          </Button>
        </CardContent>
      </Card>

      {/* Photo Verification */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#0A1628] flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            Verifikasi Foto Absensi
            {pendingRecs.length > 0 && (
              <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {pendingRecs.length} pending
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRecs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tidak ada absensi yang menunggu verifikasi</p>
              <p className="text-xs mt-1">Foto absensi baru dari 3 hari terakhir akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRecs.map((rec) => (
                <div key={rec.id} className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                  {/* Photo */}
                  {rec.clockInPhotoURL ? (
                    <button onClick={() => setSelectedPhoto({ url: rec.clockInPhotoURL!, name: rec.employeeName })}
                      className="flex-shrink-0 relative group">
                      <img src={rec.clockInPhotoURL} alt="Foto absensi" className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                        <span className="text-white text-[10px] opacity-0 group-hover:opacity-100">Perbesar</span>
                      </div>
                    </button>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{rec.employeeName}</p>
                    <p className="text-xs text-gray-500 capitalize">{rec.role} · {formatDate(rec.date, "dd MMM yyyy")}</p>
                    <p className="text-xs text-gray-500">
                      Clock in: {rec.clockIn || "—"}
                      {rec.distanceMeters !== undefined && ` · ${rec.distanceMeters}m dari klinik`}
                      {rec.latitude && (
                        <a href={`https://maps.google.com/?q=${rec.latitude},${rec.longitude}`} target="_blank" rel="noopener noreferrer"
                          className="ml-2 text-blue-500 hover:underline">(Lihat peta)</a>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" disabled={verifyLoading}
                      onClick={() => handleVerify(rec, "verified")}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3">
                      ✓ Verifikasi
                    </Button>
                    <Button size="sm" variant="outline" disabled={verifyLoading}
                      onClick={() => handleVerify(rec, "rejected")}
                      className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-8 px-3">
                      ✗ Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-white">
              <p className="font-semibold">{selectedPhoto.name}</p>
              <button onClick={() => setSelectedPhoto(null)} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
            </div>
            <img src={selectedPhoto.url} alt={selectedPhoto.name} className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
