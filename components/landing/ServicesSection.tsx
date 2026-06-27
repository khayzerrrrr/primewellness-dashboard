"use client";

import Link from "next/link";
import { Leaf, Hand, Wind, Flame, Zap, Droplets, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";

const SERVICES_DATA = [
  {
    icon: Zap,
    name: "Akupunktur Tanpa Jarum",
    description: "Stimulasi titik akupunktur menggunakan teknologi elektro-stimulasi tanpa rasa sakit",
    duration: 60,
    price: 300000,
    color: "bg-blue-100 text-blue-600",
    badge: "Populer",
    badgeColor: "bg-blue-500",
  },
  {
    icon: Hand,
    name: "Pijat Refleksi",
    description: "Pemijatan pada titik refleks telapak kaki dan tangan untuk melancarkan energi tubuh",
    duration: 60,
    price: 300000,
    color: "bg-green-100 text-green-600",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Wind,
    name: "Terapi Cupping (Bekam)",
    description: "Teknik bekam modern untuk melancarkan sirkulasi darah dan mengurangi nyeri otot",
    duration: 45,
    price: 300000,
    color: "bg-orange-100 text-orange-600",
    badge: "Terlaris",
    badgeColor: "bg-orange-500",
  },
  {
    icon: Leaf,
    name: "Herbal TCM",
    description: "Ramuan herbal tradisional Tiongkok yang diformulasikan khusus sesuai kondisi tubuh",
    duration: 30,
    price: 300000,
    color: "bg-emerald-100 text-emerald-600",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Flame,
    name: "Moxibustion",
    description: "Terapi panas menggunakan tanaman mugwort untuk menghangatkan meridian dan menguatkan imun",
    duration: 45,
    price: 300000,
    color: "bg-red-100 text-red-600",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Droplets,
    name: "Gua Sha",
    description: "Teknik scraping pada kulit untuk membuang toksin dan meningkatkan sirkulasi limfatik",
    duration: 45,
    price: 300000,
    color: "bg-purple-100 text-purple-600",
    badge: "Baru",
    badgeColor: "bg-purple-500",
  },
];

export function ServicesSection() {
  const t = useTranslations("services");
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#0A1628]/10 text-[#0A1628] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Leaf className="w-4 h-4 text-green-600" />
            {t("title")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_DATA.map((service) => (
            <Card
              key={service.name}
              className="border border-gray-200 hover:shadow-lg hover:border-[#0A1628]/30 transition-all duration-300 group bg-white"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  {service.badge && (
                    <Badge className={`${service.badgeColor} text-white text-xs`}>
                      {service.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-[#0A1628] transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{service.duration} menit</span>
                  <span className="font-bold text-[#0A1628] text-base">{formatCurrency(service.price)}/sesi</span>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-0">
                <Link href="/booking" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-[#0A1628] text-[#0A1628] hover:bg-[#0A1628] hover:text-white transition-colors"
                  >
                    {t("bookService")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Voucher promo banner */}
        <div className="mt-12 bg-gradient-to-r from-[#0A1628] to-[#1B3A6B] rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Hemat Lebih Banyak dengan Paket Voucher</h3>
          <p className="text-blue-200 mb-6">Beli paket sesi dan dapatkan diskon hingga 20%</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
            {[
              { sesi: 5, diskon: "5%", harga: "Rp 1.425.000" },
              { sesi: 10, diskon: "10%", harga: "Rp 2.700.000" },
              { sesi: 15, diskon: "15%", harga: "Rp 3.825.000" },
              { sesi: 20, diskon: "20%", harga: "Rp 4.800.000" },
            ].map((v) => (
              <div key={v.sesi} className="bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-2xl font-bold">{v.sesi}</p>
                <p className="text-xs text-blue-200">sesi</p>
                <p className="text-orange-300 font-semibold text-sm mt-1">Diskon {v.diskon}</p>
                <p className="text-xs text-white font-medium mt-1">{v.harga}</p>
              </div>
            ))}
          </div>
          <Link href="/sign-up">
            <Button className="bg-white text-[#0A1628] hover:bg-gray-100 font-semibold px-8">
              Daftar & Beli Voucher
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
