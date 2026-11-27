import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  MapPin,
  Phone,
  Tag,
  BookOpen,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Download,
  Ticket,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Bus,
  Car,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { addRegistration } from '../utils/storage';
import { downloadTicketJpg } from '../utils/ticketImage';
import { CAMPUS_REGIONS, regionName as getRegionName } from '../utils/regions';
import {
  EVENT,
  GENDERS,
  STATUSES,
  STUDENT_STATUS,
  GUNADARMA_STATUSES,
  ANGKATAN,
  ANGKATAN_MIN,
  ANGKATAN_MAX,
  AFFILIATION_LABELS,
  withAffiliation,
  DEPARTURES,
  MEETING_POINTS,
  KOMSEL_OPTIONS,
  WHATSAPP_GROUP_URL,
  mapsUrl,
} from '../utils/event';

// Check-in QR holding the ticket code; panitia scan it with "Scan QR" on the sekretariat page
function TicketQR({ ticketId, className }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(ticketId, { margin: 2, width: 320 }).then(setSrc, console.error);
  }, [ticketId]);
  return src ? <img src={src} alt={`QR check-in tiket ${ticketId}`} className={`bg-white rounded-lg ${className}`} /> : null;
}

// Pill buttons backed by real radio inputs, so keyboard use and `required` still work
function ChoicePills({ legend, name, options, value, onChange, icons = {} }) {
  return (
    <fieldset>
      <legend className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
        {legend} <span className="text-rose-400">*</span>
      </legend>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const Icon = icons[opt];
          const on = value === opt;
          return (
            <label
              key={opt}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-base sm:text-sm font-medium cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-400 ${
                on
                  ? 'border-amber-400 bg-gradient-to-br from-amber-400/25 to-rose-800/30 text-amber-100 shadow-[0_0_18px_rgba(255,239,210,0.25)]'
                  : 'border-white/10 bg-neutral-900/70 text-gray-300 hover:border-amber-400/40 hover:text-gray-100'
              }`}
            >
              <input type="radio" name={name} value={opt} checked={on} onChange={onChange} required className="sr-only" />
              {Icon && <Icon className={`w-4 h-4 ${on ? 'text-amber-300' : 'text-emerald-400'}`} />}
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Live preview of the e-ticket while filling in the form. The issued ticket (code, QR, meeting point) is drawn
// by utils/ticketImage.js for "Simpan Tiket (JPG)": keep the two looking alike.
function TicketCard({ p }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-400/30 bg-gradient-to-b from-[#012265] via-[#0d192d] to-[#480000] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      {/* Gold foil ribbon border top */}
      <div className="absolute top-0 inset-x-0 h-1.5 palette-ribbon" />

      {/* Watermark Christmas Star */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full text-amber-300 fill-current">
          <polygon points="100,5 125,75 195,100 125,125 100,195 75,125 5,100 75,75" />
        </svg>
      </div>

      {/* Header Card */}
      <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase text-amber-300 font-semibold block">
            PERSEKUTUAN DOA UNIVERSITAS GUNADARMA
          </span>
          <h3 className="text-xl sm:text-2xl font-bold font-['Cinzel'] text-gold-gradient uppercase mt-0.5 tracking-wider">
            NATAL 2026
          </h3>
          <p className="text-xs text-amber-100/80 italic font-['Cormorant_Garamond']">
            &ldquo;{EVENT.theme}&rdquo; — {EVENT.verseRef}
          </p>
        </div>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
        </div>
      </div>

      {/* Card Body Information */}
      <div className="space-y-3 text-xs">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
            Nama Lengkap
          </span>
          <span className="text-sm font-semibold text-white tracking-wide block truncate">
            {p.fullName.trim() || 'Nama Peserta'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Jenis Kelamin
            </span>
            <span className="text-amber-300 font-medium">
              {p.gender || '-'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Region
            </span>
            <span className="text-gray-200 truncate block font-medium">
              {getRegionName(p.region)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Status
            </span>
            <span className="text-gray-300 truncate block text-[11px]">
              {withAffiliation(p) || '-'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              WhatsApp
            </span>
            <span className="text-gray-300 truncate block font-mono text-[11px]">
              {p.whatsapp.trim() || '08xxxxxxxxxx'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Kakak Komsel
            </span>
            <span className="text-gray-200 truncate block">
              {p.mentorName.trim() || '-'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Jurusan
            </span>
            <span className="text-gray-200 truncate block">
              {p.faculty.trim() || '-'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Keberangkatan
            </span>
            <span className="text-emerald-300 font-medium">{p.departure || '-'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Area Keberangkatan
            </span>
            <span className="text-gray-200">{p.departureArea || '-'}</span>
          </div>
        </div>

        {/* Event Schedule Info */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 mt-2">
          <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>{EVENT.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{EVENT.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>{EVENT.venue}</span>
          </div>
        </div>
      </div>

      {/* Barcode & Pass ID Footer */}
      <div className="mt-4 pt-3.5 border-t border-dashed border-white/20 flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-amber-300 block">
            Status Pass
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            READY TO ISSUE
          </span>
        </div>

        {/* Stylized Barcode SVG */}
        <div className="flex items-center gap-0.5 opacity-80 h-7">
          {[2, 4, 1, 3, 2, 5, 2, 1, 4, 2, 3, 1, 5, 2, 3, 2].map((w, i) => (
            <div
              key={i}
              className="bg-amber-200 h-full"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSection() {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    status: '',
    affiliation: '-',
    whatsapp: '',
    region: '-',
    angkatan: '-',
    komselStatus: KOMSEL_OPTIONS[0],
    mentorName: '',
    faculty: '',
    departure: '',
    departureArea: '-',
  });

  // The saved registration as the server returned it (null until submitted)
  const [registered, setRegistered] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'status') {
      // Only Gunadarma students and alumni give region, angkatan and departure; everyone else is '-'.
      // The affiliation field starts empty on every status change (a media name is not an organisation name).
      const gunadarma = GUNADARMA_STATUSES.includes(value);
      const keep = (v) => (gunadarma ? (v === '-' ? '' : v) : '-');
      setFormData((prev) => ({
        ...prev,
        status: value,
        region: keep(prev.region),
        // Students pick from ANGKATAN, so a typed alumni year outside it starts over
        angkatan: value === STUDENT_STATUS && !ANGKATAN.includes(prev.angkatan) ? '' : keep(prev.angkatan),
        departure: keep(prev.departure),
        departureArea: gunadarma ? prev.departureArea : '-',
        affiliation: AFFILIATION_LABELS[value] ? '' : '-',
      }));
      return;
    }

    if (name === 'angkatan') {
      setFormData((prev) => ({ ...prev, angkatan: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }

    if (name === 'departure') {
      // Pribadi: area is always '-'; Bersama: the participant picks a meeting point
      setFormData((prev) => ({ ...prev, departure: value, departureArea: value === 'Bersama' ? '' : '-' }));
      return;
    }

    if (name === 'whatsapp') {
      // WhatsApp: Hanya angka, maksimal 13 digit
      const numericOnly = value.replace(/\D/g, '').slice(0, 13);
      setFormData((prev) => ({ ...prev, whatsapp: numericOnly }));
      return;
    }

    if (name === 'komselStatus') {
      const isBelumMemiliki = value.includes('Belum memiliki Komsel');
      setFormData((prev) => ({
        ...prev,
        komselStatus: value,
        mentorName: isBelumMemiliki ? '-' : (prev.mentorName === '-' ? '' : prev.mentorName),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // The server makes the ticket code and WhatsApp link; this throws if it did not save
      const result = await addRegistration({
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        status: formData.status,
        affiliation: formData.affiliation.trim(),
        whatsapp: formData.whatsapp.trim(),
        region: formData.region,
        angkatan: formData.angkatan,
        komselStatus: formData.komselStatus,
        mentorName: isBelumPunya ? '-' : (formData.mentorName || '-'),
        faculty: formData.faculty.trim(),
        departure: formData.departure,
        departureArea: formData.departureArea,
      });

      setRegistered(result);

      // Trigger festive golden confetti celebration
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a20000', '#012265', '#c6b49f', '#ffefd2', '#fffaf0'],
        });
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const handleSaveTicket = async () => {
    setIsSavingTicket(true);
    try {
      await downloadTicketJpg(registered);
    } catch (err) {
      console.error(err);
      window.alert('Tiket gagal disimpan sebagai gambar. Silakan screenshot halaman ini.');
    } finally {
      setIsSavingTicket(false);
    }
  };

  const isBelumPunya = formData.komselStatus.includes('Belum memiliki Komsel');
  const isBersama = formData.departure === 'Bersama';
  const isGunadarma = GUNADARMA_STATUSES.includes(formData.status);
  const isStudent = formData.status === STUDENT_STATUS;
  const affiliationLabel = AFFILIATION_LABELS[formData.status];

  return (
    <section
      id="registrasi"
      className="relative min-h-screen w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 z-20 flex flex-col items-center justify-center"
    >
      {/* Background Soft Lighting Accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-rose-900/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold font-['Cinzel'] text-gold-gradient tracking-wide uppercase text-gold-glow mb-4"
        >
          <span className="block text-xl sm:text-3xl tracking-[0.3em] mb-1">Formulir</span>
          REGISTRASI NATAL 2026
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm sm:text-base text-gray-300 font-light max-w-xl mx-auto leading-relaxed"
        >
          Mari bersama-sama memuji, menyembah, dan menyambut sukacita kelahiran Sang Juru Selamat dalam persekutuan keluarga besar Universitas Gunadarma.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 py-2 rounded-2xl bg-emerald-950/40 border border-emerald-400/20 text-[11px] sm:text-xs text-gray-300"
        >
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-amber-300" />{EVENT.date}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-300" />{EVENT.time}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-300" />{EVENT.venue}</span>
        </motion.div>
      </div>

      {/* Main Content Layout: Form + Live Digital Pass */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-7 glass-panel rounded-2xl p-4 sm:p-7 md:p-9 relative overflow-hidden"
        >
          {/* Subtle Top Gold Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1 palette-ribbon" />

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Field: Nama Lengkap */}
            <div>
              <label htmlFor="reg-fullName" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                Nama Lengkap <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="text"
                  id="reg-fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Contoh: Jonathan Kevin Situmorang"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Field: Jenis Kelamin */}
            <ChoicePills
              legend="Jenis Kelamin"
              name="gender"
              options={GENDERS}
              value={formData.gender}
              onChange={handleChange}
            />

            {/* Field: Status, then Region Kampus + Angkatan for Gunadarma students and alumni (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Full width while there is no Region beside it */}
              <div className={isGunadarma ? '' : 'sm:col-span-2'}>
                <label htmlFor="reg-status" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                  Status <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Tag className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <select
                    id="reg-status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-neutral-900 text-gray-400">
                      Pilih status
                    </option>
                    {STATUSES.map((st) => (
                      <option key={st} value={st} className="bg-neutral-900 text-gray-100">
                        {st}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="text-xs">▼</span>
                  </div>
                </div>
              </div>

              {isGunadarma && (
                <div>
                  <label htmlFor="reg-region" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                    Region Kampus <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <MapPin className="w-4 h-4 text-amber-300/70" />
                    </div>
                    <select
                      id="reg-region"
                      name="region"
                      required
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-neutral-900 text-gray-400">
                        Pilih region kampus
                      </option>
                      {CAMPUS_REGIONS.map((r) => (
                        <option key={r.id} value={r.id} className="bg-neutral-900 text-gray-100">
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                      <span className="text-xs">▼</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Field: Angkatan: students pick from the list, alumni type the year */}
              {isGunadarma && (
                <div>
                  <label htmlFor="reg-angkatan" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                    Angkatan <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-amber-300/70" />
                    </div>
                    {isStudent ? (
                      <>
                        <select
                          id="reg-angkatan"
                          name="angkatan"
                          required
                          value={formData.angkatan}
                          onChange={handleChange}
                          className="w-full pl-10 pr-10 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-neutral-900 text-gray-400">
                            Pilih angkatan
                          </option>
                          {ANGKATAN.map((year) => (
                            <option key={year} value={year} className="bg-neutral-900 text-gray-100">
                              {year}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                          <span className="text-xs">▼</span>
                        </div>
                      </>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        id="reg-angkatan"
                        name="angkatan"
                        required
                        pattern="[0-9]{4}"
                        maxLength={4}
                        title={`Tahun angkatan, 4 angka (${ANGKATAN_MIN}–${ANGKATAN_MAX})`}
                        value={formData.angkatan}
                        onChange={handleChange}
                        placeholder="Contoh: 2015"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Field: name of the media partner / organisation / church or campus, for those statuses */}
              {affiliationLabel && (
                <div className="sm:col-span-2">
                  <label htmlFor="reg-affiliation" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                    {affiliationLabel} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="w-4 h-4 text-amber-300/70" />
                    </div>
                    <input
                      type="text"
                      id="reg-affiliation"
                      name="affiliation"
                      required
                      maxLength={150}
                      value={formData.affiliation}
                      onChange={handleChange}
                      placeholder={`Tuliskan ${affiliationLabel.toLowerCase()}`}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Field: Nomor WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label htmlFor="reg-whatsapp" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
                  Nomor WhatsApp <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-mono text-gray-400">
                  {formData.whatsapp.length}/13 angka
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  id="reg-whatsapp"
                  name="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  maxLength={13}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Field: Status Komsel & Nama Kakak Komsel */}
            <div className="space-y-3 p-3.5 sm:p-4 rounded-xl bg-amber-950/15 border border-amber-400/15">
              <label htmlFor="reg-komselStatus" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
                Kelompok Sel (Komsel) & Mentor <span className="text-rose-400">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Users className="w-4 h-4 text-amber-300/70" />
                </div>
                <select
                  id="reg-komselStatus"
                  name="komselStatus"
                  value={formData.komselStatus}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
                >
                  {KOMSEL_OPTIONS.map((opt, idx) => (
                    <option key={idx} value={opt} className="bg-neutral-900 text-gray-100">
                      {/* Short label so it fits on phones; the full text stays the stored value */}
                      {opt.replace(/\s*\(.*\)$/, '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kakak Komsel Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-mentorName" className="block text-[11px] font-medium tracking-wider text-gray-300 uppercase">
                    Nama Kakak Komsel
                  </label>
                </div>
                <input
                  type="text"
                  id="reg-mentorName"
                  name="mentorName"
                  value={formData.mentorName}
                  onChange={handleChange}
                  readOnly={isBelumPunya}
                  placeholder={isBelumPunya ? '-' : 'Contoh: Kak Daniel / Kak Maria'}
                  className={`w-full px-4 py-2.5 rounded-xl text-base sm:text-sm transition-all ${
                    isBelumPunya
                      ? 'bg-neutral-800/60 border border-amber-400/30 text-amber-300 font-mono text-center font-bold cursor-not-allowed'
                      : 'bg-neutral-900/70 border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                  }`}
                />
              </div>
            </div>

            {/* Field: Jurusan */}
            <div>
              <label htmlFor="reg-faculty" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                Jurusan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <BookOpen className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="text"
                  id="reg-faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="Contoh: Informatika"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Field: Opsi Keberangkatan & Area, only for Gunadarma students and alumni (the bus is for them) */}
            {isGunadarma && (
            <div className="space-y-3 p-3.5 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-400/25">
              <ChoicePills
                legend="Opsi Keberangkatan"
                name="departure"
                options={DEPARTURES}
                value={formData.departure}
                onChange={handleChange}
                icons={{ Pribadi: Car, Bersama: Bus }}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-departureArea" className="block text-[11px] font-medium tracking-wider text-gray-300 uppercase">
                    Area Keberangkatan
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Navigation className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <select
                    id="reg-departureArea"
                    name="departureArea"
                    value={formData.departureArea}
                    onChange={handleChange}
                    disabled={!isBersama}
                    required={isBersama}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl text-base sm:text-sm transition-all appearance-none ${
                      isBersama
                        ? 'bg-neutral-900/80 border border-white/10 text-gray-100 cursor-pointer focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                        : 'bg-neutral-800/60 border border-amber-400/30 text-amber-300 font-mono font-bold cursor-not-allowed'
                    }`}
                  >
                    {isBersama ? (
                      <>
                        <option value="" disabled className="bg-neutral-900 text-gray-400">
                          Pilih area titik kumpul
                        </option>
                        {Object.keys(MEETING_POINTS).map((area) => (
                          <option key={area} value={area} className="bg-neutral-900 text-gray-100">
                            {area}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="-">-</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="text-xs">▼</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Pendaftaran belum tersimpan: {submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="gold-btn w-full py-4 rounded-xl font-semibold text-neutral-950 text-sm tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,239,210,0.35)]"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>MENGIRIMKAN TIKET OTOMATIS...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 text-neutral-950" />
                    <span>KONFIRMASI REGISTRASI SEKARANG</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Kode tiket langsung muncul setelah Anda mendaftar</span>
            </div>
          </form>
        </motion.div>

        {/* Live Digital Christmas Pass Preview */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-5 flex flex-col items-center"
        >
          <div className="w-full sticky top-24">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold tracking-widest uppercase text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                PREVIEW E-TICKET RESMI
              </span>
              <span className="text-[11px] text-gray-400">Live Preview</span>
            </div>

            <TicketCard p={formData} />

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Pratinjau tiket. Kode tiket resmi muncul setelah Anda menekan Konfirmasi.
            </p>

            {/* Venue map */}
            <div className="mt-6 rounded-2xl overflow-hidden border border-amber-400/30 bg-emerald-950/60">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs font-semibold tracking-widest uppercase text-amber-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Lokasi Natal
                </span>
                <a
                  href={EVENT.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1"
                >
                  Buka di Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <iframe
                title={`Peta lokasi ${EVENT.venue}`}
                src={EVENT.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="block w-full h-56 border-0"
              />
              <p className="px-4 py-2.5 text-[11px] text-gray-300">{EVENT.venue}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL WITH AUTOMATIC WHATSAPP & EMAIL DISPATCH */}
      {createPortal(
      <AnimatePresence>
        {registered && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-7 md:p-8 text-center relative border border-amber-400/40 shadow-[0_0_60px_rgba(255,239,210,0.3)] my-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setRegistered(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm cursor-pointer p-1"
              >
                ✕
              </button>

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-400" />
              </div>

              <span className="text-[11px] font-semibold tracking-[0.25em] text-amber-300 uppercase block mb-1">
                REGISTRASI BERHASIL TERKONFIRMASI
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-gold-gradient uppercase mb-2">
                SELAMAT DATANG!
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 font-light mb-5">
                Terima kasih, <strong className="text-white">{registered.fullName}</strong>.{' '}
                {registered.alreadyRegistered
                  ? 'Nomor WhatsApp ini sudah terdaftar sebelumnya, jadi ini tiket Anda yang lama.'
                  : 'Pendaftaran Anda sudah tersimpan.'}
              </p>

              {/* Tickets are not sent automatically: tell people how to keep theirs */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/80 to-emerald-950/40 border border-emerald-400/30 text-left text-xs text-gray-300 space-y-1.5 mb-5">
                <div className="flex items-center gap-2 font-semibold text-emerald-300 uppercase tracking-wider">
                  <Send className="w-3.5 h-3.5" />
                  <span>Simpan Tiket Anda</span>
                </div>
                <p>
                  Tekan tombol hijau di bawah untuk membuka WhatsApp, lalu kirim pesan tiket itu ke nomor Anda sendiri.
                  Anda juga bisa menyimpan tiket sebagai gambar (JPG) atau screenshot halaman ini. Tunjukkan QR Code di bawah di pintu masuk.
                </p>
              </div>

              <div className="mb-5">
                <TicketQR ticketId={registered.ticketId} className="w-44 h-44 mx-auto" />
                <span className="text-[10px] uppercase tracking-widest text-amber-300 block mt-2">
                  QR Check-In Kehadiran
                </span>
              </div>

              {MEETING_POINTS[registered.departureArea] && (
                <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-emerald-800/60 via-emerald-950/80 to-rose-900/50 border border-amber-400/40 text-left mb-5">
                  <div className="absolute top-0 inset-x-0 h-1 palette-ribbon" />
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs tracking-[0.2em] uppercase mb-2">
                    <Bus className="w-4 h-4" />
                    <span>Titik Kumpul Keberangkatan</span>
                  </div>
                  <p className="text-lg font-['Cinzel'] font-bold text-white">{registered.departureArea}</p>
                  <p className="text-sm font-semibold text-amber-100 mt-1">{MEETING_POINTS[registered.departureArea].place}</p>
                  <p className="text-xs text-gray-200 leading-relaxed mt-1">
                    <span className="text-gray-400">Alamat:</span> {MEETING_POINTS[registered.departureArea].address}
                  </p>
                  <a
                    href={MEETING_POINTS[registered.departureArea].mapUrl || mapsUrl(MEETING_POINTS[registered.departureArea].address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Buka di Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Pass Summary Details */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-amber-400/20 text-left space-y-1.5 mb-5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Kode Tiket Resmi:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{registered.ticketId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Jenis Kelamin:</span>
                  <span className="text-white">{registered.gender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Region Kampus:</span>
                  <span className="text-white font-medium">{getRegionName(registered.region)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Kakak Komsel:</span>
                  <span className="text-white">{registered.mentorName}</span>
                </div>
                {AFFILIATION_LABELS[registered.status] && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-400 shrink-0">{AFFILIATION_LABELS[registered.status]}:</span>
                    <span className="text-white text-right">{registered.affiliation}</span>
                  </div>
                )}
                {/* Guests are not asked how they travel */}
                {registered.departure !== '-' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Keberangkatan:</span>
                    <span className="text-white">
                      {registered.departure}
                      {registered.departureArea !== '-' && ` (${registered.departureArea})`}
                    </span>
                  </div>
                )}
                <div className="pt-1.5 mt-1.5 border-t border-white/10 text-center text-gray-300">
                  {EVENT.date} • {EVENT.time} • {EVENT.venue}
                </div>
              </div>

              {/* Action Buttons: Open WhatsApp, Print, Done */}
              <div className="space-y-2.5">
                {/* 1-Click Open in WhatsApp */}
                <a
                  href={registered.dispatch.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl font-semibold text-emerald-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 hover:brightness-105 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(127,157,216,0.3)]"
                >
                  <MessageSquare className="w-4 h-4 fill-emerald-950" />
                  <span>Buka Salinan Tiket di WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {WHATSAPP_GROUP_URL && (
                  <a
                    href={WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl font-semibold text-emerald-100 bg-emerald-900/50 border border-emerald-400/50 hover:bg-emerald-800/60 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Users className="w-4 h-4" />
                    <span>Gabung Grup WhatsApp Peserta</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleSaveTicket}
                    type="button"
                    disabled={isSavingTicket}
                    className="gold-btn flex-1 py-2.5 rounded-xl font-semibold text-neutral-950 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isSavingTicket ? 'Menyimpan...' : 'Simpan Tiket (JPG)'}</span>
                  </button>
                  <button
                    onClick={() => setRegistered(null)}
                    type="button"
                    className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </section>
  );
}
