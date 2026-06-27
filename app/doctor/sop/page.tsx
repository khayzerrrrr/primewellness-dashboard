"use client";

import { useEffect, useState } from "react";
import { FileText, ChevronDown, ChevronUp, BookOpen, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { acknowledgeSop, getSopAcknowledgmentsByUser } from "@/lib/firebase/firestore-service";
import { useAuth } from "@/contexts/AuthContext";

interface SOPItem {
  id: string;
  title: string;
  role: string;
  content: string;
  updatedAt: { toDate(): Date } | Date;
}

const ROLE_LABELS: Record<string, string> = {
  therapist: "Terapis",
  front_office: "Front Office",
  manager: "Manager",
  owner: "Owner",
  all: "Semua Staf",
};

export default function DoctorSOPPage() {
  const { user, userData } = useAuth();
  const [sops, setSops] = useState<SOPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [acking, setAcking] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "sop"), orderBy("createdAt", "desc")));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SOPItem));
        setSops(all.filter((s) => s.role === "therapist" || s.role === "all" || !s.role));

        if (user?.uid) {
          const acks = await getSopAcknowledgmentsByUser(user.uid);
          setAcknowledged(new Set(acks.map((a) => a.sopId)));
        }
      } catch {
        setSops([]);
      }
      setLoading(false);
    };
    load();
  }, [user?.uid]);

  const toggle = (id: string) => setExpandedId((prev) => prev === id ? null : id);

  const handleAcknowledge = async (sop: SOPItem) => {
    if (!user?.uid) return;
    setAcking(sop.id);
    try {
      await acknowledgeSop({
        sopId: sop.id,
        sopTitle: sop.title,
        userId: user.uid,
        userName: (userData?.displayName as string) || user.email || user.uid,
        acknowledgedAt: new Date(),
      });
      setAcknowledged((prev) => new Set([...prev, sop.id]));
      toast.success("SOP berhasil dikonfirmasi");
    } catch {
      toast.error("Gagal menyimpan konfirmasi");
    } finally {
      setAcking(null);
    }
  };

  const formatDate = (d: SOPItem["updatedAt"]) => {
    const date = d instanceof Date ? d : typeof d === "object" && "toDate" in d ? d.toDate() : new Date();
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  const readCount = sops.filter((s) => acknowledged.has(s.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">SOP Terapis</h1>
          <p className="text-gray-500 text-sm">Standar Operasional Prosedur yang berlaku untuk terapis</p>
        </div>
        {sops.length > 0 && (
          <div className="bg-[#1a2744] text-white px-4 py-2 rounded-xl text-sm">
            <span className="font-bold text-teal-300">{readCount}</span>
            <span className="text-white/70">/{sops.length} SOP dibaca</span>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Wajib Dibaca</p>
          <p className="text-blue-600 mt-0.5">
            Baca setiap SOP lalu klik <strong>&quot;Saya Sudah Baca&quot;</strong> untuk konfirmasi.
            Data ini digunakan dalam penilaian KPI kamu.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : sops.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada SOP tersedia</p>
          <p className="text-gray-400 text-sm mt-1">Manager akan menambahkan SOP untuk terapis</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sops.map((sop) => {
            const isRead = acknowledged.has(sop.id);
            return (
              <Card key={sop.id} className={`border-0 shadow-sm overflow-hidden ${isRead ? "ring-1 ring-green-200" : ""}`}>
                <button onClick={() => toggle(sop.id)} className="w-full text-left">
                  <CardHeader className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isRead ? "bg-green-500" : "bg-[#1a2744]"}`}>
                          {isRead
                            ? <CheckCircle2 className="w-4 h-4 text-white" />
                            : <FileText className="w-4 h-4 text-white" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{sop.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs bg-[#1a2744]/10 text-[#1a2744] px-2 py-0.5 rounded-full font-medium">
                              {ROLE_LABELS[sop.role] ?? sop.role}
                            </span>
                            <span className="text-xs text-gray-400">Diperbarui: {formatDate(sop.updatedAt)}</span>
                            {isRead && (
                              <span className="text-xs text-green-600 font-semibold">✓ Sudah dibaca</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedId === sop.id
                        ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    </div>
                  </CardHeader>
                </button>

                {expandedId === sop.id && (
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 rounded-xl p-4">
                        {sop.content}
                      </pre>
                      {!isRead ? (
                        <Button
                          onClick={() => handleAcknowledge(sop)}
                          disabled={acking === sop.id}
                          className="w-full bg-green-600 hover:bg-green-700 gap-2"
                        >
                          {acking === sop.id
                            ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                            : <><CheckCircle2 className="w-4 h-4" />Saya Sudah Membaca SOP Ini</>
                          }
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          SOP ini sudah dikonfirmasi · tercatat dalam KPI kamu
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
