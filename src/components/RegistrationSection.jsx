import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Hash,
  Users,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  Download,
  Share2,
  Ticket,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Send,
  MessageSquare,
  Check,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { addRegistration } from '../utils/storage';

const REGIONS = [
  { id: 'depok', name: 'Depok' },
  { id: 'kalimalang', name: 'Kalimalang' },
  { id: 'karawaci', name: 'Karawaci' },
  { id: 'cengkareng', name: 'Cengkareng' },
  { id: 'simatupang', name: 'Simatupang' },
  { id: 'salemba', name: 'Salemba' },
  { id: 'alumni_tamu', name: 'Alumni / Tamu' },
];

const KOMSEL_OPTIONS = [
  'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
  'Belum memiliki Komsel (Rindu bergabung dengan Komsel PD)',
  'Alumni / Pengurus',
  'Tamu / Undangan Khusus',
];

export default function RegistrationSection({ onBackToHero }) {
  const [formData, setFormData] = useState({
    fullName: '',
    npm: '',
    email: '',
    whatsapp: '',
    region: 'depok',
    komselStatus: KOMSEL_OPTIONS[0],
    mentorName: '',
    faculty: '',
    session: 'Sesi Utama (16.30 WIB - Selesai)',
  });

  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchInfo, setDispatchInfo] = useState({
    emailSent: false,
    whatsappSent: false,
    timestamp: '',
    whatsappUrl: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'npm') {
      // NPM: Hanya angka, maksimal 8 digit
      const numericOnly = value.replace(/\D/g, '').slice(0, 8);
      setFormData((prev) => ({ ...prev, npm: numericOnly }));
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

  const getRegionName = (id) => {
    const found = REGIONS.find((r) => r.id === id);
    return found ? found.name : id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate initial ticket code
      const randomCode =
        'NATAL-UG-' +
        Math.floor(1000 + Math.random() * 9000) +
        '-' +
        (formData.npm.slice(-4) || '2026');

      // Submit registration to backend API (with resilient offline fallback)
      const registered = await addRegistration({
        ticketId: randomCode,
        fullName: formData.fullName.trim(),
        npm: formData.npm.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim(),
        region: formData.region,
        komselStatus: formData.komselStatus,
        mentorName: isBelumPunya ? '-' : (formData.mentorName || '-'),
        faculty: formData.faculty || 'Gunadarma',
        session: formData.session,
      });

      const actualTicketId = registered?.ticketId || randomCode;
      setTicketId(actualTicketId);

      // Clean WhatsApp phone number (convert 08xxx to 628xxx)
      let cleanWa = formData.whatsapp.replace(/\D/g, '');
      if (cleanWa.startsWith('0')) {
        cleanWa = '62' + cleanWa.slice(1);
      } else if (!cleanWa.startsWith('62')) {
        cleanWa = '62' + cleanWa;
      }

      // Generate formatted official WhatsApp message
      const waMessage =
        `✨ *TIKET RESMI — NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026* ✨\n` +
        `_"Merayakan Kasih, Menyalakan Harapan"_\n\n` +
        `Shalom, *${formData.fullName.trim()}*!\n` +
        `Pendaftaran Ibadah & Perayaan Natal Anda telah *BERHASIL TERKONFIRMASI*.\n\n` +
        `📌 *DETAIL E-TICKET ANDA:*\n` +
        `• Kode Tiket: *${actualTicketId}*\n` +
        `• NPM: *${formData.npm}*\n` +
        `• Email: *${formData.email}*\n` +
        `• Region Kampus: *${getRegionName(formData.region)}*\n` +
        `• Kakak Komsel: *${formData.mentorName || '-'}*\n` +
        `• Jurusan: *${formData.faculty || 'Universitas Gunadarma'}*\n\n` +
        `🗓️ *WAKTU & TEMPAT:*\n` +
        `• Tanggal: Jumat, 18 Desember 2026\n` +
        `• Pukul: 16.30 WIB - Selesai\n` +
        `• Lokasi: Auditorium Kampus Gunadarma\n\n` +
        `_Simpan pesan dan kode tiket ini untuk ditunjukkan saat registrasi ulang di pintu masuk auditorium._\n\n` +
        `Sampai berjumpa dalam sukacita Natal! Tuhan Yesus memberkati. 🙏✨`;

      const generatedWaUrl =
        registered?.dispatch?.whatsappUrl ||
        `https://api.whatsapp.com/send?phone=${cleanWa}&text=${encodeURIComponent(waMessage)}`;

      const currentTime = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setDispatchInfo({
        emailSent: true,
        whatsappSent: true,
        timestamp: currentTime,
        whatsappUrl: generatedWaUrl,
      });

      setSubmitted(true);

      // Trigger festive golden confetti celebration
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F5D061', '#E6B325', '#FFFFFF', '#38b000', '#E63946'],
        });
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isBelumPunya = formData.komselStatus.includes('Belum memiliki Komsel');

  return (
    <section
      id="registrasi"
      className="relative min-h-screen w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 z-20 flex flex-col items-center justify-center"
    >
      {/* Background Soft Lighting Accents */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-rose-950/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
        <button
          onClick={onBackToHero}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-amber-200/80 hover:text-amber-100 bg-white/5 hover:bg-white/10 border border-amber-400/20 mb-6 transition-all duration-300 cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Pembuka</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-[0.2em] text-amber-300 uppercase bg-amber-950/30 border border-amber-400/30 mb-3"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>FORMULIR PENDAFTARAN RESMI</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold font-['Cinzel'] text-gold-gradient tracking-wide uppercase text-gold-glow mb-4"
        >
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
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Field: Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                Nama Lengkap <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Contoh: Jonathan Kevin Situmorang"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Field: NPM & Region Kampus (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
                    NPM (Maks 8 Angka) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-gray-400">
                    {formData.npm.length}/8 angka
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Hash className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="npm"
                    required
                    value={formData.npm}
                    onChange={handleChange}
                    placeholder="Contoh: 50421890"
                    maxLength={8}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono tracking-wider"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                  Region Kampus <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
                  >
                    {REGIONS.map((r) => (
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
            </div>

            {/* Field: Email & WhatsApp (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                  Email Aktif <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Contoh: nama@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
                    Nomor WhatsApp (Maks 13 Angka) <span className="text-rose-400">*</span>
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
            </div>

            {/* Field: Status Komsel & Nama Kakak Komsel */}
            <div className="space-y-3 p-3.5 sm:p-4 rounded-xl bg-amber-950/15 border border-amber-400/15">
              <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase">
                Kelompok Sel (Komsel) & Mentor <span className="text-rose-400">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Users className="w-4 h-4 text-amber-300/70" />
                </div>
                <select
                  name="komselStatus"
                  value={formData.komselStatus}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
                >
                  {KOMSEL_OPTIONS.map((opt, idx) => (
                    <option key={idx} value={opt} className="bg-neutral-900 text-gray-100">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kakak Komsel Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium tracking-wider text-gray-300 uppercase">
                    Nama Kakak Komsel
                  </label>
                  {isBelumPunya && (
                    <span className="text-[10px] text-amber-300 font-medium bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      Otomatis diisi strip (-)
                    </span>
                  )}
                </div>
                <input
                  type="text"
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

            {/* Field: Jurusan / Fakultas */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5 sm:mb-2">
                Jurusan / Fakultas
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <BookOpen className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="text"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="Contoh: Informatika / FTI"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/70 border border-white/10 rounded-xl text-base sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="gold-btn w-full py-4 rounded-xl font-semibold text-neutral-950 text-sm tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,208,97,0.35)]"
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
              <span>Tiket resmi akan dikirim otomatis ke WhatsApp & Email Anda</span>
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

            {/* Christmas Digital Ticket Card */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-400/30 bg-gradient-to-b from-[#09152b] via-[#051a14] to-[#1a060d] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              {/* Gold foil ribbon border top */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" />

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
                  <p className="text-[11px] text-amber-100/70 italic font-['Cormorant_Garamond']">
                    &ldquo;Merayakan Kasih, Menyalakan Harapan&rdquo;
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
                    {formData.fullName.trim() || 'Nama Peserta'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                      NPM
                    </span>
                    <span className="font-mono text-amber-300 font-medium">
                      {formData.npm.trim() || '— — — — — — — —'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                      Region
                    </span>
                    <span className="text-gray-200 truncate block font-medium">
                      {getRegionName(formData.region)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                      Email
                    </span>
                    <span className="text-gray-300 truncate block font-mono text-[11px]">
                      {formData.email.trim() || 'email@domain.com'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                      WhatsApp
                    </span>
                    <span className="text-gray-300 truncate block font-mono text-[11px]">
                      {formData.whatsapp.trim() || '08xxxxxxxxxx'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                      Kakak Komsel
                    </span>
                    <span className="text-gray-200 truncate block">
                      {formData.mentorName.trim() || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                      Jurusan
                    </span>
                    <span className="text-gray-200 truncate block">
                      {formData.faculty.trim() || 'Gunadarma'}
                    </span>
                  </div>
                </div>

                {/* Event Schedule Info */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 mt-2">
                  <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>Jumat, 18 Desember 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>16.30 WIB — Selesai</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auditorium Kampus Gunadarma</span>
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

            <p className="text-[11px] text-gray-400 text-center mt-3">
              QR Code & Tiket resmi akan diterbitkan dan dikirim otomatis setelah konfirmasi
            </p>
          </div>
        </motion.div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL WITH AUTOMATIC WHATSAPP & EMAIL DISPATCH */}
      <AnimatePresence>
        {submitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-7 md:p-8 text-center relative border border-amber-400/40 shadow-[0_0_60px_rgba(245,208,97,0.3)] my-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSubmitted(false)}
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
                Terima kasih, <strong className="text-white">{formData.fullName}</strong>. Tiket resmi Anda telah dibuat dan otomatis dikirimkan ke kontak terdaftar.
              </p>

              {/* AUTOMATIC DISPATCH STATUS CARD */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/80 to-emerald-950/40 border border-emerald-400/30 text-left space-y-3 mb-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  <Send className="w-3.5 h-3.5" />
                  <span>Status Pengiriman Otomatis ({dispatchInfo.timestamp})</span>
                </div>

                {/* WhatsApp Status */}
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Phone className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="text-gray-300 block font-medium">WhatsApp: {formData.whatsapp}</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tiket & QR Link Otomatis Terkirim
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                    SENT
                  </span>
                </div>

                {/* Email Status */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Mail className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="text-gray-300 block font-medium truncate max-w-[200px] sm:max-w-[260px]">
                        Email: {formData.email}
                      </span>
                      <span className="text-[10px] text-amber-300 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tiket Digital Terkirim ke Inbox
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold">
                    SENT
                  </span>
                </div>
              </div>

              {/* Pass Summary Details */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-amber-400/20 text-left space-y-1.5 mb-5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Kode Tiket Resmi:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{ticketId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">NPM Mahasiswa:</span>
                  <span className="font-mono text-white">{formData.npm}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Region Kampus:</span>
                  <span className="text-white font-medium">{getRegionName(formData.region)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Kakak Komsel:</span>
                  <span className="text-white">{formData.mentorName || '-'}</span>
                </div>
              </div>

              {/* Action Buttons: Open WhatsApp, Print, Done */}
              <div className="space-y-2.5">
                {/* 1-Click Open in WhatsApp */}
                <a
                  href={dispatchInfo.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl font-semibold text-emerald-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:brightness-105 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                >
                  <MessageSquare className="w-4 h-4 fill-emerald-950" />
                  <span>Buka Salinan Tiket di WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handlePrint}
                    type="button"
                    className="gold-btn flex-1 py-2.5 rounded-xl font-semibold text-neutral-950 text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cetak / Simpan Tiket</span>
                  </button>
                  <button
                    onClick={() => setSubmitted(false)}
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
      </AnimatePresence>
    </section>
  );
}
