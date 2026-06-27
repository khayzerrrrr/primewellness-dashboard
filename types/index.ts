export type UserRole = "owner" | "super_admin" | "manager" | "front_office" | "therapist" | "patient";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type InvoiceStatus = "unpaid" | "paid" | "refunded" | "void" | "cancelled";

export type PaymentMethod = "cash" | "bank_transfer" | "qris" | "virtual_account";

export type PaymentStatus = "pending" | "confirmed" | "rejected";

export type ServiceStatus = "active" | "inactive";

export type VoucherStatus = "active" | "expired" | "depleted";

export type AttendanceStatus = "present" | "late" | "absent" | "leave";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface Patient {
  id: string;
  userId?: string;
  patientNumber?: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date | null;
  gender: "male" | "female";
  address?: string;
  bloodType?: string;
  allergies?: string[];
  medicalRecordNumber?: string;
  mainComplaint?: string;
  referralSource?: string;
  registeredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Therapist (was Doctor)
export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  specialization: string;        // primary display
  specializations: string[];     // multi-select skill list
  certificationNumber?: string;  // nomor sertifikat / izin praktik
  photoURL?: string;
  bio?: string;
  schedule: DoctorSchedule[];
  isActive: boolean;
  commissionRate?: number;       // override rate, fallback to clinic default
  createdAt: Date;
  updatedAt: Date;
}

// Commission record — created each time a session is completed
export interface Commission {
  id: string;
  therapistId: string;
  therapistName: string;
  appointmentId: string;
  patientName: string;
  serviceName: string;
  servicePrice: number;
  commissionRate: number;        // snapshot of rate at time of session
  commissionAmount: number;      // servicePrice * commissionRate / 100
  sessionDate: Date;
  status: "pending" | "paid";   // pending = belum dibayarkan ke terapis
  paidAt?: Date;
  paidBy?: string;
  createdAt: Date;
}

export interface DoctorSchedule {
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  quota: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  thumbnailURL?: string;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  bookingNumber: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  serviceDuration?: number;
  date: Date;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  voucherId?: string;
  voucherSessionUsed?: boolean;
  googleEventId?: string;
  startedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  therapistId: string;
  appointmentId: string;
  visitDate: Date;
  chiefComplaint: string;
  painScale?: number; // 1-10
  bloodPressure?: string;
  weight?: number;
  height?: number;
  diagnosis: string;
  treatment: string;
  therapyNotes?: string;
  prescription?: string;
  progressScore?: number; // 1-10
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  serviceId: string;
  serviceName: string;
  date: Date;
  subtotal: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentProofURL?: string;
  paymentNotes?: string;
  paidAt?: Date;
  confirmedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  status: PaymentStatus;
  proofURL?: string;
  reference?: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  notes?: string;
  createdAt: Date;
}

// Voucher / Package
export interface VoucherPackage {
  id: string;
  name: string;
  sessions: number;
  pricePerSession: number;
  discountPercent: number;
  totalPrice: number;
  isActive: boolean;
}

export interface PatientVoucher {
  id: string;
  patientId: string;
  patientName: string;
  packageId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  purchasePrice: number;
  status: VoucherStatus;
  expiryDate: Date;
  purchasedAt: Date;
  invoiceId?: string;
}

// Employee Attendance
export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
}

// SOP
export interface SOP {
  id: string;
  title: string;
  category: string;
  targetRole: UserRole[];
  content: string;
  version: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial {
  id: string;
  patientId: string;
  patientName: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  address: string;
  radiusMeters: number;
  lateAfterMinutes: number; // minutes after open time to mark "late"
}

export interface ClinicSettings {
  id: string;
  clinicName: string;
  logoURL?: string;
  faviconURL?: string;
  address: string;
  email: string;
  whatsapp: string;
  operationalHours: OperationalHours[];
  socialMedia: SocialMedia;
  defaultLanguage: string;
  commissionRate: number;
  bankAccounts?: BankAccount[];
  attendanceLocation?: AttendanceLocation;
  updatedAt: Date;
}

export interface OperationalHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "booking_created" | "booking_confirmed" | "reminder" | "invoice" | "payment_confirmed" | "voucher_purchased";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  picName: string;   // Person In Charge
  picPhone?: string;
  status: "active" | "inactive";
  openDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SopAcknowledgment {
  id: string;
  sopId: string;
  sopTitle: string;
  userId: string;
  userName: string;
  acknowledgedAt: Date;
}

export type KpiGrade = "A" | "B" | "C" | "D" | "E";

export interface KpiScore {
  userId: string;
  userName: string;
  role: UserRole;
  period: string; // "2026-06"
  // Raw counts
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  // Therapist only
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  // SOP
  totalSops: number;
  acknowledgedSops: number;
  // Computed scores (0-100)
  attendanceScore: number;    // 30%
  sessionScore: number;       // 35%
  sopScore: number;           // 20%
  punctualityScore: number;   // 15%
  totalScore: number;         // weighted sum
  grade: KpiGrade;
}

export type AuditAction =
  | "login" | "logout"
  | "create_appointment" | "update_appointment" | "cancel_appointment" | "complete_appointment"
  | "create_invoice" | "update_invoice" | "confirm_payment"
  | "create_patient" | "update_patient"
  | "create_service" | "update_service" | "delete_service"
  | "create_sop" | "update_sop" | "delete_sop" | "acknowledge_sop"
  | "mark_attendance" | "update_attendance"
  | "pay_commission" | "create_commission"
  | "create_branch" | "update_branch" | "delete_branch"
  | "create_account" | "update_account" | "deactivate_account"
  | "update_settings"
  | "other";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  resource: string;       // e.g. "appointment", "invoice", "sop"
  resourceId?: string;
  resourceLabel?: string; // human-readable, e.g. "Booking #BK-2026001"
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
