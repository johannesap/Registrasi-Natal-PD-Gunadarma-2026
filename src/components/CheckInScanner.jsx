import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QrScanner from 'qr-scanner';
import { ScanLine, AlertCircle, CheckCircle2 } from 'lucide-react';

// Camera QR scanner for the door: every scanned ticket goes to onScan, which checks the participant in
// and returns { ok, text } to show. Stays open for the next person.
export default function CheckInScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState('');

  // The scanner keeps its first callback; read the latest onScan (fresh participant list) through a ref
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let busy = false;
    let last = { data: '', at: 0 };
    const scanner = new QrScanner(
      videoRef.current,
      async ({ data }) => {
        // The camera decodes the same QR many times a second: one at a time, and the same ticket again only after 5 s
        if (busy || (data === last.data && Date.now() - last.at < 5000)) return;
        busy = true;
        try {
          setResult(await onScanRef.current(data));
        } finally {
          last = { data, at: Date.now() };
          busy = false;
        }
      },
      { returnDetailedScanResult: true, preferredCamera: 'environment' }
    );
    let closed = false;
    scanner.start().catch(() => {
      // a start cut short by closing the dialog is not a camera problem
      if (!closed) setCameraError('Kamera tidak bisa dibuka. Izinkan akses kamera untuk situs ini, lalu buka ulang Scan QR.');
    });
    return () => {
      closed = true;
      scanner.destroy();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 sm:backdrop-blur-md overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
        className="glass-panel max-w-md w-full rounded-2xl p-5 sm:p-7 border border-amber-400/30 space-y-4 my-auto"
      >
        <h2 id="scan-title" className="text-lg font-bold font-['Cinzel'] text-gold-gradient uppercase tracking-wide flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-amber-300" />
          Scan QR Check-In
        </h2>

        <p className="text-xs text-gray-400">
          Arahkan kamera ke QR Code tiket peserta. Peserta langsung ditandai hadir.
        </p>

        <video ref={videoRef} muted playsInline className="w-full aspect-square object-cover rounded-xl bg-black border border-white/10" />

        {cameraError && (
          <div role="alert" className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {result && (
          <div
            role="status"
            className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
              result.ok
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                : 'bg-amber-950/50 border-amber-500/50 text-amber-200'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{result.text}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs tracking-wider uppercase transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>
    </div>,
    document.body
  );
}
