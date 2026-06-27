"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getMedicalRecords, createMedicalRecord } from "@/lib/firebase/firestore-service";
import { formatDate } from "@/lib/utils";
import type { MedicalRecord } from "@/types";

const recordSchema = z.object({
  patientId: z.string().min(1, "ID Pasien wajib diisi"),
  patientName: z.string().min(1),
  appointmentId: z.string().min(0).default(""),
  chiefComplaint: z.string().min(3, "Keluhan wajib diisi"),
  bloodPressure: z.string().optional(),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  diagnosis: z.string().min(3, "Diagnosa wajib diisi"),
  treatment: z.string().min(3, "Tindakan wajib diisi"),
  prescription: z.string().optional(),
  doctorNotes: z.string().optional(),
});

type RecordForm = z.infer<typeof recordSchema>;

export default function DoctorMedicalRecordsPage() {
  const { user, userData } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RecordForm>({
    resolver: zodResolver(recordSchema) as Resolver<RecordForm>,
  });

  const load = async () => {
    const data = await getMedicalRecords();
    setRecords(data as MedicalRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const onSubmit = async (data: RecordForm) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await createMedicalRecord({
        patientId: data.patientId,
        therapistId: user.uid,
        appointmentId: data.appointmentId || "",
        visitDate: new Date(),
        chiefComplaint: data.chiefComplaint,
        bloodPressure: data.bloodPressure,
        weight: data.weight,
        height: data.height,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        prescription: data.prescription,
        therapyNotes: data.doctorNotes,
      });
      toast.success("Rekam medis berhasil disimpan");
      setOpen(false);
      reset();
      load();
    } catch {
      toast.error("Gagal menyimpan rekam medis");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Rekam Medis</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Tambah Rekam Medis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Rekam Medis Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Pasien</Label>
                  <Input {...register("patientId")} placeholder="user_uid pasien" />
                  {errors.patientId && <p className="text-xs text-red-500">{errors.patientId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Nama Pasien</Label>
                  <Input {...register("patientName")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Keluhan Utama</Label>
                <Textarea {...register("chiefComplaint")} rows={2} />
                {errors.chiefComplaint && <p className="text-xs text-red-500">{errors.chiefComplaint.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tekanan Darah</Label>
                  <Input {...register("bloodPressure")} placeholder="120/80" />
                </div>
                <div className="space-y-2">
                  <Label>BB (kg)</Label>
                  <Input {...register("weight")} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>TB (cm)</Label>
                  <Input {...register("height")} type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Diagnosa</Label>
                <Textarea {...register("diagnosis")} rows={2} />
                {errors.diagnosis && <p className="text-xs text-red-500">{errors.diagnosis.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tindakan</Label>
                <Textarea {...register("treatment")} rows={2} />
                {errors.treatment && <p className="text-xs text-red-500">{errors.treatment.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Resep</Label>
                <Textarea {...register("prescription")} rows={2} placeholder="Nama obat, dosis, aturan pakai" />
              </div>
              <div className="space-y-2">
                <Label>Catatan Dokter</Label>
                <Textarea {...register("doctorNotes")} rows={2} />
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : "Simpan Rekam Medis"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada rekam medis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tanggal Kunjungan</p>
                    <p className="font-medium text-slate-800">
                      {typeof record.visitDate === "object" && "toDate" in record.visitDate
                        ? formatDate((record.visitDate as { toDate(): Date }).toDate())
                        : formatDate(record.visitDate as Date)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Keluhan: {record.chiefComplaint}</p>
                    <p className="text-xs text-gray-500">Diagnosa: {record.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tindakan</p>
                    <p className="text-slate-800">{record.treatment}</p>
                    {record.prescription && (
                      <p className="text-xs text-gray-500 mt-2">Resep: {record.prescription}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
