// Single list of campus regions, shared by the form, the admin portal and the API
export const REGIONS = [
  { id: 'depok', name: 'Depok' },
  { id: 'kalimalang', name: 'Kalimalang' },
  { id: 'karawaci', name: 'Karawaci' },
  { id: 'cengkareng', name: 'Cengkareng' },
  { id: 'simatupang', name: 'Simatupang' },
  { id: 'salemba', name: 'Salemba' },
  { id: 'alumni_tamu', name: 'Alumni / Tamu' },
];

export const regionName = (id) => REGIONS.find((r) => r.id === id)?.name || id;
