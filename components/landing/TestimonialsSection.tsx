"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTestimonials } from "@/lib/firebase/firestore-service";
import { getInitials } from "@/lib/utils";
import type { Testimonial } from "@/types";

const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    patientId: "p1",
    patientName: "Ibu Sari Wulandari",
    rating: 5,
    comment: "Pelayanan sangat baik dan dokternya ramah. Proses booking online sangat mudah dan cepat. Saya sangat puas!",
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    patientId: "p2",
    patientName: "Bapak Hendra Kurniawan",
    rating: 5,
    comment: "Klinik yang bersih dan modern. Dokternya profesional dan menjelaskan kondisi kesehatan dengan detail. Sangat direkomendasikan!",
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    patientId: "p3",
    patientName: "Ibu Maya Pratiwi",
    rating: 4,
    comment: "Rekam medis digital sangat memudahkan. Tidak perlu bawa berkas-berkas kertas lagi. Pelayanan cepat dan profesional.",
    isPublished: true,
    createdAt: new Date(),
  },
];

export function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const [testimonials, setTestimonials] = useState<Testimonial[]>(SAMPLE_TESTIMONIALS);

  useEffect(() => {
    getTestimonials(true)
      .then((data) => { if (data.length > 0) setTestimonials(data); })
      .catch(() => {});
  }, []);

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <Quote className="w-8 h-8 text-blue-200 mb-4" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">
                  &ldquo;{testimonial.comment}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B3A6B] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {getInitials(testimonial.patientName)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {testimonial.patientName}
                    </p>
                    <p className="text-xs text-gray-500">{t("patientOf")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
