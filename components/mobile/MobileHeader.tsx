"use client";

import { Bell } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function MobileHeader() {
  const { user, userData } = useAuth();
  const [unread, setUnread] = useState(0);

  const name = String(userData?.displayName || userData?.fullName || user?.email?.split("@")[0] || "Pengguna");

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
      style={{ background: "var(--brand-navy)" }}
    >
      <div className="flex items-center justify-between pt-2">
        {/* Brand logo */}
        <div className="w-36 h-8 relative">
          <Image
            src="/brand/logo-primary.png"
            alt="Prime Wellness"
            fill
            className="object-contain object-left"
            priority
          />
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-white/80 font-medium truncate max-w-[120px]">
            Hi, {name.split(" ")[0]}
          </p>
          <button className="relative w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/20 flex-shrink-0">
            <Bell className="w-4 h-4 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ background: "var(--brand-red)" }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
