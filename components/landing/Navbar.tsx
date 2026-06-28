"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const t = useTranslations();
  const { locale, setLocale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: t("nav.services") },
    { href: "#doctors", label: t("nav.doctors") },
    { href: "#why-us", label: t("nav.about") },
    { href: "#contact", label: t("nav.contact") },
  ];

  const localeLabels: Record<string, string> = {
    id: "🇮🇩 ID",
    en: "🇺🇸 EN",
    hokkien: "🇨🇳 闽",
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-40 h-9 relative">
              <Image
                src="/brand/logo-primary.png"
                alt="Prime Wellness"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-[#0A1628] font-medium transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-sm">
                  {localeLabels[locale]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("id")}>🇮🇩 Bahasa Indonesia</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>🇺🇸 English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("hokkien")}>🇨🇳 閩南語</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/sign-in">
              <Button variant="outline" size="sm" className="border-[#0A1628] text-[#0A1628] hover:bg-gray-50">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/booking">
              <Button size="sm" className="bg-[#0A1628] hover:bg-[#1B3A6B] text-white">
                {t("common.bookNow")}
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-[#0A1628] font-medium py-2 px-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/sign-in" className="flex-1">
                <Button variant="outline" className="w-full border-[#1B3A6B] text-[#0A1628]">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/booking" className="flex-1">
                <Button className="w-full bg-[#0A1628] hover:bg-[#1B3A6B] text-white">
                  {t("common.bookNow")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
