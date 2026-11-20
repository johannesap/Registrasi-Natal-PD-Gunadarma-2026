// One place for the event details shown on the opening page, the e-ticket and the WhatsApp message
export const EVENT = {
  date: 'Sabtu, 12 Desember 2026',
  time: '17:00 - 21:00 WIB',
  venue: 'GBI Lewi Mitra 10 Cibubur, Lantai 3',
  mapUrl: 'https://maps.app.goo.gl/Jtg3NaTJE4AZpC5e8',
  // Pin of that link (GBI Lewi Cibubur, Mitra 10 Lt3); Google's keyless embed takes coordinates, not the short link
  mapEmbedUrl: 'https://maps.google.com/maps?q=-6.380833,106.9311014&z=16&hl=id&output=embed',
  theme: 'The Unexpected Joy',
  verseRef: 'Lukas 2:10-11',
  verse:
    // The hero adds the outer quotes; the angel's words share the closing one
    'Lalu kata malaikat itu kepada mereka: “Jangan takut, sebab sesungguhnya aku memberitakan kepadamu kesukaan besar untuk seluruh bangsa: Hari ini telah lahir bagimu Juruselamat, yaitu Kristus, Tuhan, di kota Daud.',
};

// Invite link of the participants' WhatsApp group (https://chat.whatsapp.com/...), shown after registering and in
// the ticket message. Empty hides both.
export const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/DHO3Z41rYc1HLd1xzuftPJ?s=sw&p=a&iam=2';

export const GENDERS = ['Laki-laki', 'Perempuan'];

// Only this status picks a campus region; every other status has region '-'
export const STUDENT_STATUS = 'Mahasiswa Gunadarma';

export const STATUSES = [
  STUDENT_STATUS,
  'Alumni Gunadarma',
  'Media Partner',
  'Organisasi Mahasiswa',
  'Umum (di luar Gunadarma)',
  'Undangan (Gereja dan Kampus Lain)',
];

// The full text is what gets stored; the form shows it without the part in brackets
export const KOMSEL_OPTIONS = [
  'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
  'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
];

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
