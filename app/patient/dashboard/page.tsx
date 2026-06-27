"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, Receipt, Plus, Clock, Ticket, ChevronRight, Activity, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentBadge } from "@/components/dashboard/AppointmentBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getAppointmentsByPatient, getInvoices } from "@/lib/firebase/firestore-service";
import { formatDate, formatCurrency } from "@/lib/utils";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Appointment, Invoice } from "@/types";

interface PatientVoucher {
  id: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  status: string;
  expiryDate?: { toDate(): Date };
}

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vouchers, setVouchers] = useState<PatientVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      const [apps, invs] = await Promise.all([
        getAppointmentsByPatient(user.uid),
        getInvoices(user.uid),
      ]);
      setAppointments(apps as Appointment[]);
      setInvoices(invs as Invoice[]);

      // Load active vouchers
      try {
        const vSnap = await getDocs(query(
          collection(db, "vouchers"),
          where("patientId", "==", user.uid),
          where("status", "==", "active")
        ));
        setVouchers(vSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PatientVoucher)));
      } catch { /* vouchers optional */ }

      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user?.uid]);

  const upcoming = appointments
    .filter((a) => ["pending", "confirmed", "checked_in"].includes(a.status))
    .sort((a, b) => {
      const da = a.date instanceof Date ? a.date : (a.date as unknown as { toDate(): Date })?.toDate?.() ?? new Date();
      const db2 = b.date instanceof Date ? b.date : (b.date as unknown as { toDate(): Date })?.toDate?.() ?? new Date();
      return da.getTime() - db2.getTime();
    });
  const completed = appointments.filter((a) => a.status === "completed");
  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid");
  const nextApp = upcoming[0];
  const totalVoucherSessions = vouchers.reduce((s, v) => s + v.remainingSessions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628]">Selamat Datang! 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">Pantau perjalanan terapi Anda</p>
        </div>
        <Link href="/booking">
          <Button className="bg-[#0A1628] hover:bg-[#1B3A6B] text-white gap-2">
            <Plus className="w-4 h-4" />
            Booking Terapi
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Appointment Aktif", value: upcoming.length, icon: Calendar, color: "bg-blue-100 text-blue-600", href: "/patient/appointments" },
          { label: "Sesi Selesai", value: completed.length, icon: Activity, color: "bg-green-100 text-green-600", href: "/patient/appointments" },
          { label: "Tagihan Belum Bayar", value: unpaidInvoices.length, icon: Receipt, color: "bg-red-100 text-red-600", href: "/patient/invoices" },
          { label: "Sesi Voucher Tersisa", value: totalVoucherSessions, icon: Ticket, color: "bg-orange-100 text-orange-600", href: "/patient/vouchers" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-white rounded-2xl p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              {loading ? <Skeleton className="h-12 w-full" /> : (
                <>
                  <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-2`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Voucher aktif banner */}
      {!loading && vouchers.length > 0 && (
        <div className="bg-gradient-to-r from-[#0A1628] to-[#1B3A6B] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">{totalVoucherSessions} Sesi Tersisa</p>
                <p className="text-white/70 text-sm">
                  {vouchers.length} paket aktif · {vouchers[0]?.packageName}
                  {vouchers[0]?.expiryDate && ` · berlaku hingga ${formatDate(vouchers[0].expiryDate.toDate(), "dd MMM yyyy")}`}
                </p>
              </div>
            </div>
            <Link href="/patient/vouchers">
              <Button variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 gap-1">
                Lihat Paket <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          {/* Progress bar */}
          {vouchers[0] && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/60 mb-1.5">
                <span>{vouchers[0].usedSessions} sesi telah digunakan</span>
                <span>{vouchers[0].remainingSessions} / {vouchers[0].totalSessions} tersisa</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(vouchers[0].usedSessions / vouchers[0].totalSessions) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next appointment highlight */}
      {!loading && nextApp && (
        <Card className="border-0 shadow-sm border-l-4 border-l-[#2563EB]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-[#1B3A6B]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Appointment Berikutnya</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{nextApp.serviceName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(
                      nextApp.date instanceof Date ? nextApp.date : (nextApp.date as unknown as { toDate(): Date })?.toDate?.() ?? new Date(),
                      "EEEE, dd MMMM yyyy"
                    )} · {nextApp.timeSlot}
                  </p>
                  {nextApp.doctorName && <p className="text-xs text-gray-400 mt-0.5">Terapis: {nextApp.doctorName}</p>}
                </div>
              </div>
              <AppointmentBadge status={nextApp.status} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Appointment Mendatang</CardTitle>
            <Link href="/patient/appointments">
              <Button variant="ghost" size="sm" className="text-[#1B3A6B] text-xs gap-1">
                Semua <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Tidak ada appointment mendatang</p>
                <Link href="/booking">
                  <Button size="sm" className="mt-3 bg-[#1B3A6B] hover:bg-[#0A1628] text-white">
                    Buat Appointment
                  </Button>
                </Link>
              </div>
            ) : (
              upcoming.slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-[#1B3A6B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{app.serviceName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(
                        app.date instanceof Date ? app.date : (app.date as unknown as { toDate(): Date })?.toDate?.() ?? new Date()
                      )} · {app.timeSlot}
                    </p>
                    <div className="mt-1"><AppointmentBadge status={app.status} /></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Invoice & Riwayat Terapi */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-[#0A1628]">Riwayat Terapi</CardTitle>
            <Link href="/patient/invoices">
              <Button variant="ghost" size="sm" className="text-[#1B3A6B] text-xs gap-1">
                Invoice <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : completed.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada riwayat terapi</p>
              </div>
            ) : (
              completed.slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{app.serviceName}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(
                          app.date instanceof Date ? app.date : (app.date as unknown as { toDate(): Date })?.toDate?.() ?? new Date()
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Selesai</span>
                </div>
              ))
            )}

            {/* Tagihan unpaid */}
            {unpaidInvoices.length > 0 && (
              <div className="mt-2 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-red-600 mb-2">Tagihan Belum Dibayar:</p>
                {unpaidInvoices.slice(0, 2).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg mb-1.5">
                    <div>
                      <p className="text-xs font-medium text-red-800 font-mono">{inv.invoiceNumber}</p>
                      <p className="text-xs text-red-500">{inv.serviceName}</p>
                    </div>
                    <p className="text-sm font-bold text-red-700">{formatCurrency(inv.total)}</p>
                  </div>
                ))}
                <Link href="/patient/invoices">
                  <Button size="sm" className="w-full mt-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                    <Wallet className="w-3 h-3 mr-1" />
                    Bayar Sekarang
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
