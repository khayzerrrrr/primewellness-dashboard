"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, MapPin, Mail, Clock, MessageCircle } from "lucide-react";
import { CLINIC_INFO } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const quickLinks = [
    { href: "#services", label: tNav("services") },
    { href: "#doctors", label: tNav("doctors") },
    { href: "#about", label: tNav("about") },
    { href: "/booking", label: "Booking Online" },
    { href: "/sign-up", label: tNav("register") },
  ];

  const legalLinks = [
    { href: "/privacy-policy", label: t("privacyPolicy") },
    { href: "/terms", label: t("terms") },
  ];

  return (
    <footer className="bg-[#0A1628] text-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <div className="w-44 h-10 relative">
                <Image src="/brand/logo-on-dark.png" alt="Prime Wellness" fill className="object-contain object-left" />
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {t("description")}
            </p>
            <div className="flex gap-3">
              {[
                { href: CLINIC_INFO.instagram, icon: Instagram, label: "Instagram" },
                { href: "#", icon: Facebook, label: "Facebook" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors border border-white/10"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("quickLinks")}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                  >
                    <span className="w-1 h-1 bg-orange-400 rounded-full" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("contact")}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-orange-400 flex-shrink-0" />
                <a href={CLINIC_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {CLINIC_INFO.address}
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href={CLINIC_INFO.waUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {CLINIC_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{CLINIC_INFO.email}</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
                <div>
                  <p>Senin – Sabtu: 09:00 – 20:00</p>
                  <p>Minggu: 10:00 – 17:00</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("legal")}</h4>
            <ul className="space-y-2 mb-6">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-2">Jam Operasional</p>
              <p className="text-sm font-semibold text-white">Buka Setiap Hari</p>
              <p className="text-xs text-blue-300">09:00 — 20:00 WIB</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">{t("copyright")}</p>
          <p className="text-slate-600 text-xs">Where TCM meets biotechnology 🌿</p>
        </div>
      </div>
    </footer>
  );
}
