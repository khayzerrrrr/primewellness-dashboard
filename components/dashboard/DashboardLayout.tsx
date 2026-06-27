"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, LogOut, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/firebase/auth-service";
import { getInitials, cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileNav } from "@/components/mobile/MobileNav";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const { user, role, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName =
    (userData?.displayName as string) ||
    user?.displayName ||
    user?.email ||
    "User";

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "";

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Berhasil keluar");
      router.push("/");
    } catch {
      toast.error("Gagal keluar");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#0A1628] transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 relative flex-shrink-0">
              <Image src="/logo.png" alt="Prime Wellness" fill className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Prime Wellness</p>
              <p className="text-white/50 text-xs">Therapy & Reliefy</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-white/50")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info bottom */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-white/50 truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 h-14 flex items-center gap-4">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1">
            {title && <h1 className="text-base font-semibold text-slate-800">{title}</h1>}
          </div>

          <div className="flex items-center gap-2">
            {/* Live notification bell */}
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-[#0A1628] text-white text-xs font-bold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-slate-700 max-w-[100px] truncate">{displayName}</p>
                    <p className="text-xs text-gray-400">{roleLabel}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="#" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profil Saya
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile header — only visible on mobile */}
        <MobileHeader />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
