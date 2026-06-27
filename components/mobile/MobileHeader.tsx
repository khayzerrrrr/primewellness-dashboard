"use client";

import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const THEME: Record<string, { bg: string; label: string; emoji: string }> = {
  owner:        { bg: "#0A1628", label: "Dashboard Owner",   emoji: "👑" },
  super_admin:  { bg: "#0A1628", label: "Super Admin",       emoji: "⚡" },
  manager:      { bg: "#1B3A6B", label: "Dashboard Manager", emoji: "📋" },
  front_office: { bg: "#1B3A6B", label: "Front Office",      emoji: "🏥" },
  therapist:    { bg: "#2563EB", label: "Terapis",           emoji: "🌿" },
  patient:      { bg: "#0A1628", label: "Selamat datang,",   emoji: "👋" },
};

export function MobileHeader() {
  const { user, userData } = useAuth();
  const role = (userData?.role as string) || "patient";
  const theme = THEME[role] || THEME.patient;
  const [unread, setUnread] = useState(0);

  const name = userData?.displayName || userData?.fullName || user?.email?.split("@")[0] || "Pengguna";

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("isRead", "==", false),
      where("targetUserId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => setUnread(snap.size), () => {});
    return unsub;
  }, [user?.uid]);

  return (
    <header
      className="md:hidden sticky top-0 z-40 px-4 pt-safe-top pb-3"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="flex items-start justify-between pt-2">
        <div>
          <p className="text-xs text-white/60 mb-0.5">{theme.label}</p>
          <p className="text-base font-medium text-white">
            {name} {theme.emoji}
          </p>
        </div>
        <button className="relative mt-1 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/20">
          <Bell className="w-4 h-4 text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
