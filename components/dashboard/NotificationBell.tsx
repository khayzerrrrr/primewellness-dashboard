"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, CheckCheck, Calendar, Receipt, UserCheck, Info } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "appointment" | "invoice" | "commission" | "system" | "voucher";
  isRead: boolean;
  createdAt: Timestamp | Date;
  link?: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  appointment: Calendar,
  invoice: Receipt,
  commission: CheckCheck,
  voucher: UserCheck,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  appointment: "bg-blue-100 text-blue-600",
  invoice: "bg-yellow-100 text-yellow-600",
  commission: "bg-green-100 text-green-600",
  voucher: "bg-purple-100 text-purple-600",
  system: "bg-gray-100 text-gray-600",
};

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    }, () => { /* ignore errors — notifications are optional */ });
    return unsub;
  }, [user?.uid]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { isRead: true });
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.isRead);
    await Promise.all(unreadItems.map((n) => markRead(n.id)));
  };

  const getDate = (n: Notification) => {
    if (n.createdAt instanceof Date) return n.createdAt;
    if (n.createdAt && typeof n.createdAt === "object" && "toDate" in n.createdAt) {
      return (n.createdAt as Timestamp).toDate();
    }
    return new Date();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800 text-sm">Notifikasi</p>
              {unread > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#1a2744] hover:underline">Tandai semua baca</button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const colorClass = TYPE_COLOR[n.type] ?? "bg-gray-100 text-gray-600";
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!n.isRead ? "bg-blue-50/40" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!n.isRead ? "text-slate-800" : "text-gray-600"}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(getDate(n), "dd MMM · HH:mm")}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
