"use client";

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";
import { FIRESTORE_COLLECTIONS } from "@/lib/constants";
import type {
  Appointment,
  MedicalRecord,
  Invoice,
  Payment,
  Service,
  Doctor,
  Patient,
  Testimonial,
  FAQ,
  ClinicSettings,
  Commission,
  Branch,
  SopAcknowledgment,
  KpiScore,
  KpiGrade,
  AuditLog,
  AuditAction,
} from "@/types";
import { DEFAULT_COMMISSION_RATE } from "@/lib/constants";
import {
  generateBookingNumber,
  generateInvoiceNumber,
} from "@/lib/utils";

// ==================== SERVICES ====================
export async function getServices(activeOnly = true) {
  const q = query(collection(db, FIRESTORE_COLLECTIONS.services), orderBy("name"));
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Service[];
  return activeOnly ? all.filter((s) => s.status === "active") : all;
}

export async function getService(id: string) {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.services, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Service;
}

export async function createService(data: Omit<Service, "id" | "createdAt" | "updatedAt">) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.services), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateService(id: string, data: Partial<Service>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.services, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteService(id: string) {
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.services, id));
}

// ==================== SOP ACKNOWLEDGMENTS ====================
export async function acknowledgeSop(data: Omit<SopAcknowledgment, "id">) {
  // Upsert: one acknowledgment per user per SOP
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.sopAcknowledgments),
    where("sopId", "==", data.sopId),
    where("userId", "==", data.userId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return; // already acknowledged
  await addDoc(collection(db, FIRESTORE_COLLECTIONS.sopAcknowledgments), {
    ...data,
    acknowledgedAt: serverTimestamp(),
  });
}

export async function getSopAcknowledgmentsByUser(userId: string): Promise<SopAcknowledgment[]> {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.sopAcknowledgments),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SopAcknowledgment));
}

export async function getAllSopAcknowledgments(): Promise<SopAcknowledgment[]> {
  const snap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.sopAcknowledgments));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SopAcknowledgment));
}

// ==================== KPI CALCULATION ====================
function gradeFromScore(score: number): KpiGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

export async function calculateKpi(year: number, month: number): Promise<KpiScore[]> {
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);
  const period = `${year}-${String(month).padStart(2, "0")}`;

  // Load all active staff
  const usersSnap = await getDocs(
    query(collection(db, FIRESTORE_COLLECTIONS.users),
      where("isActive", "==", true))
  );
  const staffRoles = ["therapist", "front_office", "manager", "super_admin"];
  const staff = usersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as { id: string; displayName: string; role: string; email: string }))
    .filter((u) => staffRoles.includes(u.role));

  if (staff.length === 0) return [];

  // Load attendance for the period
  const attendanceSnap = await getDocs(
    query(collection(db, FIRESTORE_COLLECTIONS.attendance),
      where("date", ">=", Timestamp.fromDate(periodStart)),
      where("date", "<=", Timestamp.fromDate(periodEnd)))
  );
  const attendanceAll = attendanceSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string; employeeId: string; status: string; date: Timestamp;
  }>;

  // Load completed/cancelled appointments for therapists
  const apptSnap = await getDocs(
    query(collection(db, FIRESTORE_COLLECTIONS.appointments),
      where("date", ">=", Timestamp.fromDate(periodStart)),
      where("date", "<=", Timestamp.fromDate(periodEnd)))
  );
  const appointments = apptSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string; doctorId: string; status: string;
  }>;

  // Load all SOPs
  const sopSnap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.sop));
  const allSops = sopSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
    id: string; targetRole: string[];
  }>;

  // Load all SOP acknowledgments
  const ackSnap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.sopAcknowledgments));
  const allAcks = ackSnap.docs.map((d) => d.data()) as Array<{ userId: string; sopId: string }>;

  // Working days in period (Mon-Sat)
  let workingDays = 0;
  const cur = new Date(periodStart);
  while (cur <= periodEnd) {
    const day = cur.getDay();
    if (day !== 0) workingDays++; // exclude Sunday
    cur.setDate(cur.getDate() + 1);
  }
  // Cap to today if current month
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const effectiveDays = isCurrentMonth
    ? Math.max(1, Math.round(workingDays * (now.getDate() / periodEnd.getDate())))
    : workingDays;

  return staff.map((user) => {
    const userAtt = attendanceAll.filter((a) => a.employeeId === user.id);
    const presentDays = userAtt.filter((a) => a.status === "present").length;
    const lateDays = userAtt.filter((a) => a.status === "late").length;
    const absentDays = userAtt.filter((a) => a.status === "absent").length;
    const leaveDays = userAtt.filter((a) => a.status === "leave").length;

    // Therapist sessions
    const userAppts = appointments.filter((a) => a.doctorId === user.id);
    const completedSessions = userAppts.filter((a) => a.status === "completed").length;
    const cancelledSessions = userAppts.filter((a) => a.status === "cancelled").length;
    const totalSessions = completedSessions + cancelledSessions +
      userAppts.filter((a) => !["completed", "cancelled"].includes(a.status)).length;

    // SOP relevant to this role
    const roleSops = allSops.filter((s) =>
      s.targetRole?.includes(user.role) || s.targetRole?.includes("all" as string)
    );
    const userAcks = allAcks.filter((a) => a.userId === user.id);
    const acknowledgedSops = roleSops.filter((s) =>
      userAcks.some((a) => a.sopId === s.id)
    ).length;

    // ── Score calculation ──────────────────────────────────────────────
    // 1. Attendance (30%) — present + 0.5*late / effectiveDays
    const denomAtt = Math.max(effectiveDays, 1);
    const attendanceScore = Math.min(100,
      Math.round(((presentDays + lateDays * 0.5) / denomAtt) * 100)
    );

    // 2. Session score (35%)
    // For therapists: completion rate. For others: based on attendance quality.
    let sessionScore = 0;
    if (user.role === "therapist") {
      if (totalSessions === 0) {
        sessionScore = attendanceScore; // no sessions yet, mirror attendance
      } else {
        const completionRate = completedSessions / Math.max(totalSessions, 1);
        sessionScore = Math.min(100, Math.round(completionRate * 100));
      }
    } else {
      // Non-therapist: based on full attendance (present + on-time)
      sessionScore = Math.min(100, Math.round((presentDays / denomAtt) * 100));
    }

    // 3. SOP compliance (20%)
    const sopScore = roleSops.length === 0
      ? 100
      : Math.round((acknowledgedSops / roleSops.length) * 100);

    // 4. Punctuality (15%) — penalize late days
    const punctualityScore = presentDays + lateDays === 0
      ? 0
      : Math.min(100, Math.round(
        (presentDays / Math.max(presentDays + lateDays, 1)) * 100
      ));

    const totalScore = Math.round(
      attendanceScore * 0.30 +
      sessionScore * 0.35 +
      sopScore * 0.20 +
      punctualityScore * 0.15
    );

    return {
      userId: user.id,
      userName: user.displayName || user.email || user.id,
      role: user.role as KpiScore["role"],
      period,
      totalWorkingDays: effectiveDays,
      presentDays,
      lateDays,
      absentDays,
      leaveDays,
      totalSessions,
      completedSessions,
      cancelledSessions,
      totalSops: roleSops.length,
      acknowledgedSops,
      attendanceScore,
      sessionScore,
      sopScore,
      punctualityScore,
      totalScore,
      grade: gradeFromScore(totalScore),
    };
  });
}

// ==================== BRANCHES ====================
export async function getBranches(activeOnly = false) {
  const constraints: QueryConstraint[] = activeOnly
    ? [where("status", "==", "active"), orderBy("name")]
    : [orderBy("name")];
  const q = query(collection(db, FIRESTORE_COLLECTIONS.branches), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Branch));
}

export async function createBranch(data: Omit<Branch, "id" | "createdAt" | "updatedAt">) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.branches), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBranch(id: string, data: Partial<Branch>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.branches, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBranch(id: string) {
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.branches, id));
}

// ==================== ACTIVITY LOG ====================
export async function logActivity(entry: Omit<AuditLog, "id" | "createdAt">) {
  try {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.auditLogs), {
      ...entry,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-blocking — never throw */ }
}

export async function getActivityLogs({
  limitCount = 100,
  userId,
  action,
  resource,
  fromDate,
  toDate,
}: {
  limitCount?: number;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  fromDate?: Date;
  toDate?: Date;
} = {}): Promise<AuditLog[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (userId) constraints.push(where("userId", "==", userId));
  if (action) constraints.push(where("action", "==", action));
  if (resource) constraints.push(where("resource", "==", resource));
  if (fromDate) constraints.push(where("createdAt", ">=", Timestamp.fromDate(fromDate)));
  if (toDate) constraints.push(where("createdAt", "<=", Timestamp.fromDate(toDate)));
  constraints.push(limit(limitCount));
  const snap = await getDocs(query(collection(db, FIRESTORE_COLLECTIONS.auditLogs), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
}

// ==================== DOCTORS ====================
export async function getDoctors(activeOnly = true) {
  const constraints: QueryConstraint[] = activeOnly
    ? [where("isActive", "==", true), orderBy("fullName")]
    : [orderBy("fullName")];
  const q = query(collection(db, FIRESTORE_COLLECTIONS.doctors), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Doctor[];
}

export async function getDoctor(id: string) {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.doctors, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Doctor;
}

export async function createDoctor(data: Omit<Doctor, "id" | "createdAt" | "updatedAt">) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.doctors), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDoctor(id: string, data: Partial<Doctor>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.doctors, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== PATIENTS ====================
export async function getPatients() {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.patients),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Patient[];
}

export async function getPatient(id: string) {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.patients, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Patient;
}

export async function createPatient(data: Omit<Patient, "id" | "createdAt" | "updatedAt" | "patientNumber">) {
  const patientNumber = `PW-${Date.now().toString().slice(-6)}`;
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.patients), {
    ...data,
    patientNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, patientNumber };
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.patients, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== APPOINTMENTS ====================
export async function getAppointments(constraints?: QueryConstraint[]) {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.appointments),
    ...(constraints || [orderBy("date", "desc")])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[];
}

export async function getAppointmentsByPatient(patientId: string) {
  return getAppointments([
    where("patientId", "==", patientId),
    orderBy("date", "desc"),
  ]);
}

export async function getAppointmentsByDoctor(doctorId: string) {
  return getAppointments([
    where("doctorId", "==", doctorId),
    orderBy("date", "desc"),
  ]);
}

export async function getAppointmentsByDate(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return getAppointments([
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<=", Timestamp.fromDate(end)),
    orderBy("date", "asc"),
  ]);
}

export async function getAppointment(id: string) {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.appointments, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Appointment;
}

// Helper: push a notification document (fire-and-forget)
async function pushNotification(params: {
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  targetRoles: string[];
  targetUserId?: string;
  link?: string;
}) {
  try {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.notifications), {
      ...params,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-blocking */ }
}

export async function createAppointment(
  data: Omit<Appointment, "id" | "bookingNumber" | "createdAt" | "updatedAt">,
  actor?: { userId: string; userName: string; userRole: string }
) {
  const bookingNumber = generateBookingNumber();
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.appointments), {
    ...data,
    bookingNumber,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Auto-notify front office
  pushNotification({
    title: "Booking Baru",
    message: `${data.patientName} booking ${data.serviceName} pada ${bookingNumber}`,
    type: "info",
    targetRoles: ["front_office", "manager", "admin"],
    link: "/admin/appointments",
  });
  if (actor) {
    logActivity({
      userId: actor.userId, userName: actor.userName, userRole: actor.userRole as import("@/types").UserRole,
      action: "create_appointment", resource: "appointments", resourceId: docRef.id,
      resourceLabel: `Booking ${bookingNumber} — ${data.patientName}`,
    });
  }
  return { id: docRef.id, bookingNumber };
}

export async function updateAppointmentGoogleEventId(id: string, googleEventId: string) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.appointments, id), {
    googleEventId,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"],
  actor?: { userId: string; userName: string; userRole: string; patientName?: string; bookingNumber?: string }
) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.appointments, id), {
    status,
    updatedAt: serverTimestamp(),
  });
  if (actor) {
    const actionMap: Record<string, string> = {
      confirmed: "confirm_appointment",
      cancelled: "cancel_appointment",
      completed: "complete_appointment",
      checked_in: "checkin_appointment",
    };
    logActivity({
      userId: actor.userId, userName: actor.userName, userRole: actor.userRole as import("@/types").UserRole,
      action: (actionMap[status] ?? "update_appointment") as AuditAction,
      resource: "appointments", resourceId: id,
      resourceLabel: `Booking ${actor.bookingNumber ?? id} — ${actor.patientName ?? ""}`,
    });
    if (status === "confirmed") {
      pushNotification({
        title: "Booking Dikonfirmasi",
        message: `Booking ${actor.bookingNumber} untuk ${actor.patientName} telah dikonfirmasi`,
        type: "success", targetRoles: ["manager"], link: "/admin/appointments",
      });
    }
    if (status === "cancelled") {
      pushNotification({
        title: "Booking Dibatalkan",
        message: `Booking ${actor.bookingNumber} — ${actor.patientName} dibatalkan`,
        type: "warning", targetRoles: ["manager", "front_office"], link: "/admin/appointments",
      });
    }
  }
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.appointments, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== MEDICAL RECORDS ====================
export async function getMedicalRecords(patientId?: string) {
  const constraints: QueryConstraint[] = patientId
    ? [where("patientId", "==", patientId), orderBy("visitDate", "desc")]
    : [orderBy("visitDate", "desc")];
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.medicalRecords),
    ...constraints
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as MedicalRecord[];
}

export async function createMedicalRecord(
  data: Omit<MedicalRecord, "id" | "createdAt" | "updatedAt">
) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.medicalRecords), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMedicalRecord(id: string, data: Partial<MedicalRecord>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.medicalRecords, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== INVOICES ====================
export async function getInvoices(patientId?: string) {
  const constraints: QueryConstraint[] = patientId
    ? [where("patientId", "==", patientId), orderBy("date", "desc")]
    : [orderBy("date", "desc")];
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.invoices),
    ...constraints
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Invoice[];
}

export async function getInvoice(id: string) {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.invoices, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Invoice;
}

export async function createInvoice(
  data: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">,
  actor?: { userId: string; userName: string; userRole: string }
) {
  const invoiceNumber = generateInvoiceNumber();
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.invoices), {
    ...data,
    invoiceNumber,
    status: "unpaid",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (actor) {
    logActivity({
      userId: actor.userId, userName: actor.userName, userRole: actor.userRole as import("@/types").UserRole,
      action: "create_invoice", resource: "invoices", resourceId: docRef.id,
      resourceLabel: `Invoice ${invoiceNumber} — ${data.patientName}`,
    });
  }
  return { id: docRef.id, invoiceNumber };
}

export async function updateInvoiceStatus(
  id: string,
  status: Invoice["status"],
  actor?: { userId: string; userName: string; userRole: string; patientName?: string; invoiceNumber?: string; total?: number }
) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.invoices, id), {
    status,
    updatedAt: serverTimestamp(),
  });
  if (actor && status === "paid") {
    logActivity({
      userId: actor.userId, userName: actor.userName, userRole: actor.userRole as import("@/types").UserRole,
      action: "confirm_payment", resource: "invoices", resourceId: id,
      resourceLabel: `Pembayaran ${actor.invoiceNumber ?? id} — ${actor.patientName ?? ""}`,
    });
    pushNotification({
      title: "Pembayaran Diterima",
      message: `Invoice ${actor.invoiceNumber} — ${actor.patientName} sudah lunas`,
      type: "success", targetRoles: ["manager", "owner", "super_admin"], link: "/admin/invoices",
    });
  }
}

// ==================== PAYMENTS ====================
export async function createPayment(
  data: Omit<Payment, "id" | "createdAt">,
  actor?: { userId: string; userName: string; userRole: string }
) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.payments), {
    ...data,
    createdAt: serverTimestamp(),
  });
  await updateInvoiceStatus(data.invoiceId, "paid", actor ? { ...actor } : undefined);
  return docRef.id;
}

// ==================== TESTIMONIALS ====================
export async function getTestimonials(publishedOnly = true) {
  const constraints: QueryConstraint[] = publishedOnly
    ? [where("isPublished", "==", true), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.testimonials),
    ...constraints
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Testimonial[];
}

export async function createTestimonial(
  data: Omit<Testimonial, "id" | "createdAt">
) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.testimonials), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTestimonial(id: string, data: Partial<Testimonial>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.testimonials, id), data);
}

export async function deleteTestimonial(id: string) {
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.testimonials, id));
}

// ==================== FAQ ====================
export async function getFAQs(publishedOnly = true) {
  const constraints: QueryConstraint[] = publishedOnly
    ? [where("isPublished", "==", true), orderBy("order")]
    : [orderBy("order")];
  const q = query(collection(db, FIRESTORE_COLLECTIONS.faq), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as FAQ[];
}

export async function createFAQ(data: Omit<FAQ, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.faq), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFAQ(id: string, data: Partial<FAQ>) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.faq, id), data);
}

export async function deleteFAQ(id: string) {
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.faq, id));
}

// ==================== SETTINGS ====================
export async function getClinicSettings(): Promise<ClinicSettings | null> {
  const docRef = doc(db, FIRESTORE_COLLECTIONS.settings, "clinic");
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as ClinicSettings;
}

export async function updateClinicSettings(data: Partial<ClinicSettings>) {
  await setDoc(
    doc(db, FIRESTORE_COLLECTIONS.settings, "clinic"),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ==================== STATS ====================
export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [patientsSnap, todayAppsSnap, invoicesSnap] = await Promise.all([
    getDocs(collection(db, FIRESTORE_COLLECTIONS.patients)),
    getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.appointments),
        where("date", ">=", Timestamp.fromDate(today)),
        where("date", "<=", Timestamp.fromDate(todayEnd))
      )
    ),
    getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.invoices),
        where("date", ">=", Timestamp.fromDate(today)),
        where("status", "==", "paid")
      )
    ),
  ]);

  const todayRevenue = invoicesSnap.docs.reduce(
    (sum, d) => sum + (d.data().total || 0),
    0
  );

  return {
    totalPatients: patientsSnap.size,
    todayAppointments: todayAppsSnap.size,
    todayRevenue,
  };
}

// ==================== COMMISSIONS ====================

/** Get all commissions, optionally filtered by therapist */
export async function getCommissions(therapistId?: string) {
  const constraints: QueryConstraint[] = therapistId
    ? [where("therapistId", "==", therapistId), orderBy("sessionDate", "desc")]
    : [orderBy("sessionDate", "desc")];
  const snap = await getDocs(
    query(collection(db, FIRESTORE_COLLECTIONS.commissions), ...constraints)
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    sessionDate: d.data().sessionDate?.toDate?.() ?? new Date(),
    createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
  })) as Commission[];
}

/**
 * Called automatically when an appointment is marked "completed".
 * Creates a commission record based on service price × rate.
 */
export async function createCommission(data: {
  therapistId: string;
  therapistName: string;
  appointmentId: string;
  patientName: string;
  serviceName: string;
  servicePrice: number;
  sessionDate: Date;
}) {
  // Get therapist-specific rate, fallback to clinic setting, fallback to default
  const therapistSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.doctors, data.therapistId));
  const therapistRate: number = therapistSnap.exists()
    ? (therapistSnap.data().commissionRate ?? null)
    : null;

  let rate = therapistRate;
  if (rate === null) {
    const settingsSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.settings, "clinic"));
    rate = settingsSnap.exists()
      ? (settingsSnap.data().commissionRate ?? DEFAULT_COMMISSION_RATE)
      : DEFAULT_COMMISSION_RATE;
  }

  const amount = Math.round(data.servicePrice * rate / 100);

  return addDoc(collection(db, FIRESTORE_COLLECTIONS.commissions), {
    therapistId: data.therapistId,
    therapistName: data.therapistName,
    appointmentId: data.appointmentId,
    patientName: data.patientName,
    serviceName: data.serviceName,
    servicePrice: data.servicePrice,
    commissionRate: rate,
    commissionAmount: amount,
    sessionDate: Timestamp.fromDate(data.sessionDate),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/** Mark commissions as paid (batch by therapist) */
export async function markCommissionsPaid(
  commissionIds: string[],
  paidBy: string,
  actor?: { userId: string; userName: string; userRole: string }
) {
  for (const id of commissionIds) {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.commissions, id), {
      status: "paid",
      paidAt: serverTimestamp(),
      paidBy,
    });
  }
  if (actor) {
    logActivity({
      userId: actor.userId, userName: actor.userName, userRole: actor.userRole as import("@/types").UserRole,
      action: "pay_commission", resource: "commissions",
      resourceLabel: `Pembayaran komisi ${commissionIds.length} sesi oleh ${paidBy}`,
    });
  }
  pushNotification({
    title: "Komisi Dibayarkan",
    message: `${commissionIds.length} komisi terapis telah dibayarkan oleh ${paidBy}`,
    type: "success", targetRoles: ["therapist", "doctor"], link: "/doctor/commissions",
  });
}

/** Get clinic-level commission rate (with fallback) */
export async function getCommissionRate(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.settings, "clinic"));
    return snap.exists() ? (snap.data().commissionRate ?? DEFAULT_COMMISSION_RATE) : DEFAULT_COMMISSION_RATE;
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
}

/** Update appointment to "completed" AND auto-create commission */
export async function completeAppointmentWithCommission(
  appointmentId: string,
  appointment: {
    doctorId: string;
    doctorName: string;
    patientName: string;
    serviceName: string;
    servicePrice: number;
    date: Date;
  }
) {
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.appointments, appointmentId), {
    status: "completed",
    updatedAt: serverTimestamp(),
  });
  await createCommission({
    therapistId: appointment.doctorId,
    therapistName: appointment.doctorName,
    appointmentId,
    patientName: appointment.patientName,
    serviceName: appointment.serviceName,
    servicePrice: appointment.servicePrice,
    sessionDate: appointment.date instanceof Date ? appointment.date : new Date(),
  });
}
