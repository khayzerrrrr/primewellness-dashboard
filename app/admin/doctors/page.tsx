"use client";

import { useEffect, useState } from "react";
import { UserCheck, Plus, Pencil, ToggleLeft, ToggleRight, Percent, Award, X, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getDoctors, createDoctor, updateDoctor } from "@/lib/firebase/firestore-service";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getInitials } from "@/lib/utils";
import { THERAPIST_SPECIALIZATIONS, DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import type { Doctor } from "@/types";

interface TherapistForm {
  fullName: string;
  email: string;
  phone: string;
  specializations: string[];
  certificationNumber: string;
  bio: string;
  commissionRate: number;
}

const BLANK: TherapistForm = {
  fullName: "", email: "", phone: "",
  specializations: [], certificationNumber: "",
  bio: "", commissionRate: DEFAULT_COMMISSION_RATE,
};

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TherapistForm>(BLANK);
  const [ratingMap, setRatingMap] = useState<Record<string, { avg: number; count: number }>>({});

  const set = (k: keyof TherapistForm, v: TherapistForm[keyof TherapistForm]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleSpec = (spec: string) => {
    setForm((prev) => {
      const exists = prev.specializations.includes(spec);
      return {
        ...prev,
        specializations: exists
          ? prev.specializations.filter((s) => s !== spec)
          : [...prev.specializations, spec],
      };
    });
  };

  const load = async () => {
    const data = await getDoctors(false);
    setDoctors(data);
    // Load ratings
    try {
      const rSnap = await getDocs(collection(db, "reviews"));
      const map: Record<string, { total: number; count: number }> = {};
      rSnap.docs.forEach((d) => {
        const r = d.data() as { therapistId?: string; rating?: number };
        if (r.therapistId && r.rating) {
          if (!map[r.therapistId]) map[r.therapistId] = { total: 0, count: 0 };
          map[r.therapistId].total += r.rating;
          map[r.therapistId].count += 1;
        }
      });
      const rMap: Record<string, { avg: number; count: number }> = {};
      Object.entries(map).forEach(([id, v]) => {
        rMap[id] = { avg: Math.round((v.total / v.count) * 10) / 10, count: v.count };
      });
      setRatingMap(rMap);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK);
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditTarget(d);
    setForm({
      fullName: d.fullName,
      email: d.email,
      phone: d.phone,
      specializations: d.specializations ?? (d.specialization ? [d.specialization] : []),
      certificationNumber: d.certificationNumber ?? "",
      bio: d.bio ?? "",
      commissionRate: d.commissionRate ?? DEFAULT_COMMISSION_RATE,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || form.specializations.length === 0) {
      toast.error("Nama, nomor HP, dan minimal 1 keahlian wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        specialization: form.specializations[0], // primary
        specializations: form.specializations,
        certificationNumber: form.certificationNumber,
        bio: form.bio,
        commissionRate: form.commissionRate,
      };

      if (editTarget) {
        await updateDoctor(editTarget.id, payload);
        toast.success("Data terapis berhasil diperbarui");
      } else {
        await createDoctor({
          userId: "",
          isActive: true,
          schedule: [],
          ...payload,
        });
        toast.success("Terapis berhasil ditambahkan");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Gagal menyimpan data terapis");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (d: Doctor) => {
    await updateDoctor(d.id, { isActive: !d.isActive });
    setDoctors((prev) => prev.map((t) => t.id === d.id ? { ...t, isActive: !d.isActive } : t));
    toast.success(`Terapis ${!d.isActive ? "diaktifkan" : "dinonaktifkan"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Terapis ({doctors.length})</h1>
          <p className="text-gray-500 text-sm">Kelola data terapis klinik</p>
        </div>
        <Button className="bg-[#0A1628] hover:bg-[#1B3A6B] gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Terapis
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada terapis terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <Card key={d.id} className={`border-0 shadow-sm overflow-hidden ${!d.isActive ? "opacity-60" : ""}`}>
              <div className="h-1.5 bg-gradient-to-r from-[#0A1628] to-blue-400" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-[#0A1628] text-white font-bold">
                        {getInitials(d.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{d.fullName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {d.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(d.specializations ?? (d.specialization ? [d.specialization] : [])).slice(0, 3).map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {(d.specializations?.length ?? 0) > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      +{d.specializations!.length - 3} lagi
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-500 mb-3">
                  <p>{d.phone}</p>
                  {d.email && <p>{d.email}</p>}
                  {d.certificationNumber && (
                    <p className="text-[#0A1628] font-mono flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {d.certificationNumber}
                    </p>
                  )}
                </div>

                {/* Commission + Rating badges */}
                <div className="flex gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-orange-50 rounded-lg px-3 py-2 flex-1">
                    <Percent className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs text-orange-700 font-medium">
                      Komisi: {d.commissionRate ?? DEFAULT_COMMISSION_RATE}%
                    </span>
                  </div>
                  {ratingMap[d.id] ? (
                    <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-3 py-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span className="text-xs text-amber-700 font-medium">
                        {ratingMap[d.id].avg} ({ratingMap[d.id].count})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-2">
                      <Star className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-xs text-gray-400">—</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8 gap-1"
                    onClick={() => openEdit(d)}
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleActive(d)}
                    title={d.isActive ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {d.isActive
                      ? <ToggleRight className="w-4 h-4 text-green-500" />
                      : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0A1628]">
              {editTarget ? "Edit Data Terapis" : "Tambah Terapis Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-5 pt-2">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nama Lengkap *</label>
                <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Nama lengkap terapis"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">No. HP *</label>
                  <input required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="email@..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">No. Sertifikat / Izin Praktik</label>
                <input value={form.certificationNumber} onChange={(e) => set("certificationNumber", e.target.value)}
                  placeholder="Contoh: CERT-TCM-2024-XXXX"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
              </div>
            </div>

            {/* Specializations multi-select */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Keahlian / Spesialisasi *
                <span className="text-gray-400 font-normal ml-1">(pilih satu atau lebih)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {THERAPIST_SPECIALIZATIONS.map((spec) => {
                  const selected = form.specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpec(spec)}
                      className={`text-xs px-3 py-1.5 rounded-full border-2 transition-colors font-medium ${
                        selected
                          ? "border-[#0A1628] bg-[#0A1628] text-white"
                          : "border-gray-200 text-gray-600 hover:border-[#0A1628] hover:text-[#0A1628]"
                      }`}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {spec}
                    </button>
                  );
                })}
              </div>
              {form.specializations.length > 0 && (
                <p className="text-xs text-[#0A1628] mt-2 font-medium">
                  {form.specializations.length} keahlian dipilih
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Bio / Deskripsi Singkat</label>
              <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)}
                rows={3} placeholder="Pengalaman, latar belakang terapi..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]" />
            </div>

            {/* Commission Rate */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <label className="text-sm font-medium text-orange-800 block mb-2 flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Persentase Komisi
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.commissionRate}
                  onChange={(e) => set("commissionRate", Number(e.target.value))}
                  className="w-24 border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-center font-bold"
                />
                <span className="text-sm text-orange-700">% per sesi selesai</span>
              </div>
              <p className="text-xs text-orange-600 mt-1.5">
                Kosongkan untuk menggunakan setting klinik ({DEFAULT_COMMISSION_RATE}%)
              </p>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[#0A1628] hover:bg-[#1B3A6B] h-11"
            >
              {saving ? "Menyimpan..." : editTarget ? "Perbarui Data Terapis" : "Tambah Terapis"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
