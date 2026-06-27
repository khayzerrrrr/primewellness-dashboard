"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, Calendar, Star, Users, Award, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations();

  const stats = [
    { icon: Users, value: "500+", label: "Pasien Puas", color: "bg-blue-100 text-blue-600" },
    { icon: Award, value: "10+", label: "Terapis Bersertifikat", color: "bg-green-100 text-green-600" },
    { icon: Star, value: "5+", label: "Tahun Pengalaman", color: "bg-orange-100 text-orange-600" },
    { icon: Leaf, value: "8+", label: "Jenis Terapi TCM", color: "bg-red-100 text-red-600" },
  ];

  const therapies = [
    "Akupunktur Tanpa Jarum - 09:00",
    "Pijat Refleksi - 10:30",
    "Terapi Cupping - 14:00",
  ];

  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16">
      <div className="container mx-auto px-4 max-w-7xl py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#1a2744]/10 text-[#1a2744] px-4 py-2 rounded-full text-sm font-medium border border-[#1a2744]/20">
              <Leaf className="w-4 h-4 text-green-600" />
              Where TCM meets biotechnology
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-[#1a2744]">Prime Wellness</span>
              <br />
              <span className="text-2xl md:text-3xl font-semibold text-gray-500 tracking-wide">
                THERAPY & RELIEFY
              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
              Pusat terapi kesehatan holistik yang menggabungkan kearifan TCM (Traditional Chinese Medicine)
              dengan bioteknologi modern untuk pemulihan optimal Anda.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/booking">
                <Button
                  size="lg"
                  className="bg-[#1a2744] hover:bg-[#2a3a60] text-white px-8 py-3 text-base font-semibold gap-2 w-full sm:w-auto shadow-lg"
                >
                  <Calendar className="w-5 h-5" />
                  Booking Sekarang
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744]/5 px-8 py-3 text-base font-semibold gap-2 w-full sm:w-auto"
                >
                  Daftar Sekarang
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#1a2744] to-[#2a3a60] rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1a2744]/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#1a2744]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Jadwal Terapi Hari Ini</p>
                    <p className="text-sm text-gray-500">Tersedia Online 24/7</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="space-y-2">
                  {therapies.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : "bg-orange-500"}`} />
                      <span className="text-sm text-slate-700">{item}</span>
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Tersedia</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo in card */}
              <div className="mt-4 flex justify-center">
                <Image src="/logo.png" alt="Prime Wellness" width={100} height={100} className="object-contain opacity-80" />
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-2 border border-gray-100">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-slate-800">4.9/5</span>
              <span className="text-sm text-gray-500">Rating</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[["T","bg-blue-500"], ["P","bg-green-500"], ["A","bg-orange-500"]].map(([letter, bg]) => (
                    <div key={letter} className={`w-8 h-8 ${bg} rounded-full border-2 border-white flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{letter}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">500+ Pasien</p>
                  <p className="text-xs text-gray-500">Mempercayai kami</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
