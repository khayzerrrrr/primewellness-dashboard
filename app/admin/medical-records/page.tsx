"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Plus, Pencil, Trash2, Loader2, User, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  getPatients,
  getDoctors,
} from "@/lib/firebase/firestore-service";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { MedicalRecord, Patient, Doctor } from "@/types";

interface RecordForm {
  patientId: string;
  therapistId: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  therapyNotes: string;
  painScale: string;
  progressScore: string;
}

const BLANK: RecordForm = {
  patientId: "",
  therapistId: "",
  visitDate: new Date().toISOString().split("T")[0],
  chiefComplaint: "",
  diagnosis: "",
  treatment: "",
  therapyNotes: "",
  painScale: "",
  progressScore: "",
};

export default function AdminMedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RecordForm>(BLANK);

  const set = (k: keyof RecordForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = async () => {
    try {
      const [recs, pts, docs] = await Promise.all([
        getMedicalRecords(),
        getPatients(),
        getDoctors(false),
      ]);
      setRecords(recs as MedicalRecord[]);
      setPatients(pts as Patient[]);
      setDoctors(docs as Doctor[]);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !search ||
      (r.diagnosis ?? "").toLowerCase().includes(q) ||
      (r.chiefComplaint ?? "").toLowerCase().includes(q) ||
      (r.treatment ?? "").toLowerCase().includes(q);
  });

  const openCreate = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (r: MedicalRecord) => {
    setEditId(r.id);
    const vd = r.visitDate as unknown as { toDate?: () => Date };
    const d = typeof vd.toDate === "function" ? vd.toDate() : (r.visitDate instanceof Date ? r.visitDate : new Date());
    setForm({
      patientId: r.patientId,
      therapistId: r.therapistId,
      visitDate: d.toISOString().split("T")[0],
      chiefComplaint: r.chiefComplaint || "",
      diagnosis: r.diagnosis || "",
      treatment: r.treatment || "",
      therapyNotes: r.therapyNotes || "",
      painScale: r.painScale !== undefined ? String(r.painScale) : "",
      progressScore: r.progressScore !== undefined ? String(r.progressScore) : "",
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.diagnosis || !form.treatment) {
      toast.error("Pasien, diagnosa, dan tindakan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === form.patientId);
      const therapist = doctors.find((d) => d.id === form.therapistId);
      const payload = {
        patientId: form.patientId,
        patientName: patient?.fullName || "",
        therapistId: form.therapistId,
        therapistName: therapist?.fullName || "",
        appointmentId: "",
        visitDate: form.visitDate ? new Date(form.visitDate) : new Date(),
        chiefComplaint: form.chiefComplaint,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        therapyNotes: form.therapyNotes || undefined,
        painScale: form.painScale ? Number(form.painScale) : undefined,
        progressScore: form.progressScore ? Number(form.progressScore) : undefined,
      };
      if (editId) {
        await updateMedicalRecord(editId, payload as Partial<MedicalRecord>);
        toast.success("Rekam medis diperbarui");
      } else {
        await createMedicalRecord(payload as Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">);
        toast.success("Rekam medis ditambahkan");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Gagal menyimpan rekam medis");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus rekam medis ini?")) return;
    try {
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.medicalRecords, id));
      toast.success("Rekam medis dihapus");
      load();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const getVisitDate = (r: MedicalRecord): Date | null => {
    const vd = r.visitDate as unknown as { toDate?: () => Date };
    if (typeof vd.toDate === "function") return vd.toDate();
    if (r.visitDate instanceof Date) return r.visitDate;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Rekam Medis</h1>
          <p className="text-gray-500 text-sm">{records.length} rekam medis tersimpan</p>
        </div>
        <Button className="bg-[#0A1628] hover:bg-[#1B3A6B] gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Tambah Rekam Medis
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari diagnosa, keluhan, tindakan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop Table */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl mb-3" />)
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{search ? "Tidak ada rekam medis sesuai pencarian" : "Belum ada rekam medis"}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm bg-white">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Pasien</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Keluhan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Diagnosa</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tindakan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const d = getVisitDate(r);
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500 text-xs">{d ? formatDate(d, "dd MMM yyyy") : "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-[#1B3A6B]" />
                          </div>
                          <span className="font-medium text-slate-800 text-xs">{(r as unknown as { patientName?: string }).patientName || r.patientId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs max-w-[120px] truncate">{r.chiefComplaint || "—"}</td>
                      <td className="py-3 px-4 text-[#1B3A6B] font-medium text-xs max-w-[140px] truncate">{r.diagnosis}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs max-w-[140px] truncate">{r.treatment}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(r)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => {
              const d = getVisitDate(r);
              return (
                <Card key={r.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{(r as unknown as { patientName?: string }).patientName || r.patientId}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{d ? formatDate(d, "dd MMM yyyy") : "—"}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(r)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {r.chiefComplaint && (
                        <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Keluhan:</span> {r.chiefComplaint}</p>
                      )}
                      <p className="text-xs text-[#1B3A6B]"><span className="font-medium">Diagnosa:</span> {r.diagnosis}</p>
                      <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Tindakan:</span> {r.treatment}</p>
                      {r.therapyNotes && (
                        <p className="text-xs text-gray-400 italic">{r.therapyNotes}</p>
                      )}
                    </div>
                    {(r.painScale || r.progressScore) && (
                      <div className="flex gap-3 mt-3 pt-2 border-t border-gray-100">
                        {r.painScale && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Nyeri: {r.painScale}/10</span>
                        )}
                        {r.progressScore && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Progress: {r.progressScore}/10</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(BLANK); setEditId(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Rekam Medis" : "Tambah Rekam Medis Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pasien *</Label>
                <select
                  required
                  value={form.patientId}
                  onChange={(e) => set("patientId", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]"
                >
                  <option value="">Pilih Pasien</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Terapis</Label>
                <select
                  value={form.therapistId}
                  onChange={(e) => set("therapistId", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]"
                >
                  <option value="">Pilih Terapis</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Kunjungan *</Label>
              <Input
                type="date"
                required
                value={form.visitDate}
                onChange={(e) => set("visitDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Keluhan Utama</Label>
              <Textarea
                value={form.chiefComplaint}
                onChange={(e) => set("chiefComplaint", e.target.value)}
                rows={2}
                placeholder="Keluhan yang disampaikan pasien..."
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosa *</Label>
              <Textarea
                required
                value={form.diagnosis}
                onChange={(e) => set("diagnosis", e.target.value)}
                rows={2}
                placeholder="Diagnosa terapis..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tindakan / Terapi *</Label>
              <Textarea
                required
                value={form.treatment}
                onChange={(e) => set("treatment", e.target.value)}
                rows={2}
                placeholder="Tindakan yang dilakukan..."
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Terapi</Label>
              <Textarea
                value={form.therapyNotes}
                onChange={(e) => set("therapyNotes", e.target.value)}
                rows={2}
                placeholder="Catatan tambahan dari terapis..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skala Nyeri (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.painScale}
                  onChange={(e) => set("painScale", e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label>Skor Progres (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.progressScore}
                  onChange={(e) => set("progressScore", e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#0A1628] hover:bg-[#1B3A6B]" disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                editId ? "Simpan Perubahan" : "Tambah Rekam Medis"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
