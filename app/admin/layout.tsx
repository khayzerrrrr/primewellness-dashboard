"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, Users, UserCheck, Calendar,
  FileText, Receipt, Stethoscope, Star, HelpCircle, Settings,
  BarChart3, ShieldCheck, Wallet, Building2, TrendingUp, Activity,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/patients", label: "Pasien", icon: Users },
  { href: "/admin/doctors", label: "Terapis", icon: UserCheck },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/medical-records", label: "Rekam Medis", icon: FileText },
  { href: "/admin/invoices", label: "Invoice", icon: Receipt },
  { href: "/admin/services", label: "Layanan", icon: Stethoscope },
  { href: "/admin/testimonials", label: "Testimoni", icon: Star },
  { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

const OWNER_NAV = [
  { href: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/owner/reports", label: "Laporan Bisnis", icon: BarChart3 },
  { href: "/owner/commissions", label: "Komisi Terapis", icon: Wallet },
  { href: "/owner/accounts", label: "Kelola Akun", icon: ShieldCheck },
  { href: "/owner/kpi", label: "KPI Karyawan", icon: TrendingUp },
  { href: "/owner/activity-log", label: "Log Aktivitas", icon: Activity },
  { href: "/owner/branches", label: "Cabang Klinik", icon: Building2 },
  { href: "/owner/services", label: "Layanan & Harga", icon: Stethoscope },
  { href: "/admin/patients", label: "Data Pasien", icon: Users },
  { href: "/admin/doctors", label: "Data Terapis", icon: UserCheck },
  { href: "/admin/invoices", label: "Invoice", icon: FileText },
  { href: "/owner/settings", label: "Pengaturan", icon: Settings },
];

const ALLOWED = ["admin", "owner", "super_admin", "manager", "front_office"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/sign-in");
      else if (role && !ALLOWED.includes(role)) router.push(`/${role}/dashboard`);
    }
  }, [user, role, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="h-64 w-full max-w-sm" />
    </div>
  );

  if (!user || (role && !ALLOWED.includes(role))) return null;

  const navItems = (role === "owner" || role === "super_admin") ? OWNER_NAV : ADMIN_NAV;

  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
