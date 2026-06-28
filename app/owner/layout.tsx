"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTES } from "@/lib/constants";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, Users, UserCheck, BarChart3, Settings, ShieldCheck,
  FileText, Wallet, Stethoscope, Building2, TrendingUp, Activity,
  FolderHeart, LineChart, Calendar, Receipt, ClipboardCheck, MapPin,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const OWNER_NAV = [
  { href: "/owner/dashboard",    label: "Dashboard",         icon: LayoutDashboard },
  { href: "/owner/reports",      label: "Laporan Bisnis",    icon: BarChart3 },
  { href: "/owner/analytics",    label: "Analytics",         icon: LineChart },
  { href: "/owner/commissions",  label: "Komisi Terapis",    icon: Wallet },
  { href: "/owner/accounts",     label: "Kelola Akun",       icon: ShieldCheck },
  { href: "/owner/kpi",          label: "KPI Karyawan",      icon: TrendingUp },
  { href: "/owner/activity-log", label: "Log Aktivitas",     icon: Activity },
  { href: "/owner/branches",     label: "Cabang Klinik",     icon: Building2 },
  { href: "/owner/services",     label: "Layanan & Harga",   icon: Stethoscope },
  { href: "/admin/patients",     label: "Data Pasien",       icon: Users },
  { href: "/admin/doctors",      label: "Data Terapis",      icon: UserCheck },
  { href: "/admin/invoices",     label: "Invoice",           icon: Receipt },
  { href: "/admin/medical-records", label: "Rekam Medis",   icon: FolderHeart },
  { href: "/owner/settings",     label: "Pengaturan",        icon: Settings },
];

const MANAGER_NAV = [
  { href: "/manager/dashboard",        label: "Dashboard",             icon: LayoutDashboard },
  { href: "/manager/reports",          label: "Laporan Bisnis",        icon: BarChart3 },
  { href: "/owner/analytics",          label: "Analytics",             icon: LineChart },
  { href: "/owner/commissions",        label: "Komisi Terapis",        icon: Wallet },
  { href: "/owner/kpi",                label: "KPI Karyawan",          icon: TrendingUp },
  { href: "/owner/activity-log",       label: "Log Aktivitas",         icon: Activity },
  { href: "/manager/attendance",       label: "Absensi Karyawan",      icon: ClipboardCheck },
  { href: "/manager/location-settings",label: "Setup Lokasi Absensi",  icon: MapPin },
  { href: "/admin/appointments",       label: "Appointments",          icon: Calendar },
  { href: "/admin/patients",           label: "Data Pasien",           icon: Users },
  { href: "/admin/doctors",            label: "Data Terapis",          icon: UserCheck },
  { href: "/admin/invoices",           label: "Invoice",               icon: Receipt },
  { href: "/admin/medical-records",    label: "Rekam Medis",           icon: FolderHeart },
  { href: "/manager/therapists",       label: "Manajemen Terapis",     icon: ShieldCheck },
  { href: "/manager/services",         label: "Manajemen Layanan",     icon: Stethoscope },
  { href: "/manager/sop",              label: "SOP Karyawan",          icon: FileText },
  { href: "/owner/branches",           label: "Cabang Klinik",         icon: Building2 },
  { href: "/owner/settings",           label: "Pengaturan",            icon: Settings },
];

const ALLOWED = ["owner", "super_admin", "manager"];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/sign-in");
      else if (role && !ALLOWED.includes(role)) router.push(ROLE_ROUTES[role] || "/sign-in");
    }
  }, [user, role, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Skeleton className="h-64 w-full max-w-sm" />
    </div>
  );

  if (!user || (role && !ALLOWED.includes(role))) return null;

  const navItems = role === "manager" ? MANAGER_NAV : OWNER_NAV;
  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
