"use client";

import { useEffect, useState, useRef } from "react";
import { Activity, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeToInProgressAppointments } from "@/lib/firebase/firestore-service";
import type { Appointment } from "@/types";

function getStartedAt(app: Appointment): Date | null {
  if (!app.startedAt) return null;
  const ts = app.startedAt as unknown as { toDate?: () => Date };
  if (typeof ts.toDate === "function") return ts.toDate();
  if (app.startedAt instanceof Date) return app.startedAt;
  return null;
}

function formatMMSS(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = totalSeconds < 0 ? "-" : "";
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SessionRow({ app }: { app: Appointment }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const alertedRef = useRef(false);

  useEffect(() => {
    const startedAt = getStartedAt(app);
    if (!startedAt) { setRemaining(null); return; }
    const durationSec = (app.serviceDuration ?? 60) * 60;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const rem = durationSec - elapsed;
      setRemaining(rem);
      // One-time browser notification when time runs out
      if (rem <= 0 && !alertedRef.current) {
        alertedRef.current = true;
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`Sesi selesai: ${app.patientName}`, {
            body: `${app.doctorName} — ${app.serviceName}`,
            icon: "/favicon.ico",
          });
        }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [app.id, app.startedAt, app.serviceDuration]);

  const startedAt = getStartedAt(app);
  const totalSec = (app.serviceDuration ?? 60) * 60;
  const progressPct = remaining !== null
    ? Math.max(0, Math.min(100, ((totalSec - Math.abs(Math.min(remaining, totalSec))) / totalSec) * 100))
    : 0;
  const minutesLeft = remaining !== null ? Math.floor(remaining / 60) : null;

  const colorClass =
    remaining === null ? "text-gray-400" :
    remaining < 0 ? "text-red-600" :
    minutesLeft! < 10 ? "text-red-600" :
    minutesLeft! < 30 ? "text-yellow-600" :
    "text-green-600";

  const bgClass =
    remaining === null ? "bg-gray-50" :
    remaining < 0 ? "bg-red-50 border-red-200" :
    minutesLeft! < 10 ? "bg-red-50 border-red-200" :
    minutesLeft! < 30 ? "bg-yellow-50 border-yellow-200" :
    "bg-green-50 border-green-200";

  const barClass =
    remaining === null ? "bg-gray-300" :
    remaining < 0 ? "bg-red-400" :
    minutesLeft! < 10 ? "bg-red-400" :
    minutesLeft! < 30 ? "bg-yellow-400" :
    "bg-green-400";

  return (
    <div className={`rounded-xl border p-3 ${bgClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="font-semibold text-slate-800 text-sm truncate">{app.doctorName}</p>
          </div>
          <p className="text-xs text-gray-600 truncate">{app.patientName} · {app.serviceName}</p>
          {startedAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Mulai: {startedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={`text-lg font-mono font-bold tabular-nums ${colorClass}`}>
            {remaining !== null ? formatMMSS(remaining) : "--:--"}
          </p>
          <p className="text-[10px] text-gray-400">
            {remaining !== null && remaining < 0 ? "Overtime" : "tersisa"}
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barClass}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {remaining !== null && remaining < 0 && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-red-600 font-medium">
          <AlertCircle className="w-3 h-3" />
          Sesi sudah selesai — harap update status
        </div>
      )}
    </div>
  );
}

export function LiveSessionWidget() {
  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Request notification permission once
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const unsub = subscribeToInProgressAppointments(setSessions);
    return unsub;
  }, []);

  if (!mounted) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0A1628]">
          <Activity className="w-5 h-5 text-green-600" />
          Sesi Aktif
          {sessions.length > 0 && (
            <span className="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {sessions.length} terapis
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-gray-400">
            <Clock className="w-3 h-3" />
            Real-time
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
            <Activity className="w-10 h-10 opacity-20" />
            <p className="text-sm">Tidak ada sesi berlangsung saat ini</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {sessions.map((app) => (
              <SessionRow key={app.id} app={app} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
