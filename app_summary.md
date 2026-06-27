# PRIME WELLNESS SAAS MVP - STAGING READY
# MASTER PROMPT V1.0

ANDA ADALAH:

- Senior SaaS Architect
- Senior Product Manager
- Senior UI/UX Designer
- Senior Full Stack Engineer
- Senior Firebase Engineer
- Senior DevOps Engineer
- Senior QA Engineer

TUGAS ANDA:

Membangun aplikasi SaaS Klinik Prime Wellness yang production-ready, mobile-first, scalable, clean architecture, dan siap di-deploy ke staging environment.

JANGAN membuat prototype.
JANGAN membuat mockup statis.
JANGAN membuat demo palsu.

Bangun aplikasi yang benar-benar berfungsi dan siap dijalankan.

==================================================
INFORMASI BISNIS
==================================================

Nama Sistem:
Prime Wellness

Jenis:
SaaS Clinic Management System

Target:
- Klinik
- Wellness Center
- Praktik Dokter
- Klinik Keluarga

Bahasa Default:
Bahasa Indonesia

Bahasa Tambahan:
- English
- Hokkien

Seluruh sistem harus mendukung multi-language.

Semua teks wajib menggunakan translation files.

Dilarang hardcode text pada halaman.

==================================================
TUJUAN MVP
==================================================

Bangun MVP yang dapat langsung digunakan operasional klinik.

Fokus hanya pada fitur yang benar-benar dibutuhkan.

Jangan menambahkan fitur enterprise yang belum diperlukan.

Target MVP:

1. Landing Page
2. Registrasi Pasien
3. Login
4. Dashboard Pasien
5. Dashboard Dokter
6. Dashboard Admin
7. Booking Online
8. Jadwal Dokter
9. Rekam Medis Dasar
10. Invoice
11. Pembayaran
12. WhatsApp Notification
13. Multi Language
14. Settings Klinik

==================================================
TECH STACK
==================================================

Frontend:
- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN UI

Backend:
- Firebase

Database:
- Firestore

Authentication:
- Firebase Auth

Storage:
- Firebase Storage

Deployment:
- Vercel

Version Control:
- Git

Architecture:
- Modular Architecture
- Clean Code
- Reusable Components
- Service Layer Pattern

==================================================
BRANDING
==================================================

Brand:
Prime Wellness

Tagline:
Your Trusted Wellness Partner

Primary Color:
#0F766E

Secondary Color:
#14B8A6

Accent:
#22C55E

Background:
#FFFFFF

Text:
#0F172A

Design Style:
- Premium
- Clean
- Medical
- Modern
- Trustworthy
- Elegant

==================================================
ROLE SYSTEM
==================================================

Role:

1. Owner
2. Admin
3. Doctor
4. Patient

Implementasikan RBAC penuh.

Setiap role hanya dapat mengakses menu sesuai hak akses.

==================================================
LANDING PAGE
==================================================

Buat landing page premium modern.

SECTION:

1. Hero Section

Headline:
Prime Wellness

Subheadline:
Klinik kesehatan modern untuk keluarga Anda.

CTA:
- Booking Sekarang
- Daftar Sekarang

2. Services

Layanan:

- Konsultasi Dokter
- Medical Check Up
- Pemeriksaan Umum
- Infus Vitamin
- Terapi Kesehatan

3. Doctors

Menampilkan:

- Foto
- Nama
- Spesialisasi

Data berasal dari database.

4. Why Choose Us

- Dokter Berpengalaman
- Booking Online
- Rekam Medis Digital
- Pelayanan Cepat
- Klinik Modern

5. Testimonials

Dynamic dari database.

6. FAQ

Dynamic dari database.

7. Contact

- Google Maps
- Alamat
- WhatsApp
- Email
- Jam Operasional

8. Footer

- Company Information
- Privacy Policy
- Terms
- Social Media

==================================================
AUTHENTICATION
==================================================

Fitur:

- Login
- Register
- Forgot Password
- Remember Me
- Logout

Gunakan Firebase Authentication.

Role tersimpan dalam Firestore.

==================================================
REGISTRASI PASIEN
==================================================

Field:

- Nama Lengkap
- Nomor HP
- Email
- Tanggal Lahir
- Jenis Kelamin
- Alamat
- Password
- Konfirmasi Password

Validasi lengkap.

==================================================
PATIENT DASHBOARD
==================================================

Menu:

- Dashboard
- Appointment Saya
- Rekam Medis
- Invoice
- Profile

Widget:

- Appointment Mendatang
- Riwayat Kunjungan
- Tagihan Terakhir

Pasien dapat:

- Booking Online
- Lihat Riwayat
- Lihat Invoice
- Update Profil

==================================================
DOCTOR DASHBOARD
==================================================

Menu:

- Dashboard
- Jadwal Hari Ini
- Pasien Hari Ini
- Rekam Medis
- Profile

Dokter dapat:

- Melihat pasien
- Mengisi rekam medis
- Melihat riwayat pasien

==================================================
ADMIN DASHBOARD
==================================================

Menu:

- Dashboard
- Patients
- Doctors
- Appointments
- Medical Records
- Invoices
- Services
- Testimonials
- FAQ
- Settings

Widget Dashboard:

- Total Pasien
- Pasien Hari Ini
- Booking Hari Ini
- Pendapatan Hari Ini
- Pendapatan Bulan Ini

==================================================
BOOKING SYSTEM
==================================================

Guest maupun Patient dapat:

- Memilih layanan
- Memilih dokter
- Memilih tanggal
- Memilih jam

Generate nomor booking otomatis.

Format:

PW-YYYYMMDD-XXXX

Status:

- Pending
- Confirmed
- Checked In
- Completed
- Cancelled
- No Show

Admin dapat:

- Konfirmasi
- Reschedule
- Cancel

==================================================
JADWAL DOKTER
==================================================

Dokter memiliki:

- Hari Praktik
- Jam Mulai
- Jam Selesai
- Kuota Harian

Booking hanya tersedia pada slot kosong.

==================================================
REKAM MEDIS
==================================================

Field:

- Tanggal Kunjungan
- Keluhan Utama
- Tekanan Darah
- Berat Badan
- Tinggi Badan
- Diagnosa
- Tindakan
- Resep
- Catatan Dokter

Timestamp otomatis.

Riwayat kunjungan tersimpan permanen.

==================================================
LAYANAN
==================================================

CRUD Service

Field:

- Nama Layanan
- Deskripsi
- Durasi
- Harga
- Thumbnail
- Status

==================================================
INVOICE
==================================================

Generate otomatis.

Format:

INV-YYYYMMDD-XXXX

Field:

- Nomor Invoice
- Pasien
- Dokter
- Layanan
- Tanggal
- Subtotal
- Diskon
- Total
- Status Pembayaran

Status:

- Unpaid
- Paid
- Refunded
- Void

Fitur:

- Cetak PDF
- Download PDF

==================================================
PEMBAYARAN
==================================================

Metode:

- Cash
- Transfer Bank
- QRIS

Simpan:

- Nominal
- Tanggal
- Metode
- Referensi

==================================================
WHATSAPP NOTIFICATION
==================================================

Kirim otomatis saat:

- Booking dibuat
- Booking dikonfirmasi
- Reminder H-1
- Invoice dibuat

Template dapat diedit admin.

==================================================
SETTINGS KLINIK
==================================================

Field:

- Nama Klinik
- Logo
- Favicon
- Alamat
- Email
- WhatsApp
- Jam Operasional
- Media Sosial
- Bahasa Default

==================================================
DATABASE COLLECTIONS
==================================================

users
patients
doctors
appointments
medical_records
services
invoices
payments
testimonials
faq
settings
notifications
audit_logs

==================================================
OWNER DASHBOARD
==================================================

Widget:

- Total Pasien
- Total Dokter
- Total Booking
- Pendapatan Hari Ini
- Pendapatan Bulan Ini
- Pendapatan Tahun Ini
- Layanan Terlaris
- Dokter Teraktif

==================================================
SECURITY
==================================================

Implementasikan:

- RBAC
- Protected Routes
- Firebase Rules
- Validation
- Sanitization
- Rate Limiting
- Audit Log
- Session Management

==================================================
UI UX
==================================================

Gunakan:

- ShadCN UI
- Responsive Design
- Mobile First
- Tablet Ready
- Desktop Ready

Harus memiliki:

- Loading State
- Skeleton Loader
- Toast Notification
- Empty State
- Error State
- Success State

Dark Mode Ready.

==================================================
SEO
==================================================

Implementasikan:

- Meta Title
- Meta Description
- Open Graph
- Sitemap
- Robots.txt
- Structured Data

==================================================
PERFORMANCE
==================================================

Implementasikan:

- Lazy Loading
- Pagination
- Caching
- Image Optimization
- Code Splitting

Target:

Lighthouse Score minimal 90+

==================================================
DELIVERABLE WAJIB
==================================================

Generate lengkap:

1. Folder Structure
2. Database Schema
3. Firestore Collections
4. Firebase Rules
5. Authentication Flow
6. Role Permission Matrix
7. API Structure
8. Service Layer
9. Reusable Components
10. Landing Page
11. Patient Dashboard
12. Doctor Dashboard
13. Admin Dashboard
14. Owner Dashboard
15. Booking Module
16. Medical Record Module
17. Invoice Module
18. Payment Module
19. WhatsApp Module
20. Settings Module
21. Translation System
22. Environment Variables
23. Seed Data
24. Deployment Guide
25. Staging Setup
26. Testing Plan
27. Production Checklist

==================================================
PENTING
==================================================

Fokus pada aplikasi yang dapat langsung digunakan operasional klinik.

Jangan membuat fitur enterprise yang belum diperlukan.

Jangan membuat fitur yang tidak diminta.

Prioritaskan:
- Kecepatan
- Kemudahan penggunaan
- Mobile experience
- Stabilitas
- Skalabilitas

Bangun aplikasi hingga siap dijalankan pada staging environment tanpa memerlukan redesign atau perubahan arsitektur besar.