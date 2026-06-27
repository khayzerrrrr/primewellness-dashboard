"use client";

import { UserCheck, CalendarCheck, FileText, Zap, Building2, Leaf } from "lucide-react";
import { useTranslations } from "next-intl";

const REASONS = [
  { icon: UserCheck, titleKey: "reason1Title", descKey: "reason1Desc", color: "bg-blue-100 text-blue-600", border: "hover:border-blue-200" },
  { icon: CalendarCheck, titleKey: "reason2Title", descKey: "reason2Desc", color: "bg-green-100 text-green-600", border: "hover:border-green-200" },
  { icon: FileText, titleKey: "reason3Title", descKey: "reason3Desc", color: "bg-purple-100 text-purple-600", border: "hover:border-purple-200" },
  { icon: Zap, titleKey: "reason4Title", descKey: "reason4Desc", color: "bg-orange-100 text-orange-600", border: "hover:border-orange-200" },
  { icon: Leaf, titleKey: "reason5Title", descKey: "reason5Desc", color: "bg-emerald-100 text-emerald-600", border: "hover:border-emerald-200" },
  { icon: Building2, titleKey: "reason6Title", descKey: "reason6Desc", color: "bg-red-100 text-red-600", border: "hover:border-red-200" },
];

export function WhyUsSection() {
  const t = useTranslations("whyUs");
  return (
    <section id="why-us" className="py-20 bg-white">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REASONS.map((reason, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border border-gray-100 ${reason.border} hover:shadow-lg transition-all duration-300 group`}
            >
              <div className={`w-12 h-12 ${reason.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <reason.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {t(reason.titleKey)}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t(reason.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
