"use client";

import { useEffect, useState } from "react";
import { UserPlus, CheckCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getServices, createPatient } from "@/lib/firebase/firestore-service";
import { useAuth } from "@/contexts/AuthContext";
import type { Service } from "@/types";

const BLOOD_TYPES = ["A", "B", "AB", "O", "Tidak Tahu"];
const REFERRAL_SOURCES = ["Media Sosial", "Teman / Keluarga", "Google", "Spanduk", "Lainnya"];
const GENDERS = [{ label: "Laki-laki", value: "male" }, { label: "Perempuan", value: "female" }];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  bloodType: string;
  allergies: string;
  mainComplaint: string;
  referralSource: string;
  selectedServiceId: string;
}

const INIT: FormData = {
  fullName: "", email: "", phone: "", dob: "", gender: "female",
  address: "", bloodType: "Tidak Tahu", allergies: "",
  mainComplaint: "", referralSource: "Teman / Keluarga", selectedServiceId: "",
};

export default function RegisterPatientPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormData>(INIT);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [patientId, setPatientId] = useState("");

  useEffect(() => {
    getServices(true).then(setServices).catch(() => {});
  }, []);

  const set = (k: keyof FormData, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return;
    setSaving(true);
    try {
      const patient = await createPatient({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dob ? new Date(form.dob) : undefined,
        gender: form.gender as "male" | "female",
        address: form.address,
        bloodType: form.bloodType || undefined,
        allergies: form.allergies ? form.allergies.split(",").map((a: string) => a.trim()) : [],
        mainComplaint: form.mainComplaint,
        referralSource: form.referralSource,
        registeredBy: user?.uid,
      });
      setPatientId(patient.id ?? "");
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Gagal mendaftarkan pasien. Silakan coba lagi.");
    }
    setSaving(false);
  };

  const selectedService = services.find((s) => s.id === form.selectedServiceId);

  if (done) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Registrasi Pasien</h1>
          <p className="text-gray-500 text-sm">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <Card className="border-0 shadow-sm max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0A1628] mb-2">Pasien Berhasil Didaftarkan!</h2>
            <p className="text-gray-600 mb-1">Nama: <strong>{form.fullName}</strong></p>
            <p className="text-gray-500 text-sm mb-6">ID Pasien: <code className="bg-gray-100 px-2 py-0.5 rounded">{patientId}</code></p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setForm(INIT); setDone(false); }}>
                Daftarkan Pasien Lain
              </Button>
              <Button className="bg-[#0A1628] hover:bg-[#1B3A6B]" asChild>
                <a href="/admin/appointments">Buat Booking Sekarang →</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Registrasi Pasien Baru</h1>
        <p className="text-gray-500 text-sm">{formatDate(new Date(), "EEEE, dd MMMM yyyy")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Diri */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#0A1628] flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Data Diri Pasien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Nama Lengkap *</label>
                <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Nama sesuai KTP" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">No. HP / WhatsApp *</label>
                <input required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="08xxxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="email@gmail.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Tanggal Lahir</label>
                <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Jenis Kelamin</label>
                <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]">
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Alamat</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)}
                  placeholder="Jl. ..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Golongan Darah</label>
                <select value={form.bloodType} onChange={(e) => set("bloodType", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]">
                  {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Alergi (pisah koma)</label>
                <input value={form.allergies} onChange={(e) => set("allergies", e.target.value)}
                  placeholder="Contoh: Udang, Penisilin" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keluhan & Layanan */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#0A1628]">Keluhan & Pilihan Layanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Keluhan Utama *</label>
              <textarea required value={form.mainComplaint} onChange={(e) => set("mainComplaint", e.target.value)}
                rows={3} placeholder="Ceritakan keluhan utama pasien..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Pilih Layanan (opsional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => set("selectedServiceId", form.selectedServiceId === s.id ? "" : s.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      form.selectedServiceId === s.id
                        ? "border-[#0A1628] bg-[#0A1628]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm text-slate-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.duration} menit</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Sumber Referral</label>
              <select value={form.referralSource} onChange={(e) => set("referralSource", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]">
                {REFERRAL_SOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full h-12 bg-[#0A1628] hover:bg-[#1B3A6B] text-white text-base gap-2">
          {saving ? "Mendaftarkan..." : (
            <>
              <UserPlus className="w-5 h-5" />
              Daftarkan Pasien
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
