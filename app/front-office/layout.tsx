"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LayoutDashboard, UserPlus, Calendar, Receipt, Ticket, CreditCard, ClipboardCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_ITEMS = [
  { href: "/front-office/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/front-office/register", label: "Registrasi Pasien", icon: UserPlus },
  { href: "/admin/appointments", label: "Booking & Jadwal", icon: Calendar },
  { href: "/front-office/payment", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/invoices", label: "Invoice", icon: Receipt },
  { href: "/front-office/vouchers", label: "Voucher Pasien", icon: Ticket },
  { href: "/front-office/attendance", label: "Absensi Saya", icon: ClipboardCheck },
];

const ALLOWED = ["front_office", "admin", "manager", "owner", "super_admin"];

export default function FrontOfficeLayout({ children }: { children: React.ReactNode }) {
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
