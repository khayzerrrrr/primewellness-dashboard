"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTES } from "@/lib/constants";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LayoutDashboard, Calendar, FileText, Receipt, User, Ticket, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_ITEMS = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "Appointment Saya", icon: Calendar },
  { href: "/patient/medical-records", label: "Rekam Terapi", icon: FileText },
  { href: "/patient/vouchers", label: "Voucher Sesi", icon: Ticket },
  { href: "/patient/invoices", label: "Invoice", icon: Receipt },
  { href: "/patient/loyalty", label: "Poin Loyalty", icon: Gift },
  { href: "/patient/profile", label: "Profil", icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/sign-in");
      } else if (role && role !== "patient") {
        router.push(ROLE_ROUTES[role] || "/sign-in");
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-sm">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || (role && role !== "patient")) return null;

  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      {children}
    </DashboardLayout>
  );
}
