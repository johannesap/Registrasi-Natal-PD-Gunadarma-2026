// Single list of campus regions, shared by the form, the admin portal, the footer and the API
export const REGIONS = [
  { id: 'depok', name: 'Depok' },
  { id: 'kalimalang', name: 'Kalimalang' },
  { id: 'karawaci', name: 'Karawaci' },
  { id: 'cengkareng', name: 'Cengkareng' },
  { id: 'salemba', name: 'Salemba' },
  { id: 'simatupang', name: 'TB Simatupang' },
  // Only for registrations from before the Status field; alumni and guests now pick it as their Status
  { id: 'alumni_tamu', name: 'Alumni / Tamu' },
];

// What a "Mahasiswa Gunadarma" can pick as campus region
export const CAMPUS_REGIONS = REGIONS.filter((r) => r.id !== 'alumni_tamu');

export const regionName = (id) => REGIONS.find((r) => r.id === id)?.name || id;
