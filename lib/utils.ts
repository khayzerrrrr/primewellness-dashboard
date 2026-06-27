import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, fmt = "dd MMMM yyyy"): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, fmt, { locale: idLocale });
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateBookingNumber(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PW-${dateStr}-${rand}`;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${rand}`;
}

export function generateMedicalRecordNumber(): string {
  const date = new Date();
  const dateStr = format(date, "yyyyMMdd");
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MR-${dateStr}-${rand}`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

