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

export const STUDENT_STATUS = 'Mahasiswa Gunadarma';
export const ALUMNI_STATUS = 'Alumni Gunadarma';

// Only Gunadarma students and alumni give a campus region and angkatan; every other status stores '-' for both.
// Everyone picks a departure (Pribadi / Bersama).
export const GUNADARMA_STATUSES = [STUDENT_STATUS, ALUMNI_STATUS];

// Students pick their angkatan from this list
export const ANGKATAN = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

// Alumni type it as a year: from Gunadarma's first intake to the event year
export const ANGKATAN_MIN = 1981;
export const ANGKATAN_MAX = 2026;
export const validAngkatan = (v) => /^\d{4}$/.test(v) && v >= ANGKATAN_MIN && v <= ANGKATAN_MAX;

export const STATUSES = [
  STUDENT_STATUS,
  ALUMNI_STATUS,
  'Media Partner',
  'Organisasi Mahasiswa',
  'Umum (di luar Gunadarma)',
  'Undangan (Gereja dan Kampus Lain)',
];

// Statuses that also name where they come from, with that field's label; stored as `affiliation` ('-' otherwise)
export const AFFILIATION_LABELS = {
  'Media Partner': 'Nama Media Partner',
  'Organisasi Mahasiswa': 'Nama Organisasi Mahasiswa',
  'Undangan (Gereja dan Kampus Lain)': 'Asal Gereja/Universitas',
};

// "Media Partner • Kompas" for lists and the ticket; just the status when there is no affiliation
export const withAffiliation = (r) => (r.affiliation && r.affiliation !== '-' ? `${r.status} • ${r.affiliation}` : r.status);

// The full text is what gets stored; the form shows it without the part in brackets
export const KOMSEL_OPTIONS = [
  'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
  'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
];

// "Bersama" departs from one of these meeting points; "Pribadi" travels on their own (area '-').
// place: where to wait; address: shown under it. mapUrl (optional): the exact pin, used for "Buka di Google Maps"
// and sent in the WhatsApp message; without it the button searches the address.
export const DEPARTURES = ['Pribadi', 'Bersama'];
export const MEETING_POINTS = {
  Depok: {
    place: 'Depan Rumah Sakit Bhayangkara Brimob, Kelapa Dua',
    address: 'Jl. Komjen. Pol. M. Jasin, Pasir Gn. Sel., Kec. Cimanggis, Kota Depok, Jawa Barat 16451',
    mapUrl: 'https://maps.app.goo.gl/Q1oZXve9XoMeMGL38',
  },
  Kalimalang: {
    place: 'Kampus J1 Gunadarma',
    address: 'Jl. KH. Noer Ali, RT.005/RW.006A, Jakasampurna, Kec. Bekasi Bar., Kota Bks, Jawa Barat 17145',
  },
  Karawaci: {
    place: 'CGV Foodmosphere',
    address: 'RT.007/RW.003, Kelapa Indah, Tangerang, Tangerang City, Banten 15117',
  },
  Cengkareng: {
    place: 'Kampus L Gunadarma',
    address:
      'Jl. Ruko Mutiara Palem Raya Blok C7 No.20, RT.7/RW.14, Cengkareng Tim., Kecamatan Cengkareng, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11730',
  },
};

export const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
