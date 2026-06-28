"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_ROUTES } from "@/lib/constants";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LayoutDashboard, Calendar, Users, FileText, User, ClipboardCheck, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const NAV_ITEMS = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/schedule", label: "Jadwal Hari Ini", icon: Calendar },
  { href: "/doctor/patients", label: "Pasien Hari Ini", icon: Users },
  { href: "/doctor/medical-records", label: "Rekam Terapi", icon: FileText },
  { href: "/doctor/sop", label: "SOP Terapis", icon: BookOpen },
  { href: "/doctor/attendance", label: "Absensi", icon: ClipboardCheck },
  { href: "/doctor/profile", label: "Profil", icon: User },
];

const ALLOWED_ROLES = ["therapist", "doctor"] as const;

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const isAllowed = role && (ALLOWED_ROLES as readonly string[]).includes(role);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/sign-in");
      else if (role && !isAllowed) router.push(ROLE_ROUTES[role] || "/sign-in");
    }
  }, [user, role, loading, router, isAllowed]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="h-64 w-full max-w-sm" />
    </div>
  );

  if (!user || !isAllowed) return null;

  return <DashboardLayout navItems={NAV_ITEMS}>{children}</DashboardLayout>;
}
