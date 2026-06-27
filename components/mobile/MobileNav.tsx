"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Calendar, Plus, FileText, User,
  BarChart2, Users, Receipt, ClipboardList, Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isFab?: boolean;
}

const NAV_CONFIG: Record<string, NavItem[]> = {
  owner: [
    { href: "/owner/dashboard", label: "Beranda", icon: Home },
    { href: "/owner/reports", label: "Laporan", icon: BarChart2 },
    { href: "/owner/accounts", label: "Akun", icon: Users, isFab: true },
    { href: "/owner/commissions", label: "Komisi", icon: Receipt },
    { href: "/owner/settings", label: "Pengaturan", icon: User },
  ],
  manager: [
    { href: "/manager/dashboard", label: "Beranda", icon: Home },
    { href: "/admin/appointments", label: "Jadwal", icon: Calendar },
    { href: "/admin/appointments", label: "Tambah", icon: Plus, isFab: true },
    { href: "/manager/reports", label: "Laporan", icon: BarChart2 },
    { href: "/manager/attendance", label: "Absensi", icon: ClipboardList },
  ],
  front_office: [
    { href: "/front-office/dashboard", label: "Beranda", icon: Home },
    { href: "/front-office/dashboard", label: "Antrian", icon: ClipboardList },
    { href: "/front-office/register", label: "Daftar", icon: Plus, isFab: true },
    { href: "/front-office/payment", label: "Bayar", icon: Receipt },
    { href: "/front-office/attendance", label: "Absensi", icon: Camera },
  ],
  therapist: [
    { href: "/doctor/dashboard", label: "Beranda", icon: Home },
    { href: "/doctor/schedule", label: "Jadwal", icon: Calendar },
    { href: "/doctor/attendance", label: "Absensi", icon: Camera, isFab: true },
    { href: "/doctor/medical-records", label: "Rekam", icon: FileText },
    { href: "/doctor/profile", label: "Profil", icon: User },
  ],
  patient: [
    { href: "/patient/dashboard", label: "Beranda", icon: Home },
    { href: "/patient/appointments", label: "Jadwal", icon: Calendar },
    { href: "/booking", label: "Booking", icon: Plus, isFab: true },
    { href: "/patient/medical-records", label: "Rekam", icon: FileText },
    { href: "/patient/profile", label: "Profil", icon: User },
  ],
};

const THEME_COLOR: Record<string, string> = {
  owner: "#1a2744",
  super_admin: "#1a2744",
  manager: "#185fa5",
  front_office: "#0f6e56",
  therapist: "#533ab7",
  patient: "#1a2744",
};

export function MobileNav() {
  const { userData } = useAuth();
  const pathname = usePathname();
  const role = (userData?.role as string) || "patient";
  const items = NAV_CONFIG[role] || NAV_CONFIG.patient;
  const color = THEME_COLOR[role] || "#1a2744";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 safe-bottom">
      <div className="flex items-end justify-around px-2 pt-2 pb-safe">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.isFab) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 -mt-4">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <span className="text-[9px] text-gray-400 mt-0.5">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[44px]"
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? color : "#9ca3af" }}
              />
              <span
                className="text-[9px] font-medium transition-colors"
                style={{ color: isActive ? color : "#9ca3af" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
