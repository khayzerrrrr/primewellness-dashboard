"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, CLINIC_INFO } from "@/lib/constants";
import type { Invoice } from "@/types";

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export function InvoicePrint({ invoice, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; color:#0f172a; background:#fff; padding:32px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom:2px solid #1a2744; padding-bottom:16px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    .info-box { background:#f8fafc; border-radius:8px; padding:12px; }
    .info-box-label { font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:600; letter-spacing:0.05em; margin-bottom:4px; }
    .info-box-value { font-size:13px; font-weight:500; color:#0f172a; }
    .table-header { background:#1a2744; color:#fff; display:grid; grid-template-columns:1fr 80px 120px; padding:10px 16px; border-radius:8px 8px 0 0; }
    .table-header span { font-size:11px; font-weight:600; }
    .table-row { display:grid; grid-template-columns:1fr 80px 120px; padding:12px 16px; border-bottom:1px solid #f1f5f9; }
    .table-row span { font-size:13px; }
    .total-section { margin-top:16px; }
    .total-line { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:#64748b; }
    .grand-total { display:flex; justify-content:space-between; padding:14px 16px; background:#1a2744; border-radius:8px; margin-top:8px; }
    .grand-total .label { font-size:14px; font-weight:600; color:#fff; }
    .grand-total .value { font-size:18px; font-weight:700; color:#fff; }
    .payment-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px; margin-top:16px; }
    .bank-box { background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; margin-top:16px; }
    .footer { text-align:center; margin-top:32px; padding-top:16px; border-top:1px dashed #e2e8f0; font-size:11px; color:#94a3b8; }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const invoiceDate = typeof invoice.date === "object" && "toDate" in invoice.date
    ? (invoice.date as unknown as { toDate(): Date }).toDate()
    : invoice.date as Date;

  const paidAtDate = invoice.paidAt
    ? (typeof invoice.paidAt === "object" && "toDate" in invoice.paidAt
      ? (invoice.paidAt as unknown as { toDate(): Date }).toDate()
      : invoice.paidAt as Date)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-800">Preview Invoice</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-[#1a2744] hover:bg-[#2a3a60] gap-2">
              <Printer className="w-4 h-4" />
              Cetak / PDF
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-[#1a2744]">
            <div>
              <p className="text-xl font-bold text-[#1a2744]">Prime Wellness</p>
              <p className="text-xs text-gray-500">{CLINIC_INFO.address}</p>
              <p className="text-xs text-gray-400 mt-0.5">WA: {CLINIC_INFO.phone} · {CLINIC_INFO.email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1a2744]">INVOICE</p>
              <p className="text-xs font-mono text-teal-600 mt-1">{invoice.invoiceNumber}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                invoice.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {invoice.status === "paid" ? "LUNAS" : "BELUM DIBAYAR"}
              </span>
            </div>
          </div>

          {/* Patient + Date */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Pasien</p>
              <p className="font-semibold text-slate-800">{invoice.patientName}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {invoice.patientId.slice(0, 8)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Tanggal</p>
              <p className="font-semibold text-slate-800">{formatDate(invoiceDate, "dd MMMM yyyy")}</p>
              {invoice.therapistName && (
                <p className="text-xs text-gray-500 mt-0.5">Terapis: {invoice.therapistName}</p>
              )}
            </div>
          </div>

          {/* Service row */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Detail Layanan</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-[#1a2744] text-white grid grid-cols-12 px-4 py-2.5">
                <span className="col-span-7 text-xs font-semibold">Layanan</span>
                <span className="col-span-2 text-center text-xs font-semibold">Qty</span>
                <span className="col-span-3 text-right text-xs font-semibold">Harga</span>
              </div>
              <div className="grid grid-cols-12 px-4 py-3">
                <span className="col-span-7 text-sm text-slate-800">{invoice.serviceName}</span>
                <span className="col-span-2 text-center text-sm text-gray-500">1</span>
                <span className="col-span-3 text-right text-sm font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 mb-4">
            {invoice.subtotal !== invoice.total && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon</span>
                <span>- {formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between bg-[#1a2744] text-white rounded-xl px-4 py-3">
              <span className="font-semibold">TOTAL</span>
              <span className="text-xl font-bold">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          {invoice.status === "paid" && invoice.paymentMethod && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">Pembayaran</p>
              <p className="text-sm text-green-800">
                {PAYMENT_METHOD_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod}
                {paidAtDate && ` · ${formatDate(paidAtDate, "dd MMM yyyy HH:mm")}`}
              </p>
              {invoice.paymentNotes && (
                <p className="text-xs text-green-600 mt-0.5">{invoice.paymentNotes}</p>
              )}
            </div>
          )}

          {/* Bank info if unpaid */}
          {invoice.status !== "paid" && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide mb-2">Informasi Pembayaran</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>BCA · <span className="font-mono font-bold">1234567890</span> a.n. Prime Wellness Therapy</p>
                <p>Mandiri · <span className="font-mono font-bold">0987654321</span> a.n. Prime Wellness Therapy</p>
                <p className="text-xs text-blue-600 mt-1">Konfirmasi bukti transfer ke front office setelah pembayaran.</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t border-dashed border-gray-200">
            <p className="text-xs text-gray-400">Terima kasih telah mempercayakan kesehatan Anda kepada kami</p>
            <p className="text-xs text-gray-300 mt-0.5">{CLINIC_INFO.address} · WA {CLINIC_INFO.phone} · Dokumen ini sah tanpa tanda tangan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
