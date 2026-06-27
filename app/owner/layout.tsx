"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LayoutDashboard, Users, UserCheck, BarChart3, Settings, ShieldCheck, FileText, Wallet, Stethoscope, Building2, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_ITEMS = [
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

const ALLOWED = ["owner", "super_admin"];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/sign-in");
      else if (role && !ALLOWED.includes(role)) router.push(`/${role}/dashboard`);
    }
  }, [user, role, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Skeleton className="h-64 w-full max-w-sm" />
    </div>
  );

  if (!user || (role && !ALLOWED.includes(role))) return null;
  return <DashboardLayout navItems={NAV_ITEMS}>{children}</DashboardLayout>;
}
