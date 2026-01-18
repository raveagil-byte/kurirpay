# KurirPay - Sistem Penggajian Kurir

KurirPay adalah aplikasi berbasis web yang dirancang untuk mempermudah manajemen pengiriman (delivery) dan penggajian (payroll) kurir. Aplikasi ini memungkinkan kurir untuk mencatat pengiriman harian mereka dan memudahkan admin untuk memvalidasi data serta memproses pembayaran gaji secara akurat dan transparan.

## Fitur Utama

### 📱 Untuk Kurir (Courier)
*   **Input Pengiriman Harian**: Mencatat jumlah paket yang dikirim beserta foto bukti pengiriman.
*   **Dashboard Personal**: Melihat ringkasan kinerja dan status pengiriman (Pending, Disetujui, Ditolak).
*   **Riwayat Pembayaran**: Melihat riwayat gaji yang telah dibayarkan.
*   **Notifikasi**: Mendapatkan update status pengiriman dan pembayaran.

### 👑 Untuk Admin
*   **Validasi Pengiriman**: Menyetujui atau menolak laporan pengiriman yang masuk dari kurir.
*   **Manajemen Gaji (Payroll)**: Memproses pembayaran gaji kurir, termasuk perhitungan otomatis berdasarkan tarif per paket.
*   **Bonus & Potongan**: Fitur untuk menambahkan bonus kinerja atau potongan denda secara fleksibel.
*   **Laporan & Ekspor**: Ekspor data pengiriman dan penggajian ke format Excel.
*   **Pengaturan Sistem**: Mengatur tarif dasar per paket, nama aplikasi, dan konfigurasi lainnya.
*   **Audit Log**: Memantau aktivitas penting yang terjadi di dalam sistem untuk keamanan.

## Teknologi yang Digunakan

Aplikasi ini dibangun menggunakan teknologi modern untuk memastikan performa yang cepat dan kode yang mudah dikelola:

*   **Frontend**: 
    *   [React](https://react.dev/) (dengan [Vite](https://vitejs.dev/))
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Tailwind CSS](https://tailwindcss.com/) untuk styling.
    *   PWA (Progressive Web App) Support.
*   **Backend**: 
    *   [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
    *   [Prisma ORM](https://www.prisma.io/) untuk interaksi database.
*   **Database**: 
    *   [PostgreSQL](https://www.postgresql.org/) (di-hosting di [Supabase](https://supabase.com/)).

## Prasyarat

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:
*   [Node.js](https://nodejs.org/) (Versi 18 atau lebih baru).
*   Database PostgreSQL (Anda bisa menggunakan layanan gratis dari Supabase).

## Cara Menjalankan (Local Development)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di komputer lokal Anda:

### 1. Instalasi Dependencies

Jalankan perintah berikut di root folder proyek. Perintah ini akan menginstal dependencies untuk Frontend dan Backend sekaligus, serta men-generate Prisma Client.

```bash
npm install
```

### 2. Konfigurasi Environment (Backend)

Buat file bernama `.env` di dalam folder `backend/` dan isi dengan konfigurasi berikut. Anda bisa melihat contoh di `.env.example`.

```env
# URL Database (Transaction Mode untuk pooling)
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"

# Direct URL (Session Mode untuk migrasi)
DIRECT_URL="postgresql://user:password@host:port/database"

# Secret Key untuk JWT Token
JWT_SECRET="rahasia_super_aman_anda"

# Port Server Backend
PORT=3000

# URL Frontend (untuk CORS)
APP_URL="http://localhost:5173"

# Konfigurasi Email (Opsional - untuk notifikasi)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email_anda@gmail.com
SMTP_PASS=password_aplikasi_anda
```

### 3. Setup Database

Lakukan sinkronisasi skema database menggunakan Prisma:

```bash
cd backend
npx prisma db push
cd ..
```
*(Atau gunakan `npx prisma migrate dev` jika Anda ingin membuat file migrasi)*

### 4. Menjalankan Aplikasi

Aplikasi ini terdiri dari dua bagian (Frontend dan Backend) yang harus dijalankan secara bersamaan. Gunakan dua terminal terpisah:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*Backend akan berjalan di http://localhost:3000*

**Terminal 2 (Frontend):**
```bash
npm run dev
```
*Frontend akan berjalan di http://localhost:5173*

## Deployment (Vercel)

Proyek ini sudah dikonfigurasi untuk deployment ke Vercel:
1.  Pastikan Anda memiliki akun [Vercel](https://vercel.com/).
2.  Install Vercel CLI atau hubungkan repositori GitHub/GitLab Anda ke Vercel.
3.  Pastikan Environment Variables di Vercel sesuai dengan `.env` lokal Anda (namun sesuaikan `APP_URL` ke domain produksi).
4.  Deploy! Vercel akan otomatis mengenali konfigurasi `vercel.json` untuk menjalankan Backend sebagai Serverless Function dan Frontend sebagai Static Site.

## Lisensi

Private - Hak Cipta Dilindungi.
