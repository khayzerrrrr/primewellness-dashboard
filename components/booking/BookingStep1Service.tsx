"use client";

import { useEffect, useState } from "react";
import { Stethoscope, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getServices } from "@/lib/firebase/firestore-service";
import { formatCurrency } from "@/lib/utils";
import type { Service } from "@/types";

interface Props {
  selected: Service | null;
  onSelect: (service: Service) => void;
}

export function BookingStep1Service({ selected, onSelect }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getServices(true)
      .then((data) => { setServices(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pilih Layanan</h2>
        <p className="text-gray-500 text-sm mt-1">
          Pilih layanan yang sesuai dengan kebutuhan Anda
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-red-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Gagal memuat layanan</p>
          <p className="text-gray-400 text-sm mt-1">Periksa koneksi internet Anda dan coba refresh halaman</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada layanan tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                selected?.id === service.id
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-gray-100 hover:border-blue-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-5 h-5 text-[#1B3A6B]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{service.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[#0A1628] font-bold text-sm">{formatCurrency(service.price)}</span>
                    <span className="text-gray-400 text-xs">• {service.duration} menit</span>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 mt-1 transition-colors ${selected?.id === service.id ? "text-[#2563EB]" : "text-gray-300"}`} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
