"use client";

import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail, Clock, MessageCircle, Navigation, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLINIC_INFO } from "@/lib/constants";

const OPERATIONAL_HOURS = [
  { day: "Senin – Sabtu", hours: "09:00 – 20:00" },
  { day: "Minggu", hours: "10:00 – 17:00" },
];

export function ContactSection() {
  const t = useTranslations("contact");

  const WA_MSG = "Halo Prime Wellness, saya ingin bertanya mengenai layanan terapi. 🙏";
  const WA_REG_MSG = "Halo Prime Wellness, saya ingin mendaftar sebagai pasien baru. 🙏";

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-[#0A1628] to-[#0A1628] text-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-blue-200 text-lg">{t("subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <div className="space-y-5">
            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">{t("address")}</p>
                <p className="text-white font-medium mt-0.5">{CLINIC_INFO.address}</p>
                <p className="text-blue-200 text-sm">{CLINIC_INFO.city}</p>
              </div>
            </div>

            {/* Phone / WA */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">{t("phone")} / WhatsApp</p>
                <p className="text-white font-medium mt-0.5">{CLINIC_INFO.phone}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">{t("email")}</p>
                <p className="text-white font-medium mt-0.5">{CLINIC_INFO.email}</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">{t("hours")}</p>
                <div className="mt-1.5 space-y-1">
                  {OPERATIONAL_HOURS.map((h) => (
                    <div key={h.day} className="flex justify-between gap-8 text-sm">
                      <span className="text-blue-200">{h.day}</span>
                      <span className="text-white font-medium">{h.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={CLINIC_INFO.waUrl(WA_MSG)} target="_blank" rel="noopener noreferrer">
                <Button className="bg-green-500 hover:bg-green-600 text-white gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t("chatWhatsapp")}
                </Button>
              </a>
              <a href={CLINIC_INFO.waUrl(WA_REG_MSG)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-800 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t("registerViaWA")}
                </Button>
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 h-80">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(CLINIC_INFO.address + ", " + CLINIC_INFO.city)}&output=embed&z=16`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Prime Wellness"
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href={CLINIC_INFO.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border border-white/20"
          >
            <Navigation className="w-4 h-4 text-blue-300" />
            {t("openInGoogleMaps")}
          </a>
          <a
            href={CLINIC_INFO.waUrl(WA_MSG)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500/80 hover:bg-green-500 px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp: {CLINIC_INFO.phone}
          </a>
          <a
            href={CLINIC_INFO.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border border-white/20"
          >
            <Instagram className="w-4 h-4 text-pink-300" />
            @primewellness.id
          </a>
        </div>
      </div>
    </section>
  );
}
