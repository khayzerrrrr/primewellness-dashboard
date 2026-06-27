"use client";

import { useEffect, useState } from "react";
import { Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoicePrint } from "@/components/invoice/InvoicePrint";
import { useAuth } from "@/contexts/AuthContext";
import { getInvoices } from "@/lib/firebase/firestore-service";
import { formatDate, formatCurrency } from "@/lib/utils";
import { INVOICE_STATUS_COLORS } from "@/lib/constants";
import type { Invoice } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Belum Bayar",
  paid: "Lunas",
  refunded: "Dikembalikan",
  void: "Batal",
};

export default function PatientInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getInvoices(user.uid)
      .then((data) => { setInvoices(data as Invoice[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.uid]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a2744]">Invoice Saya</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada invoice</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 font-mono text-sm">{inv.invoiceNumber}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${INVOICE_STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{inv.serviceName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {typeof inv.date === "object" && "toDate" in inv.date
                        ? formatDate((inv.date as { toDate(): Date }).toDate())
                        : formatDate(inv.date as Date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(inv.total)}</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setPrintInvoice(inv)}>
                      <Printer className="w-4 h-4" />
                      Cetak
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {printInvoice && <InvoicePrint invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}
    </div>
  );
}
