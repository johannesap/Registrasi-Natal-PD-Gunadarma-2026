# Registrasi Natal PD Gunadarma 2026

Situs pendaftaran Natal Persekutuan Doa Universitas Gunadarma. Peserta mendaftar dan langsung mendapat tiket ber-QR;
panitia membuka portal di `/#admin`.

- **admin**: kelola akun panitia, Audit Log
- **pendataan** (peran `sekretariat` di sistem): Data Peserta, Data Bus, Export PDF, Scan QR check-in

React + Vite (tampilan), Express (API, `server/`), MongoDB Atlas (data), di-deploy ke Vercel.

## Menjalankan di komputer sendiri

1. Node.js 22 atau lebih baru, lalu `npm install`.
2. Buat file `.env` di folder ini:

   ```
   MONGODB_URI=mongodb+srv://...
   MONGODB_DATABASE=natal_pd_2026_dev
   ADMIN_TOKEN_SECRET=teks-acak-yang-panjang
   ```

   Pakai database terpisah untuk mencoba (bukan `natal_pd_2026`, database live).
3. Buat akun panitia pertama: `npm run set-admin -- <username> <email> admin`.
   Password barunya dicetak sekali di layar.
4. `npm run dev`, lalu buka http://localhost:5173. API ikut jalan di server yang sama.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Situs + API untuk dicoba di komputer |
| `npm test` | Tes API; yang memakai database hanya jalan jika `MONGODB_DATABASE` bukan database live |
| `npm run lint` | Cek kode |
| `npm run build` | Build untuk production |
| `npm start` | Server production di luar Vercel (Hostinger, VPS): situs dari `dist/` + API, port `PORT` (bawaan 3000) |
| `npm run set-admin -- <username> <email> <admin\|sekretariat>` | Buat akun, atau reset password-nya |

## Mengubah isi acara

- `src/utils/event.js`: tanggal, jam, tempat, tema dan ayat, titik kumpul bus, link grup WhatsApp, pilihan Status dan Komsel
- `src/utils/regions.js`: region kampus
- `public/audio/jesus-it-is-you.mp3`: lagu latar
- `src/components/Footer.jsx`: kontak person

## Deploy (Vercel)

Vercel menjalankan `vite build` untuk tampilan dan `api/index.js` untuk API (lihat `vercel.json`).
API-nya berjalan di Singapura (`"regions": ["sin1"]`), dekat database Atlas (AWS Singapura); kalau database pindah
region, samakan juga region ini.
Isi Environment Variables di Vercel: `MONGODB_URI`, `MONGODB_DATABASE` (kosong = `natal_pd_2026`) dan `ADMIN_TOKEN_SECRET`.

## Deploy (Hostinger atau VPS)

API-nya butuh Node.js, jadi pakai paket **Business Web Hosting, Cloud, atau VPS**. Paket Single/Premium hanya bisa
menampilkan halaman; pendaftaran, login panitia dan check-in tidak akan jalan.

1. hPanel → Node.js web app: hubungkan repo GitHub, pilih Node.js 22 atau lebih baru.
   - Build command: `npm run build`
   - Start command: `npm start` (file: `server/start.js`)
2. Environment Variables: `MONGODB_URI`, `MONGODB_DATABASE`, `ADMIN_TOKEN_SECRET` (sama seperti di Vercel).
3. MongoDB Atlas → Network Access: izinkan alamat IP server Hostinger.
4. Aktifkan SSL (HTTPS). Kamera untuk Scan QR hanya jalan di HTTPS.
5. Cek alamat pengunjung: buka `https://<domain>/api/health` dari HP (data seluler) dan dari laptop (Wi-Fi).
   `yourIp` harus berbeda dan sesuai jaringan masing-masing. Kalau semua sama, naikkan `TRUST_PROXY` (bawaan `1`,
   jumlah proxy di depan server) di Environment Variables, lalu cek lagi. Batas login dan pendaftaran bergantung
   pada alamat ini.

Di VPS: `npm ci && npm run build`, jalankan `npm start` dengan PM2, dan arahkan nginx (dengan SSL) ke port `PORT`.
