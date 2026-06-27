"use client";

import { useEffect, useState } from "react";
import { Ticket, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, getDocs, updateDoc, doc, Timestamp, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";

interface VoucherRecord {
  id: string;
  patientId: string;
  patientName: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  price: number;
  discount: number;
  purchasedAt: Date;
  status: string;
  paymentStatus: string;
  expiryDate?: Date;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  pending_payment: "Menunggu Pembayaran",
  expired: "Kadaluarsa",
  cancelled: "Dibatalkan",
};

export default function FrontOfficeVouchersPage() {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending_payment");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "patient_vouchers"), orderBy("purchasedAt", "desc")));
      setVouchers(snap.docs.map((d) => ({
        id: d.id, ...d.data(),
        purchasedAt: d.data().purchasedAt?.toDate?.() ?? new Date(),
        expiryDate: d.data().expiryDate?.toDate?.(),
      })) as VoucherRecord[]);
    } catch { setVouchers([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (v: VoucherRecord) => {
    setProcessing(v.id);
    try {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      await updateDoc(doc(db, "patient_vouchers", v.id), {
        status: "active",
        paymentStatus: "confirmed",
        confirmedAt: Timestamp.now(),
        confirmedBy: user?.uid,
        expiryDate: Timestamp.fromDate(expiry),
        remainingSessions: v.totalSessions,
      });
      await load();
    } catch { /* ignore */ }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Tolak voucher ini?")) return;
    setProcessing(id);
    try {
      await updateDoc(doc(db, "patient_vouchers", id), {
        status: "cancelled",
        paymentStatus: "rejected",
        rejectedAt: Timestamp.now(),
        rejectedBy: user?.uid,
      });
      await load();
    } catch { /* ignore */ }
    setProcessing(null);
  };

  const filtered = vouchers.filter((v) => {
    const matchStatus = filterStatus === "all" || v.status === filterStatus;
    const matchSearch = !search || v.patientName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = vouchers.filter((v) => v.status === "pending_payment").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Voucher Pasien</h1>
          <p className="text-gray-500 text-sm">Konfirmasi pembelian paket sesi terapi</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">{pendingCount} voucher menunggu konfirmasi</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Menunggu Konfirmasi", count: vouchers.filter((v) => v.status === "pending_payment").length, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
          { label: "Voucher Aktif", count: vouchers.filter((v) => v.status === "active").length, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Kadaluarsa", count: vouchers.filter((v) => v.status === "expired").length, color: "bg-gray-50 text-gray-600 border-gray-100" },
          { label: "Dibatalkan", count: vouchers.filter((v) => v.status === "cancelled").length, color: "bg-red-50 text-red-600 border-red-100" },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pasien..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="pending_payment">Menunggu Konfirmasi</option>
          <option value="active">Aktif</option>
          <option value="expired">Kadaluarsa</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Voucher List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada voucher ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((v) => (
                <div key={v.id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      v.status === "active" ? "bg-green-100" : v.status === "pending_payment" ? "bg-yellow-100" : "bg-gray-100"
                    }`}>
                      <Ticket className={`w-5 h-5 ${
                        v.status === "active" ? "text-green-600" : v.status === "pending_payment" ? "text-yellow-600" : "text-gray-400"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{v.patientName}</p>
                      <p className="text-xs text-gray-500">{v.packageName} · {v.totalSessions} sesi</p>
                      <p className="text-xs font-medium text-[#1a2744] mt-0.5">{formatCurrency(v.price)}</p>
                      <p className="text-xs text-gray-400">Dipesan: {formatDate(v.purchasedAt, "dd MMM yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[v.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[v.status] ?? v.status}
                    </span>
                    {v.status === "pending_payment" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs gap-1"
                          onClick={() => handleApprove(v)}
                          disabled={processing === v.id}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Konfirmasi
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-2 text-xs gap-1"
                          onClick={() => handleReject(v.id)}
                          disabled={processing === v.id}
                        >
                          <XCircle className="w-3 h-3" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
