"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle, XCircle, Upload, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInvoices } from "@/lib/firebase/firestore-service";
import { updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import type { Invoice } from "@/types";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  virtual_account: "Virtual Account",
};
const METHOD_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-700",
  bank_transfer: "bg-blue-100 text-blue-700",
  qris: "bg-purple-100 text-purple-700",
  virtual_account: "bg-orange-100 text-orange-700",
};

const getInvDate = (inv: { date?: unknown }): Date | null => {
  if (!inv.date) return null;
  if (inv.date instanceof Date) return inv.date;
  const ts = inv.date as { toDate?: () => Date };
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
};

const BANK_ACCOUNTS = [
  { bank: "BCA", number: "1234567890", name: "PT Prime Wellness Indonesia" },
  { bank: "Mandiri", number: "0987654321", name: "PT Prime Wellness Indonesia" },
  { bank: "BNI", number: "1122334455", name: "PT Prime Wellness Indonesia" },
];

export default function PaymentPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("unpaid");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState("cash");
  const [proofUrl, setProofUrl] = useState("");
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    setLoading(true);
    const invs = await getInvoices();
    setInvoices(invs as Invoice[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    setConfirming(true);
    try {
      await updateDoc(doc(db, "invoices", selectedInvoice.id), {
        status: "paid",
        paymentMethod: payMethod,
        paidAt: Timestamp.now(),
        confirmedBy: user?.uid,
        proofUrl: proofUrl || null,
      });
      setSelectedInvoice(null);
      setProofUrl("");
      setPayMethod("cash");
      await load();
    } catch { /* ignore */ }
    setConfirming(false);
  };

  const handleReject = async (invoice: Invoice) => {
    if (!confirm("Tolak pembayaran ini?")) return;
    await updateDoc(doc(db, "invoices", invoice.id), {
      status: "cancelled",
      rejectedAt: Timestamp.now(),
      rejectedBy: user?.uid,
    });
    await load();
  };

  const filtered = invoices.filter((i) => {
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    const matchSearch = !search || i.patientName?.toLowerCase().includes(search.toLowerCase()) || i.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A1628]">Proses Pembayaran</h1>
        <p className="text-gray-500 text-sm">Konfirmasi pembayaran cash, transfer, atau QRIS dari pasien</p>
      </div>

      {/* Bank Info */}
      <Card className="border-0 bg-[#0A1628] text-white shadow-sm">
        <CardContent className="p-5">
          <p className="text-white/70 text-sm mb-3 font-medium">Rekening Klinik</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BANK_ACCOUNTS.map((b) => (
              <div key={b.bank} className="bg-white/10 rounded-xl p-3">
                <p className="font-bold text-sm">{b.bank}</p>
                <p className="text-xl font-mono mt-1">{b.number}</p>
                <p className="text-white/60 text-xs mt-1">{b.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Belum Bayar", count: invoices.filter((i) => i.status === "unpaid").length, color: "bg-red-50 text-red-700 border-red-100" },
          { label: "Sudah Lunas", count: invoices.filter((i) => i.status === "paid").length, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Dibatalkan", count: invoices.filter((i) => i.status === "cancelled").length, color: "bg-gray-50 text-gray-600 border-gray-100" },
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
            placeholder="Cari nama pasien atau no. invoice..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Semua Status</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="paid">Sudah Lunas</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {/* Invoice List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Tidak ada invoice</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Invoice</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Pasien</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Layanan</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Total</th>
                      <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-mono text-xs text-[#1B3A6B]">{inv.invoiceNumber}</p>
                          <p className="text-xs text-gray-400">{getInvDate(inv) ? formatDate(getInvDate(inv)!, "dd MMM yyyy") : "—"}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{inv.patientName}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{inv.serviceName || "—"}</td>
                        <td className="py-3 px-4 font-bold text-[#0A1628]">{formatCurrency(inv.total)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            inv.status === "paid" ? "bg-green-100 text-green-700" :
                            inv.status === "unpaid" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {inv.status === "paid" ? "Lunas" : inv.status === "unpaid" ? "Belum Bayar" : "Dibatalkan"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {inv.status === "unpaid" ? (
                            <Button
                              size="sm"
                              className="bg-[#0A1628] hover:bg-[#1B3A6B] text-white text-xs h-7"
                              onClick={() => setSelectedInvoice(inv)}
                            >
                              Konfirmasi
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {inv.status === "paid" ? "✓ Lunas" : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((inv) => (
                  <div key={inv.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{inv.patientName}</p>
                        <p className="text-xs font-mono text-[#1B3A6B]">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-400">{getInvDate(inv) ? formatDate(getInvDate(inv)!, "dd MMM yyyy") : "—"}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        inv.status === "paid" ? "bg-green-100 text-green-700" :
                        inv.status === "unpaid" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {inv.status === "paid" ? "Lunas" : inv.status === "unpaid" ? "Belum Bayar" : "Dibatalkan"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 truncate">{inv.serviceName || "—"}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#0A1628] text-base">{formatCurrency(inv.total)}</p>
                      {inv.status === "unpaid" && (
                        <Button
                          size="sm"
                          className="bg-[#0A1628] hover:bg-[#1B3A6B] text-white text-xs h-8"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          Konfirmasi Pembayaran
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#0A1628]">Konfirmasi Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Invoice</p>
                <p className="font-mono font-bold text-[#0A1628]">{selectedInvoice.invoiceNumber}</p>
                <p className="font-medium text-slate-800 mt-2">{selectedInvoice.patientName}</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(selectedInvoice.total)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {["cash", "bank_transfer", "qris", "virtual_account"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                        payMethod === m ? "border-[#0A1628] bg-[#0A1628]/5 text-[#0A1628]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {METHOD_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {(payMethod === "bank_transfer" || payMethod === "qris") && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">URL Bukti Pembayaran (opsional)</label>
                  <input
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1628]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste URL bukti transfer dari WhatsApp/Google Drive</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedInvoice(null)}>
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                >
                  <CheckCircle className="w-4 h-4" />
                  {confirming ? "Memproses..." : "Konfirmasi Lunas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
