# Registrasi Natal PD Gunadarma 2026

Situs pendaftaran Natal Persekutuan Doa Universitas Gunadarma. Peserta mendaftar dan langsung mendapat tiket ber-QR;
panitia membuka portal di `/#admin`.

- **admin**: kelola akun panitia, Audit Log
- **sekretariat**: Data Peserta, Data Bus, Export PDF, Scan QR check-in

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
| `npm run set-admin -- <username> <email> <admin\|sekretariat>` | Buat akun, atau reset password-nya |

## Mengubah isi acara

- `src/utils/event.js`: tanggal, jam, tempat, tema dan ayat, titik kumpul bus, link grup WhatsApp, pilihan Status dan Komsel
- `src/utils/regions.js`: region kampus
- `public/audio/jesus-it-is-you.mp3`: lagu latar
- `src/components/Footer.jsx`: kontak person

## Deploy (Vercel)

Vercel menjalankan `vite build` untuk tampilan dan `api/index.js` untuk API (lihat `vercel.json`).
Isi Environment Variables di Vercel: `MONGODB_URI`, `MONGODB_DATABASE` (kosong = `natal_pd_2026`) dan `ADMIN_TOKEN_SECRET`.
