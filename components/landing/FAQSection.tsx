"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFAQs } from "@/lib/firebase/firestore-service";
import type { FAQ } from "@/types";

const SAMPLE_FAQS: FAQ[] = [
  {
    id: "1",
    question: "Bagaimana cara booking appointment secara online?",
    answer: "Anda dapat melakukan booking melalui website kami. Pilih layanan, dokter, tanggal dan jam yang tersedia, kemudian konfirmasi booking Anda. Nomor booking akan dikirimkan melalui WhatsApp.",
    order: 1,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    question: "Apakah pasien baru perlu mendaftar terlebih dahulu?",
    answer: "Ya, pasien baru perlu membuat akun terlebih dahulu. Pendaftaran sangat mudah dan hanya membutuhkan beberapa menit. Setelah terdaftar, Anda dapat langsung melakukan booking.",
    order: 2,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    question: "Berapa lama sebelum appointment saya mendapat konfirmasi?",
    answer: "Konfirmasi appointment akan dikirimkan melalui WhatsApp dalam waktu 1x24 jam setelah booking dibuat. Reminder juga akan dikirimkan H-1 sebelum jadwal.",
    order: 3,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: "4",
    question: "Metode pembayaran apa saja yang tersedia?",
    answer: "Kami menerima pembayaran tunai, transfer bank, dan QRIS. Invoice akan diterbitkan setelah konsultasi selesai.",
    order: 4,
    isPublished: true,
    createdAt: new Date(),
  },
  {
    id: "5",
    question: "Apakah rekam medis saya aman?",
    answer: "Ya, seluruh data rekam medis tersimpan dengan enkripsi yang aman menggunakan Firebase. Data Anda hanya dapat diakses oleh dokter yang berwenang dan diri Anda sendiri.",
    order: 5,
    isPublished: true,
    createdAt: new Date(),
  },
];

export function FAQSection() {
  const t = useTranslations("faq");
  const [faqs, setFaqs] = useState<FAQ[]>(SAMPLE_FAQS);

  useEffect(() => {
    getFAQs(true)
      .then((data) => { if (data.length > 0) setFaqs(data); })
      .catch(() => {});
  }, []);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-gray-600">{t("subtitle")}</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border border-gray-200 rounded-xl px-6 hover:border-teal-200 transition-colors"
            >
              <AccordionTrigger className="text-left font-medium text-slate-800 hover:text-teal-700 py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
