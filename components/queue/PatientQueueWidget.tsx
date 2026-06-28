"use client";

import { useEffect, useState } from "react";
import { Users, Clock, CheckCircle2 } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface QueueItem {
  id: string;
  number: number;
  patientName: string;
  appointmentId: string;
  status: "waiting" | "serving" | "done" | "skipped";
}
interface QueueDoc {
  items: QueueItem[];
  serving: { number: number; patientName: string } | null;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PatientQueueWidget({ patientName }: { patientName: string }) {
  const [queueDoc, setQueueDoc] = useState<QueueDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "queue", todayStr());
    const unsub = onSnapshot(ref, (snap) => {
      setQueueDoc(snap.exists() ? (snap.data() as QueueDoc) : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || !queueDoc) return null;

  const myItem = queueDoc.items?.find(
    (i) => i.patientName?.toLowerCase() === patientName?.toLowerCase() && i.status !== "done" && i.status !== "skipped"
  );

  if (!myItem) return null;

  const waitingAhead = queueDoc.items?.filter(
    (i) => i.status === "waiting" && i.number < myItem.number
  ).length ?? 0;

  const isServing = myItem.status === "serving";
  const bgClass = isServing
    ? "bg-gradient-to-r from-green-500 to-emerald-600"
    : "bg-gradient-to-r from-[#1B3A6B] to-[#2563EB]";

  return (
    <div className={`${bgClass} rounded-2xl p-5 text-white`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {isServing ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Antrian Hari Ini</p>
          <p className="font-bold text-lg leading-tight">
            {isServing ? "Giliran Anda Sekarang!" : `Nomor Antrian #${myItem.number}`}
          </p>
        </div>
      </div>

      {!isServing && (
        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">
            {waitingAhead === 0
              ? "Anda berikutnya! Harap bersiap."
              : `${waitingAhead} orang menunggu di depan Anda`}
          </p>
        </div>
      )}

      {isServing && (
        <div className="bg-white/20 rounded-xl px-4 py-2.5 text-sm font-medium">
          Silakan masuk ke ruang terapi sekarang
        </div>
      )}
    </div>
  );
}
