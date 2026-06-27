"use client";

import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMedicalRecords } from "@/lib/firebase/firestore-service";
import { formatDate } from "@/lib/utils";
import type { MedicalRecord } from "@/types";

export default function AdminMedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filtered, setFiltered] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMedicalRecords()
      .then((data) => {
        setRecords(data as MedicalRecord[]);
        setFiltered(data as MedicalRecord[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter((r) => (r.diagnosis ?? "").toLowerCase().includes(q) || (r.chiefComplaint ?? "").toLowerCase().includes(q)));
  }, [search, records]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Rekam Medis</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Cari diagnosa, keluhan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl mb-3" />)
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada rekam medis</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tanggal</p>
                    <p className="font-medium text-slate-800">
                      {typeof record.visitDate === "object" && "toDate" in record.visitDate
                        ? formatDate((record.visitDate as { toDate(): Date }).toDate())
                        : formatDate(record.visitDate as Date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Keluhan / Diagnosa</p>
                    <p className="text-gray-600">{record.chiefComplaint}</p>
                    <p className="text-teal-600 font-medium">{record.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tindakan</p>
                    <p className="text-gray-600">{record.treatment}</p>
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
