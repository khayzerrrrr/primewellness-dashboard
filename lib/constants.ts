export const DEFAULT_COMMISSION_RATE = 15; // % default komisi terapis

// ── Clinic Contact Info ───────────────────────────────────────────────────────
export const CLINIC_INFO = {
  name: "Prime Wellness Therapy & Reliefy",
  address: "Jl. Wahidin No.207 Medan Seberang (WS Badminton)",
  city: "Medan, Sumatera Utara",
  phone: "082125555558",
  whatsapp: "6282125555558",
  email: "info@primewellness.id",
  mapsUrl: "https://maps.google.com/?q=Jl.+Wahidin+No.207+Medan+Seberang",
  mapsEmbed: "https://maps.google.com/maps?q=Jl.+Wahidin+No.207+Medan&output=embed",
  waUrl: (msg?: string) =>
    `https://wa.me/6282125555558${msg ? `?text=${encodeURIComponent(msg)}` : ""}`,
  instagram: "https://www.instagram.com/primewellness.id/",
} as const;

export const THERAPIST_SPECIALIZATIONS = [
  "Akupunktur Tanpa Jarum",
  "Pijat Refleksi",
  "Terapi Bekam (Cupping)",
  "Moxibustion",
  "Gua Sha",
  "Herbal TCM",
  "Pijat Shiatsu",
  "Pijat Tradisional Melayu",
  "Terapi Akupresur",
  "Pijat Bayi & Anak",
  "Terapi Prenatal (Ibu Hamil)",
  "Terapi Sport & Cedera",
  "Pijat Relaksasi",
  "Terapi Jaringan Dalam (Deep Tissue)",
  "Terapi Kaki (Foot Reflexology)",
] as const;

export const COLORS = {
  primary: "#0A1628",
  secondary: "#1B3A6B",
  accent: "#E65100",
  background: "#F8FAFC",
  text: "#0F172A",
} as const;

export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  patient: {
    dashboard: "/patient/dashboard",
    appointments: "/patient/appointments",
    medicalRecords: "/patient/medical-records",
    invoices: "/patient/invoices",
    vouchers: "/patient/vouchers",
    profile: "/patient/profile",
  },
  therapist: {
    dashboard: "/therapist/dashboard",
    schedule: "/therapist/schedule",
    patients: "/therapist/patients",
    medicalRecords: "/therapist/medical-records",
    attendance: "/therapist/attendance",
    profile: "/therapist/profile",
  },
  frontOffice: {
    dashboard: "/front-office/dashboard",
    register: "/front-office/register",
    booking: "/front-office/booking",
    payment: "/front-office/payment",
    invoices: "/front-office/invoices",
    vouchers: "/front-office/vouchers",
  },
  manager: {
    dashboard: "/manager/dashboard",
    patients: "/manager/patients",
    therapists: "/manager/therapists",
    appointments: "/manager/appointments",
    attendance: "/manager/attendance",
    services: "/manager/services",
    invoices: "/manager/invoices",
    reports: "/manager/reports",
    sop: "/manager/sop",
  },
  superAdmin: {
    dashboard: "/super-admin/dashboard",
    accounts: "/super-admin/accounts",
    settings: "/super-admin/settings",
    audit: "/super-admin/audit",
  },
  owner: {
    dashboard: "/owner/dashboard",
    accounts: "/owner/accounts",
    reports: "/owner/reports",
    settings: "/owner/settings",
  },
  booking: "/booking",
} as const;

export const ROLE_ROUTES: Record<string, string> = {
  owner: ROUTES.owner.dashboard,
  super_admin: ROUTES.owner.dashboard, // super_admin shares owner dashboard
  manager: ROUTES.manager.dashboard,
  front_office: ROUTES.frontOffice.dashboard,
  therapist: "/doctor/dashboard",
  // legacy
  admin: ROUTES.manager.dashboard,
  doctor: "/doctor/dashboard",
  patient: ROUTES.patient.dashboard,
};

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner / CEO",
  super_admin: "Super Admin",
  manager: "Manager",
  front_office: "Front Office",
  therapist: "Terapis",
  patient: "Pasien",
};

// Voucher packages — formula: discount% = sessions / 5 * 5
export const VOUCHER_PACKAGES = [
  {
    id: "pkg-5",
    name: "Paket 5 Sesi",
    sessions: 5,
    pricePerSession: 300000,
    discountPercent: 5,
    totalPrice: 1425000, // 1500000 * 0.95
    isActive: true,
  },
  {
    id: "pkg-10",
    name: "Paket 10 Sesi",
    sessions: 10,
    pricePerSession: 300000,
    discountPercent: 10,
    totalPrice: 2700000, // 3000000 * 0.90
    isActive: true,
  },
  {
    id: "pkg-15",
    name: "Paket 15 Sesi",
    sessions: 15,
    pricePerSession: 300000,
    discountPercent: 15,
    totalPrice: 3825000, // 4500000 * 0.85
    isActive: true,
  },
  {
    id: "pkg-20",
    name: "Paket 20 Sesi",
    sessions: 20,
    pricePerSession: 300000,
    discountPercent: 20,
    totalPrice: 4800000, // 6000000 * 0.80
    isActive: true,
  },
] as const;

export const DEFAULT_SERVICES = [
  { name: "Akupunktur Tanpa Jarum", description: "Stimulasi titik akupunktur menggunakan teknologi elektro-stimulasi tanpa rasa sakit", duration: 60, price: 300000 },
  { name: "Pijat Refleksi", description: "Pemijatan pada titik refleks telapak kaki dan tangan untuk melancarkan energi tubuh", duration: 60, price: 300000 },
  { name: "Terapi Cupping (Bekam)", description: "Teknik bekam modern untuk melancarkan sirkulasi darah dan mengurangi nyeri otot", duration: 45, price: 300000 },
  { name: "Herbal TCM", description: "Ramuan herbal tradisional Tiongkok yang diformulasikan khusus sesuai kondisi tubuh", duration: 30, price: 300000 },
  { name: "Moxibustion", description: "Terapi panas menggunakan tanaman mugwort untuk menghangatkan meridian dan menguatkan imun", duration: 45, price: 300000 },
  { name: "Gua Sha", description: "Teknik scraping pada kulit untuk membuang toksin dan meningkatkan sirkulasi limfatik", duration: 45, price: 300000 },
] as const;

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-purple-100 text-purple-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-blue-100 text-blue-800",
  void: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tunai (Kasir)",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  virtual_account: "Virtual Account",
};

export const DAYS_OF_WEEK = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
] as const;

export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
] as const;

export const FIRESTORE_COLLECTIONS = {
  users: "users",
  patients: "patients",
  doctors: "doctors",       // kept for compatibility, = therapists
  therapists: "doctors",
  appointments: "appointments",
  medicalRecords: "medical_records",
  services: "services",
  invoices: "invoices",
  payments: "payments",
  testimonials: "testimonials",
  faq: "faq",
  settings: "settings",
  notifications: "notifications",
  auditLogs: "audit_logs",
  vouchers: "vouchers",          // patient vouchers
  attendance: "attendance",      // employee attendance
  sop: "sop",                    // SOP documents
  commissions: "commissions",    // therapist commission records
  branches: "branches",          // clinic branches
  sopAcknowledgments: "sop_acknowledgments", // SOP read acknowledgments
} as const;

export const BANK_ACCOUNTS = [
  { bank: "BCA", accountNumber: "1234567890", accountName: "Prime Wellness Therapy" },
  { bank: "Mandiri", accountNumber: "0987654321", accountName: "Prime Wellness Therapy" },
  { bank: "BNI", accountNumber: "1122334455", accountName: "Prime Wellness Therapy" },
] as const;
