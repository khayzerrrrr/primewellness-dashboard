"use client";

import { useEffect, useState } from "react";
import { FileText, User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getMedicalRecords } from "@/lib/firebase/firestore-service";
import { formatDate } from "@/lib/utils";
import type { MedicalRecord } from "@/types";

export default function PatientMedicalRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getMedicalRecords(user.uid)
      .then((data) => {
        setRecords(data as MedicalRecord[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Rekam Medis</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
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
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Kunjungan:{" "}
                    {typeof record.visitDate === "object" && "toDate" in record.visitDate
                      ? formatDate((record.visitDate as { toDate(): Date }).toDate())
                      : formatDate(record.visitDate as Date)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Keluhan Utama</p>
                      <p className="text-slate-800">{record.chiefComplaint}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Diagnosa</p>
                      <p className="text-slate-800">{record.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Tindakan</p>
                      <p className="text-slate-800">{record.treatment}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {record.bloodPressure && (
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Tekanan Darah</p>
                        <p className="text-slate-800">{record.bloodPressure} mmHg</p>
                      </div>
                    )}
                    {record.weight && (
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Berat / Tinggi</p>
                        <p className="text-slate-800">{record.weight} kg / {record.height} cm</p>
                      </div>
                    )}
                    {record.prescription && (
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Resep</p>
                        <p className="text-slate-800">{record.prescription}</p>
                      </div>
                    )}
                    {record.therapyNotes && (
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Catatan Terapis</p>
                        <p className="text-slate-800">{record.therapyNotes}</p>
                      </div>
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
