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
    <div className="min-h-screen flex" style={{ background: "var(--brand-bg)" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ background: "var(--brand-navy)" }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-36 h-9 relative flex-shrink-0">
              <Image
                src="/brand/logo-on-dark.png"
                alt="Prime Wellness"
                fill
                className="object-contain object-left"
                priority
              />
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "hover:text-white"
                )}
                style={isActive
                  ? { background: "var(--brand-teal)", color: "#fff", boxShadow: "0 2px 8px rgba(15,118,110,0.30)" }
                  : { color: "rgba(255,255,255,0.65)" }
                }
                onMouseEnter={isActive ? undefined : (e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={isActive ? undefined : (e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" style={{ opacity: isActive ? 1 : 0.7 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info bottom */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback
                className="text-white text-xs font-bold"
                style={{ background: "var(--brand-teal)" }}
              >
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header
          className="sticky top-0 z-30 px-4 md:px-6 h-14 flex items-center gap-4"
          style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <button
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: "#64748B" }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            {title && <h1 className="text-base font-semibold" style={{ color: "var(--brand-navy)" }}>{title}</h1>}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback
                      className="text-white text-xs font-bold"
                      style={{ background: "var(--brand-navy)" }}
                    >
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium max-w-[100px] truncate" style={{ color: "var(--brand-navy)" }}>
                      {displayName}
                    </p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{roleLabel}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
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

        {/* Mobile header */}
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
