import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { regionName } from '../utils/regions';

const HEADERS = [
  'No',
  'Kode Tiket',
  'Nama Lengkap',
  'Jenis Kelamin',
  'Status',
  'WhatsApp',
  'Region',
  'Komsel',
  'Kakak Komsel',
  'Jurusan',
  'Angkatan',
  'Keberangkatan',
  'Presensi',
  'Terdaftar',
];

// "Export PDF": a plain table that only shows in print. It opens the print dialog once, where "Save as PDF"
// makes the file, then calls onDone. at: when Export was pressed; also the key, so every export mounts anew.
export default function ParticipantPdf({ at, rows, onDone }) {
  useEffect(() => {
    const title = document.title;
    // Chrome and Edge suggest the page title as the PDF file name
    document.title = `Data_Peserta_Natal_PD_Gunadarma_2026_${new Date().toLocaleDateString('sv-SE')}`;
    const done = () => {
      document.title = title;
      onDone();
    };
    window.addEventListener('afterprint', done, { once: true });
    // Next tick, so the table is on the page first (and StrictMode's double mount prints only once)
    const timer = setTimeout(() => window.print());
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', done);
      document.title = title;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per mount; the key remounts it per export

  return createPortal(
    <div className="print-sheet">
      <style>{'@page { size: A4 landscape; margin: 10mm; }'}</style>
      <h1>Data Registrasi Peserta — Natal PD Gunadarma 2026</h1>
      <p>
        Dicetak {new Date(at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} • {rows.length} peserta
      </p>
      <table>
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.ticketId}>
              <td>{i + 1}</td>
              <td>{r.ticketId}</td>
              <td>{r.fullName}</td>
              <td>{r.gender}</td>
              <td>{r.status}</td>
              <td>{r.whatsapp}</td>
              <td>{regionName(r.region)}</td>
              <td>{r.komselStatus?.replace(/\s*\(.*\)$/, '')}</td>
              <td>{r.mentorName}</td>
              <td>{r.faculty}</td>
              <td>{r.angkatan}</td>
              <td>
                {r.departure}
                {r.departureArea !== '-' && ` (${r.departureArea})`}
              </td>
              <td>{r.isCheckedIn ? `Hadir ${r.checkedInAt || ''}` : 'Belum Hadir'}</td>
              <td>{r.registeredAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>,
    document.body
  );
}
