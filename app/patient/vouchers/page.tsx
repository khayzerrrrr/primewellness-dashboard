"use client";

import { useEffect, useState } from "react";
import { Ticket, CheckCircle, Clock, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VOUCHER_PACKAGES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, getDocs, query, where, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

interface PatientVoucher {
  id: string;
  patientId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  price: number;
  purchasedAt: Date;
  expiryDate?: Date;
  status: "active" | "used" | "expired";
}

export default function PatientVouchersPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<PatientVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "patient_vouchers"), where("patientId", "==", user.uid));
      const snap = await getDocs(q);
      setVouchers(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        purchasedAt: d.data().purchasedAt?.toDate?.() ?? new Date(),
        expiryDate: d.data().expiryDate?.toDate?.(),
      })) as PatientVoucher[]);
    } catch { setVouchers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleBuy = async (pkgId: string) => {
    const pkg = VOUCHER_PACKAGES.find((p) => p.id === pkgId);
    if (!pkg || !user) return;
    setPurchasing(pkgId);
    try {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      await addDoc(collection(db, "patient_vouchers"), {
        patientId: user.uid,
        patientName: user.displayName,
        packageId: pkg.id,
        packageName: pkg.name,
        totalSessions: pkg.sessions,
        usedSessions: 0,
        remainingSessions: pkg.sessions,
        price: pkg.totalPrice,
        discount: pkg.discountPercent,
        purchasedAt: Timestamp.now(),
        expiryDate: Timestamp.fromDate(expiry),
        status: "pending_payment",
        paymentStatus: "pending",
      });
      alert(`Permintaan pembelian voucher ${pkg.name} berhasil dikirim!\nAdmin akan mengkonfirmasi setelah pembayaran diterima.`);
      setShowPurchaseConfirm(null);
      await load();
    } catch { /* ignore */ }
    setPurchasing(null);
  };

  const activeVouchers = vouchers.filter((v) => v.status === "active");
  const usedVouchers = vouchers.filter((v) => v.status === "used" || v.status === "expired");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2744]">Voucher Sesi Terapi</h1>
        <p className="text-gray-500 text-sm mt-1">Beli paket sesi dan hemat lebih banyak</p>
      </div>

      {/* Active Vouchers */}
      {!loading && activeVouchers.length > 0 && (
        <div>
          <h2 className="font-semibold text-[#1a2744] mb-3">Voucher Aktif Saya</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeVouchers.map((v) => {
              const pct = v.totalSessions > 0 ? Math.round(((v.totalSessions - v.usedSessions) / v.totalSessions) * 100) : 0;
              return (
                <div key={v.id} className="bg-gradient-to-br from-[#1a2744] to-[#2a3a60] rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/70 text-sm">{v.packageName}</span>
                    <Ticket className="w-5 h-5 text-white/50" />
                  </div>
                  <p className="text-3xl font-bold mb-1">{v.remainingSessions} <span className="text-lg font-normal text-white/70">sesi tersisa</span></p>
                  <p className="text-white/60 text-xs mb-4">dari {v.totalSessions} sesi total</p>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{v.usedSessions} digunakan</span>
                    {v.expiryDate && <span>Exp: {formatDate(v.expiryDate, "dd/MM/yyyy")}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Buy Packages */}
      <div>
        <h2 className="font-semibold text-[#1a2744] mb-3">Beli Paket Voucher</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VOUCHER_PACKAGES.map((pkg) => {
            const originalPrice = pkg.sessions * 300000;
            const isPopular = pkg.sessions === 10;
            return (
              <Card key={pkg.id} className={`border-0 shadow-sm overflow-hidden ${isPopular ? "ring-2 ring-[#1a2744]" : ""}`}>
                {isPopular && (
                  <div className="bg-[#1a2744] text-white text-xs text-center py-1.5 font-medium">
                    ⭐ Paling Populer
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-[#1a2744]">{pkg.sessions}</p>
                    <p className="text-gray-500 text-sm">sesi terapi</p>
                  </div>
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Harga normal</span>
                      <span className="text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Diskon {pkg.discountPercent}%</span>
                      <span className="text-green-600 font-medium">-{formatCurrency(originalPrice - pkg.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1a2744] border-t border-gray-100 pt-2 mt-2">
                      <span>Total Bayar</span>
                      <span>{formatCurrency(pkg.totalPrice)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mb-4">
                    = {formatCurrency(Math.round(pkg.totalPrice / pkg.sessions))}/sesi
                  </p>
                  {showPurchaseConfirm === pkg.id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 text-center">Konfirmasi pembelian?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPurchaseConfirm(null)}>Batal</Button>
                        <Button size="sm" className="flex-1 bg-[#1a2744]" onClick={() => handleBuy(pkg.id)} disabled={purchasing === pkg.id}>
                          {purchasing === pkg.id ? "..." : "Ya"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className={`w-full ${isPopular ? "bg-[#1a2744] hover:bg-[#2a3a60]" : "bg-gray-900 hover:bg-gray-800"} text-white`}
                      onClick={() => setShowPurchaseConfirm(pkg.id)}
                    >
                      Beli Paket
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card className="border-0 bg-blue-50 shadow-none">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Gift className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Cara Pembelian Voucher:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Pilih paket dan klik &quot;Beli Paket&quot;</li>
                <li>Lakukan pembayaran ke rekening klinik (tanyakan ke front office)</li>
                <li>Kirim bukti transfer ke WhatsApp klinik atau ke front office</li>
                <li>Admin akan mengkonfirmasi dan voucher akan aktif dalam 1x24 jam</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voucher History */}
      {usedVouchers.length > 0 && (
        <div>
          <h2 className="font-semibold text-[#1a2744] mb-3">Riwayat Voucher</h2>
          <div className="space-y-2">
            {usedVouchers.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-700">{v.packageName}</p>
                  <p className="text-xs text-gray-400">{formatDate(v.purchasedAt, "dd MMM yyyy")}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-500">
                  {v.status === "expired" ? "Kadaluarsa" : "Habis Digunakan"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
