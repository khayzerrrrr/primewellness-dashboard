"use client";

import { useEffect, useState } from "react";
import { Settings, Percent, Save, Building2, Clock, CheckCircle, Plus, Trash2, CreditCard, Phone, Globe, Instagram, MapPin, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getClinicSettings, updateClinicSettings } from "@/lib/firebase/firestore-service";
import { DEFAULT_COMMISSION_RATE, CLINIC_INFO } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { ClinicSettings, BankAccount, OperationalHours, AttendanceLocation } from "@/types";

const DEFAULT_OPS_HOURS: OperationalHours[] = [
  { day: "Senin", open: "08:00", close: "20:00", isClosed: false },
  { day: "Selasa", open: "08:00", close: "20:00", isClosed: false },
  { day: "Rabu", open: "08:00", close: "20:00", isClosed: false },
  { day: "Kamis", open: "08:00", close: "20:00", isClosed: false },
  { day: "Jumat", open: "08:00", close: "20:00", isClosed: false },
  { day: "Sabtu", open: "09:00", close: "18:00", isClosed: false },
  { day: "Minggu", open: "10:00", close: "17:00", isClosed: false },
];

export default function OwnerSettingsPage() {
  const [settings, setSettings] = useState<Partial<ClinicSettings> | null>(null);
  const [loading, setLoading] = useState(true);

  // Commission
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);

  // Clinic info
  const [clinicName, setClinicName] = useState("Prime Wellness Therapy & Reliefy");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicWhatsapp, setClinicWhatsapp] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");

  // Operational hours
  const [opsHours, setOpsHours] = useState<OperationalHours[]>(DEFAULT_OPS_HOURS);

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Social
  const [instagram, setInstagram] = useState("");

  // Attendance Location
  const [attLoc, setAttLoc] = useState<AttendanceLocation>({
    latitude: 3.5952,
    longitude: 98.6722,
    address: "Jl. Wahidin No.207 Medan",
    radiusMeters: 150,
    lateAfterMinutes: 15,
  });
  const [gettingGeo, setGettingGeo] = useState(false);

  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    getClinicSettings().then((s) => {
      if (s) {
        setSettings(s);
        if (s.commissionRate !== undefined) setCommissionRate(s.commissionRate);
        if (s.clinicName) setClinicName(s.clinicName);
        if (s.email) setClinicEmail(s.email);
        if (s.whatsapp) setClinicWhatsapp(s.whatsapp);
        if (s.address) setClinicAddress(s.address);
        if (s.operationalHours?.length) setOpsHours(s.operationalHours);
        if (s.bankAccounts?.length) setBankAccounts(s.bankAccounts);
        if (s.socialMedia?.instagram) setInstagram(s.socialMedia.instagram);
        if (s.attendanceLocation) setAttLoc(s.attendanceLocation);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 3000);
  };

  const handleSaveCommission = async () => {
    setSaving("commission");
    try {
      await updateClinicSettings({ commissionRate });
      toast.success(`Komisi diperbarui menjadi ${commissionRate}%`);
      markSaved("commission");
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(null);
  };

  const handleSaveInfo = async () => {
    setSaving("info");
    try {
      await updateClinicSettings({ clinicName, email: clinicEmail, whatsapp: clinicWhatsapp, address: clinicAddress });
      toast.success("Informasi klinik disimpan");
      markSaved("info");
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(null);
  };

  const handleSaveOps = async () => {
    setSaving("ops");
    try {
      await updateClinicSettings({ operationalHours: opsHours });
      toast.success("Jam operasional disimpan");
      markSaved("ops");
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(null);
  };

  const handleSaveBank = async () => {
    setSaving("bank");
    try {
      await updateClinicSettings({ bankAccounts });
      toast.success("Rekening bank disimpan");
      markSaved("bank");
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(null);
  };

  const handleSaveAttLoc = async () => {
    setSaving("attloc");
    try {
      await updateClinicSettings({ attendanceLocation: attLoc });
      toast.success("Lokasi absensi disimpan");
      markSaved("attloc");
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(null);
  };

  const handleGetCurrentLocation = () => {
    setGettingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAttLoc((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setGettingGeo(false);
        toast.success("Koordinat berhasil diambil dari GPS perangkat ini");
      },
      () => { toast.error("Gagal mendapatkan lokasi GPS"); setGettingGeo(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveSocial = async () => {
    setSaving("social");
    try {
      await updateClinicSettings({ socialMedia: { instagram, facebook: settings?.socialMedia?.facebook } });
      toast.success("Media sosial disimpan");
      markSaved("social");
    } catch { toast.error("Gagal menyimpan"); }
    setSaving(null);
  };

  const addBank = () => setBankAccounts((prev) => [...prev, { bankName: "", accountNumber: "", accountName: "" }]);
  const removeBank = (i: number) => setBankAccounts((prev) => prev.filter((_, j) => j !== i));
  const updateBank = (i: number, field: keyof BankAccount, value: string) =>
    setBankAccounts((prev) => prev.map((b, j) => j === i ? { ...b, [field]: value } : b));
  const updateOps = (i: number, field: keyof OperationalHours, value: unknown) =>
    setOpsHours((prev) => prev.map((h, j) => j === i ? { ...h, [field]: value } : h));

  const previewPrices = [150000, 200000, 250000, 300000, 400000, 500000];
  const SaveBtn = ({ skey, onClick }: { skey: string; onClick: () => void }) => (
    <Button onClick={onClick} disabled={saving === skey}
      className={`gap-2 transition-colors ${saved === skey ? "bg-green-600 hover:bg-green-700" : "bg-[#1a2744] hover:bg-[#2a3a60]"}`}>
      {saved === skey ? <><CheckCircle className="w-4 h-4" /> Tersimpan!</> : <><Save className="w-4 h-4" /> {saving === skey ? "Menyimpan..." : "Simpan"}</>}
    </Button>
  );

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2744]">Pengaturan Klinik</h1>
        <p className="text-gray-500 text-sm">Konfigurasi sistem untuk owner & super admin</p>
      </div>

      {/* Clinic Info */}
      <Card className="border-0 shadow-sm border-l-4 border-l-blue-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Informasi Klinik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Nama Klinik", value: clinicName, set: setClinicName, placeholder: "Nama klinik" },
              { label: "Email", value: clinicEmail, set: setClinicEmail, placeholder: "email@klinik.com" },
              { label: "WhatsApp", value: clinicWhatsapp, set: setClinicWhatsapp, placeholder: "08xxxxxxxxxx" },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)}
                placeholder="Alamat lengkap klinik" rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] resize-none" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <strong>Data saat ini dari CLINIC_INFO:</strong> {CLINIC_INFO.address} · WA: {CLINIC_INFO.phone}
          </div>
          <SaveBtn skey="info" onClick={handleSaveInfo} />
        </CardContent>
      </Card>

      {/* Commission Rate */}
      <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
            <Percent className="w-5 h-5 text-orange-500" />
            Komisi Terapis Default
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-sm text-orange-800 mb-3">Persentase komisi default yang berlaku untuk semua terapis.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={commissionRate}
                  onChange={(e) => setCommissionRate(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-24 border-2 border-orange-300 rounded-xl px-3 py-3 text-2xl font-bold text-center text-orange-700 focus:outline-none focus:border-orange-500 bg-white" />
                <span className="text-2xl font-bold text-orange-600">%</span>
              </div>
              <p className="text-sm text-orange-700">Contoh: Rp 300.000 → komisi <strong>{formatCurrency(Math.round(300000 * commissionRate / 100))}</strong></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {previewPrices.map((price) => (
              <div key={price} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{formatCurrency(price)}</p>
                <p className="font-bold text-green-700 text-sm">+{formatCurrency(Math.round(price * commissionRate / 100))}</p>
              </div>
            ))}
          </div>
          <SaveBtn skey="commission" onClick={handleSaveCommission} />
        </CardContent>
      </Card>

      {/* Operational Hours */}
      <Card className="border-0 shadow-sm border-l-4 border-l-teal-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            Jam Operasional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {opsHours.map((h, i) => (
            <div key={h.day} className="flex items-center gap-3">
              <span className="w-16 text-sm font-medium text-gray-700">{h.day}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={!h.isClosed}
                  onChange={(e) => updateOps(i, "isClosed", !e.target.checked)}
                  className="accent-[#1a2744]" />
                <span className="text-xs text-gray-500">Buka</span>
              </label>
              {h.isClosed ? (
                <span className="text-xs text-red-500 font-medium ml-2">Tutup</span>
              ) : (
                <>
                  <input type="time" value={h.open} onChange={(e) => updateOps(i, "open", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2744]" />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="time" value={h.close} onChange={(e) => updateOps(i, "close", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2744]" />
                </>
              )}
            </div>
          ))}
          <div className="pt-2">
            <SaveBtn skey="ops" onClick={handleSaveOps} />
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      <Card className="border-0 shadow-sm border-l-4 border-l-green-400">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              Rekening Bank (untuk Invoice)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addBank} className="gap-1 text-xs h-8">
              <Plus className="w-3 h-3" /> Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {bankAccounts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Belum ada rekening bank. Rekening akan muncul di invoice.</p>
          ) : bankAccounts.map((bank, i) => (
            <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { field: "bankName" as keyof BankAccount, placeholder: "Nama Bank (BCA, Mandiri...)" },
                  { field: "accountNumber" as keyof BankAccount, placeholder: "Nomor Rekening" },
                  { field: "accountName" as keyof BankAccount, placeholder: "Nama Pemilik Rekening" },
                ].map((f) => (
                  <input key={f.field} value={bank[f.field]} onChange={(e) => updateBank(i, f.field, e.target.value)}
                    placeholder={f.placeholder}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2744]" />
                ))}
              </div>
              <button onClick={() => removeBank(i)} className="text-gray-300 hover:text-red-500 transition-colors mt-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <SaveBtn skey="bank" onClick={handleSaveBank} />
        </CardContent>
      </Card>

      {/* Attendance Location */}
      <Card className="border-0 shadow-sm border-l-4 border-l-teal-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Setup Lokasi Absensi (Geofencing)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-teal-50 rounded-lg p-3 text-xs text-teal-700">
            Karyawan hanya bisa clock-in jika berada dalam radius yang ditentukan dari koordinat klinik. GPS diverifikasi otomatis saat absen.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lokasi (label)</label>
              <input value={attLoc.address} onChange={(e) => setAttLoc((p) => ({ ...p, address: e.target.value }))}
                placeholder="Nama/alamat lokasi klinik"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radius Toleransi (meter)</label>
              <input type="number" min={50} max={1000} value={attLoc.radiusMeters}
                onChange={(e) => setAttLoc((p) => ({ ...p, radiusMeters: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="0.000001" value={attLoc.latitude}
                onChange={(e) => setAttLoc((p) => ({ ...p, latitude: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="0.000001" value={attLoc.longitude}
                onChange={(e) => setAttLoc((p) => ({ ...p, longitude: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toleransi Keterlambatan (menit setelah 08:00)</label>
              <input type="number" min={0} max={60} value={attLoc.lateAfterMinutes}
                onChange={(e) => setAttLoc((p) => ({ ...p, lateAfterMinutes: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <p className="text-xs text-gray-400 mt-1">Contoh: 15 → dianggap terlambat jika clock-in setelah 08:15</p>
            </div>
          </div>

          {/* Map Preview */}
          <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 h-48">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${attLoc.longitude - 0.005},${attLoc.latitude - 0.005},${attLoc.longitude + 0.005},${attLoc.latitude + 0.005}&layer=mapnik&marker=${attLoc.latitude},${attLoc.longitude}`}
              className="w-full h-full border-0"
              title="Lokasi Klinik"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleGetCurrentLocation} disabled={gettingGeo} className="gap-2 border-teal-500 text-teal-700 hover:bg-teal-50">
              <Navigation className="w-4 h-4" />
              {gettingGeo ? "Mengambil GPS..." : "Ambil Lokasi GPS Perangkat Ini"}
            </Button>
            <a href={`https://www.google.com/maps/search/${attLoc.latitude},${attLoc.longitude}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50">
                <MapPin className="w-4 h-4" />
                Cek di Google Maps
              </Button>
            </a>
          </div>

          <SaveBtn skey="attloc" onClick={handleSaveAttLoc} />
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="border-0 shadow-sm border-l-4 border-l-pink-400">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#1a2744] flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            Media Sosial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <div className="flex gap-2 items-center">
              <span className="text-gray-400 text-sm">@</span>
              <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="primewellness.id"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
            </div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-xs text-pink-700">
            Saat ini: @{CLINIC_INFO.instagram?.split("/").filter(Boolean).pop() ?? "primewellness.id"}
          </div>
          <SaveBtn skey="social" onClick={handleSaveSocial} />
        </CardContent>
      </Card>
    </div>
  );
}
