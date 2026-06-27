"use client";

import { useEffect, useState } from "react";
import { Receipt, DollarSign, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoicePrint } from "@/components/invoice/InvoicePrint";
import { getInvoices, createPayment } from "@/lib/firebase/firestore-service";
import { formatDate, formatCurrency } from "@/lib/utils";
import { INVOICE_STATUS_COLORS } from "@/lib/constants";
import type { Invoice, PaymentMethod } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Belum Bayar",
  paid: "Lunas",
  refunded: "Dikembalikan",
  void: "Batal",
  cancelled: "Dibatalkan",
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    const data = await getInvoices();
    setInvoices(data as Invoice[]);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const handlePayment = async () => {
    if (!payingInvoice) return;
    setSaving(true);
    try {
      await createPayment({
        invoiceId: payingInvoice.id,
        amount: payingInvoice.total,
        paymentDate: new Date(),
        method: paymentMethod,
        status: "confirmed",
        reference,
      });
      toast.success("Pembayaran berhasil dicatat");
      setPayingInvoice(null);
      setReference("");
      load();
    } catch {
      toast.error("Gagal mencatat pembayaran");
    } finally {
      setSaving(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch = !search || (inv.patientName ?? "").toLowerCase().includes(q) || (inv.invoiceNumber ?? "").toLowerCase().includes(q) || (inv.serviceName ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">Invoice & Pembayaran</h1>
          <p className="text-gray-500 text-sm">{invoices.length} invoice total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice, pasien, layanan..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">Semua Status</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="paid">Lunas</option>
          <option value="refunded">Dikembalikan</option>
          <option value="void">Batal</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice #</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Pasien</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Layanan</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="py-3 px-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  {search || filterStatus !== "all" ? "Tidak ada invoice sesuai filter" : "Tidak ada invoice"}
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-teal-600">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{inv.patientName}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs max-w-[140px] truncate">{inv.serviceName}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(inv.total)}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {typeof inv.date === "object" && "toDate" in inv.date
                      ? formatDate((inv.date as { toDate(): Date }).toDate())
                      : formatDate(inv.date as Date)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => setPrintInvoice(inv)}>
                        <Printer className="w-3 h-3" />
                        Cetak
                      </Button>
                      {inv.status === "unpaid" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8 text-xs"
                          onClick={() => { setPayingInvoice(inv); setReference(""); setPaymentMethod("cash"); }}
                        >
                          <DollarSign className="w-3 h-3" />
                          Bayar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search || filterStatus !== "all" ? "Tidak ada invoice sesuai filter" : "Tidak ada invoice"}</p>
          </div>
        ) : (
          filtered.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{inv.patientName}</p>
                  <p className="text-xs font-mono text-teal-600">{inv.invoiceNumber}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[inv.status] ?? inv.status}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500 truncate"><span className="font-medium">Layanan:</span> {inv.serviceName}</p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Tanggal:</span>{" "}
                  {typeof inv.date === "object" && "toDate" in inv.date
                    ? formatDate((inv.date as { toDate(): Date }).toDate())
                    : formatDate(inv.date as Date)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-slate-800">{formatCurrency(inv.total)}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => setPrintInvoice(inv)}>
                    <Printer className="w-3 h-3" />Cetak
                  </Button>
                  {inv.status === "unpaid" && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8 text-xs"
                      onClick={() => { setPayingInvoice(inv); setReference(""); setPaymentMethod("cash"); }}>
                      <DollarSign className="w-3 h-3" />Bayar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!payingInvoice} onOpenChange={(o) => !o && setPayingInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
          </DialogHeader>
          {payingInvoice && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Invoice: <span className="font-mono font-medium text-teal-600">{payingInvoice.invoiceNumber}</span></p>
                <p className="text-sm text-gray-500">Pasien: <span className="font-medium text-slate-800">{payingInvoice.patientName}</span></p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{formatCurrency(payingInvoice.total)}</p>
              </div>
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referensi / No. Transaksi (opsional)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Nomor transaksi" />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={saving} onClick={handlePayment}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</> : "Konfirmasi Pembayaran"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Print Modal */}
      {printInvoice && <InvoicePrint invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}
    </div>
  );
}
