// Single list of campus regions, shared by the form, the admin portal, the footer and the API
export const REGIONS = [
  { id: 'depok', name: 'Depok' },
  { id: 'kalimalang', name: 'Kalimalang' },
  { id: 'karawaci', name: 'Karawaci' },
  { id: 'cengkareng', name: 'Cengkareng' },
  { id: 'salemba', name: 'Salemba' },
  { id: 'simatupang', name: 'TB Simatupang' },
  // Not pickable in the form (alumni and guests pick it as their Status and get region '-'); old data has it, and the
  // panitia filter uses it for everyone without a campus region
  { id: 'alumni_tamu', name: 'Alumni / Tamu' },
];

// What a "Mahasiswa Gunadarma" can pick as campus region
export const CAMPUS_REGIONS = REGIONS.filter((r) => r.id !== 'alumni_tamu');

export const regionName = (id) => REGIONS.find((r) => r.id === id)?.name || id;
