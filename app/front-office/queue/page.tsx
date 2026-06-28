"use client";

import { useEffect, useState } from "react";
import {
  Users, ChevronRight, SkipForward, Plus, CheckCircle2,
  Clock, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  doc, setDoc, onSnapshot, Timestamp, collection, getDocs, query, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// ──── Types ────────────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  number: number;
  patientName: string;
  appointmentId: string;
  status: "waiting" | "serving" | "done" | "skipped";
}

interface QueueDoc {
  date: string;
  serving: { number: number; patientName: string; appointmentId: string } | null;
  items: QueueItem[];
  updatedAt: Timestamp;
}

interface TodayAppt {
  id: string;
  patientName: string;
  serviceName: string;
  timeSlot: string;
}

// ──── Helpers ───────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_COLORS: Record<QueueItem["status"], string> = {
  waiting: "bg-yellow-100 text-yellow-700",
  serving: "bg-green-100 text-green-700",
  done: "bg-gray-100 text-gray-500",
  skipped: "bg-red-100 text-red-500",
};
const STATUS_LABELS: Record<QueueItem["status"], string> = {
  waiting: "Menunggu",
  serving: "Dipanggil",
  done: "Selesai",
  skipped: "Dilewati",
};

// ──── Page Component ─────────────────────────────────────────────────────────

export default function QueuePage() {
  const dateKey = todayStr();
  const queueRef = doc(db, "queue", dateKey);

  const [queue, setQueue] = useState<QueueDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [todayAppts, setTodayAppts] = useState<TodayAppt[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Real-time listener
  useEffect(() => {
    const unsub = onSnapshot(queueRef, (snap) => {
      if (snap.exists()) {
        setQueue(snap.data() as QueueDoc);
      } else {
        setQueue({ date: dateKey, serving: null, items: [], updatedAt: Timestamp.now() });
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [dateKey]);

  // Save queue document helper
  const saveQueue = async (updated: Partial<QueueDoc>) => {
    setSaving(true);
    try {
      await setDoc(queueRef, {
        date: dateKey,
        serving: queue?.serving ?? null,
        items: queue?.items ?? [],
        updatedAt: Timestamp.now(),
        ...updated,
      }, { merge: true });
    } catch {
      toast.error("Gagal menyimpan antrian");
    } finally {
      setSaving(false);
    }
  };

  // Call next patient
  const handleCallNext = async () => {
    const items = queue?.items ?? [];
    const next = items.find((i) => i.status === "waiting");
    if (!next) { toast.info("Tidak ada pasien dalam antrian"); return; }

    // Mark current serving as done
    const updated = items.map((i) => {
      if (i.status === "serving") return { ...i, status: "done" as const };
      if (i.id === next.id) return { ...i, status: "serving" as const };
      return i;
    });
    await saveQueue({
      items: updated,
      serving: { number: next.number, patientName: next.patientName, appointmentId: next.appointmentId },
    });
    toast.success(`Memanggil No. ${next.number} - ${next.patientName}`);
  };

  // Skip current patient
  const handleSkip = async () => {
    const items = queue?.items ?? [];
    const updated = items.map((i) => {
      if (i.status === "serving") return { ...i, status: "skipped" as const };
      return i;
    });
    await saveQueue({ items: updated, serving: null });
    toast.info("Pasien dilewati");
  };

  // Mark current as done
  const handleDone = async () => {
    const items = queue?.items ?? [];
    const updated = items.map((i) => {
      if (i.status === "serving") return { ...i, status: "done" as const };
      return i;
    });
    await saveQueue({ items: updated, serving: null });
    toast.success("Pasien selesai dilayani");
  };

  // Load today's appointments for the add dialog
  const openAddDialog = async () => {
    setAddOpen(true);
    setLoadingAppts(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const snap = await getDocs(
        query(
          collection(db, "appointments"),
          where("status", "in", ["confirmed", "pending", "checked_in"])
        )
      );
      const todayStr2 = todayStr();
      const appts = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as unknown as {
          id: string; patientName: string; serviceName: string; timeSlot: string;
          date: { toDate?: () => Date } | Date;
        }))
        .filter((a) => {
          const d = typeof (a.date as { toDate?: () => Date }).toDate === "function"
            ? (a.date as { toDate: () => Date }).toDate()
            : a.date instanceof Date ? a.date : null;
          if (!d) return false;
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return ds === todayStr2;
        })
        .map((a) => ({
          id: a.id,
          patientName: a.patientName,
          serviceName: a.serviceName,
          timeSlot: a.timeSlot,
        }));
      setTodayAppts(appts);
    } catch { /* ignore */ }
    setLoadingAppts(false);
  };

  // Add patient to queue
  const handleAddToQueue = async (appt: TodayAppt) => {
    const items = queue?.items ?? [];
    const alreadyIn = items.some((i) => i.appointmentId === appt.id);
    if (alreadyIn) { toast.info("Pasien sudah ada dalam antrian"); return; }

    const nextNumber = items.length > 0 ? Math.max(...items.map((i) => i.number)) + 1 : 1;
    const newItem: QueueItem = {
      id: `${appt.id}-${Date.now()}`,
      number: nextNumber,
      patientName: appt.patientName,
      appointmentId: appt.id,
      status: "waiting",
    };
    await saveQueue({ items: [...items, newItem] });
    toast.success(`${appt.patientName} ditambahkan ke antrian (No. ${nextNumber})`);
    setAddOpen(false);
  };

  const waitingCount = queue?.items.filter((i) => i.status === "waiting").length ?? 0;
  const doneCount = queue?.items.filter((i) => i.status === "done").length ?? 0;
  const serving = queue?.serving;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Antrian Digital</h1>
          <p className="text-gray-500 text-sm">Kelola antrian pasien hari ini — {dateKey}</p>
        </div>
        <Button className="bg-[#0A1628] hover:bg-[#1B3A6B] gap-2" onClick={openAddDialog}>
          <Plus className="w-4 h-4" />
          Tambah ke Antrian
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Menunggu", count: waitingCount, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
          { label: "Dilayani", count: serving ? 1 : 0, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Selesai", count: doneCount, color: "bg-gray-50 text-gray-600 border-gray-100" },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Currently Serving */}
      {loading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : serving ? (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-[#0A1628] to-[#1B3A6B] text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold">{serving.number}</span>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Sedang Dilayani</p>
                  <p className="text-xl font-bold">{serving.patientName}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-1"
                  onClick={handleSkip}
                  disabled={saving}
                >
                  <SkipForward className="w-4 h-4" />
                  Lewati
                </Button>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white gap-1"
                  onClick={handleDone}
                  disabled={saving}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Selesai
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm border-2 border-dashed border-gray-200">
          <CardContent className="p-5 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Tidak ada pasien yang sedang dilayani</p>
            {waitingCount > 0 && (
              <Button
                className="mt-3 bg-[#0A1628] hover:bg-[#1B3A6B] gap-2"
                onClick={handleCallNext}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                Panggil Berikutnya
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Call Next button when serving */}
      {serving && waitingCount > 0 && (
        <Button
          className="w-full bg-[#2563EB] hover:bg-[#1B3A6B] gap-2"
          onClick={handleCallNext}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Panggil Berikutnya (Selesaikan & Lanjut)
        </Button>
      )}

      {/* Queue List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#0A1628]">
            Daftar Antrian ({queue?.items.length ?? 0})
          </CardTitle>
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full mb-2 rounded-xl" />)
          ) : (queue?.items ?? []).length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Belum ada antrian hari ini</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">No</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Pasien</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(queue?.items ?? []).map((item) => (
                      <tr key={item.id} className={`border-b border-gray-50 ${item.status === "done" || item.status === "skipped" ? "opacity-50" : ""}`}>
                        <td className="py-2.5 px-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0A1628] text-white flex items-center justify-center font-bold text-sm">
                            {item.number}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.patientName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {(queue?.items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      item.status === "serving" ? "border-green-200 bg-green-50" :
                      item.status === "done" || item.status === "skipped" ? "border-gray-100 opacity-50" :
                      "border-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0A1628] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                      {item.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{item.patientName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add to Queue Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pasien ke Antrian</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {loadingAppts ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
            ) : todayAppts.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tidak ada appointment hari ini yang tersedia</p>
              </div>
            ) : (
              todayAppts.map((appt) => {
                const inQueue = (queue?.items ?? []).some((i) => i.appointmentId === appt.id);
                return (
                  <div key={appt.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{appt.patientName}</p>
                      <p className="text-xs text-gray-500 truncate">{appt.serviceName} · {appt.timeSlot}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#0A1628] hover:bg-[#1B3A6B] text-xs ml-3 flex-shrink-0"
                      onClick={() => handleAddToQueue(appt)}
                      disabled={inQueue || saving}
                    >
                      {inQueue ? "Sudah" : "Tambah"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
