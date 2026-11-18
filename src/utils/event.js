// One place for the event details shown on the opening page, the e-ticket and the WhatsApp message
export const EVENT = {
  date: 'Sabtu, 12 Desember 2026',
  time: '17:00 - 21:00 WIB',
  venue: 'GBI Lewi Mitra 10 Cibubur',
  theme: 'The Unexpected Joy',
  verseRef: 'Lukas 2:10-11',
  verse:
    // The hero adds the outer quotes; the angel's words share the closing one
    'Lalu kata malaikat itu kepada mereka: “Jangan takut, sebab sesungguhnya aku memberitakan kepadamu kesukaan besar untuk seluruh bangsa: Hari ini telah lahir bagimu Juruselamat, yaitu Kristus, Tuhan, di kota Daud.',
};

export const GENDERS = ['Laki-laki', 'Perempuan'];

// "Bersama" departs from one of these meeting points; "Pribadi" travels on their own (area '-')
export const DEPARTURES = ['Pribadi', 'Bersama'];
export const MEETING_POINTS = {
  Depok: 'Jalan Akses UI, Pasir Gn. Sel., Kec. Cimanggis, Kota Depok, Jawa Barat 16451',
  Kalimalang: 'Jl. KH. Noer Ali, RT.005/RW.006A, Jakasampurna, Kec. Bekasi Bar., Kota Bks, Jawa Barat 17145',
  Karawaci: 'Jl. Imam Bonjol No.1, RT.2/RW.004, Panunggangan Bar., Kec. Cibodas, Kota Tangerang, Banten 15138',
  Cengkareng:
    'Jl. Ruko Mutiara Palem Raya Blok C7 No.20, RT.7/RW.14, Cengkareng Tim., Kecamatan Cengkareng, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11730',
};

export const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
