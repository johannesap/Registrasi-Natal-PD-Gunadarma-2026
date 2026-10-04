import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Users,
  MapPin,
  Ticket,
  Calendar,
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  Phone,
  Mail,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  getRegistrations,
  fetchRegistrations,
  deleteRegistration,
  toggleCheckIn,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  exportRegistrationsToCSV,
} from '../utils/storage';

const REGION_OPTIONS = [
  'Semua Region',
  'Depok',
  'Kalimalang',
  'Karawaci',
  'Cengkareng',
  'Simatupang',
  'Salemba',
  'Alumni / Tamu',
];

export default function AdminPortal({ onBackToHome }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Semua Region');
  const [selectedKomselFilter, setSelectedKomselFilter] = useState('Semua');
  const [selectedCheckInFilter, setSelectedCheckInFilter] = useState('Semua');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const data = await fetchRegistrations();
      setRegistrations(data);
      setServerOnline(true);
    } catch {
      const fallback = getRegistrations();
      setRegistrations(fallback);
      setServerOnline(false);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const result = await loginAdmin(username, password);
      setIsLoggingIn(false);
      if (result.success) {
        setIsAuthenticated(true);
        await loadData();
      } else {
        setLoginError(result.message);
      }
    } catch {
      setIsLoggingIn(false);
      setLoginError('Terjadi kesalahan saat memverifikasi kredensial.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('natal2026');
    setLoginError('');
  };

  const handleToggleCheckIn = async (ticketId) => {
    const updated = await toggleCheckIn(ticketId);
    setRegistrations(updated);
  };

  const handleDelete = async (ticketId) => {
    const updated = await deleteRegistration(ticketId);
    setRegistrations(updated);
    setDeleteConfirmId(null);
    if (selectedParticipant?.ticketId === ticketId) {
      setSelectedParticipant(null);
    }
  };

  const handleExport = () => {
    exportRegistrationsToCSV(filteredData);
  };

  // Filtered registrations
  const filteredData = useMemo(() => {
    return registrations.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.fullName?.toLowerCase().includes(q) ||
        item.npm?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.whatsapp?.toLowerCase().includes(q) ||
        item.ticketId?.toLowerCase().includes(q) ||
        item.mentorName?.toLowerCase().includes(q) ||
        item.faculty?.toLowerCase().includes(q);

      const matchRegion =
        selectedRegion === 'Semua Region' ||
        item.region?.toLowerCase() === selectedRegion.toLowerCase();

      const isBelumKomsel = item.komselStatus?.includes('Belum memiliki');
      const matchKomsel =
        selectedKomselFilter === 'Semua' ||
        (selectedKomselFilter === 'Sudah Komsel' && !isBelumKomsel) ||
        (selectedKomselFilter === 'Belum Komsel' && isBelumKomsel);

      const matchCheckIn =
        selectedCheckInFilter === 'Semua' ||
        (selectedCheckInFilter === 'Hadir' && item.isCheckedIn) ||
        (selectedCheckInFilter === 'Belum Hadir' && !item.isCheckedIn);

      return matchSearch && matchRegion && matchKomsel && matchCheckIn;
    });
  }, [registrations, searchQuery, selectedRegion, selectedKomselFilter, selectedCheckInFilter]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = registrations.length;
    const hadir = registrations.filter((r) => r.isCheckedIn).length;
    const belumKomsel = registrations.filter((r) =>
      r.komselStatus?.includes('Belum memiliki')
    ).length;
    const sudahKomsel = total - belumKomsel;

    // Region counts
    const regionMap = {};
    registrations.forEach((r) => {
      const reg = r.region || 'Lainnya';
      regionMap[reg] = (regionMap[reg] || 0) + 1;
    });

    let topRegion = '-';
    let topCount = 0;
    Object.entries(regionMap).forEach(([k, v]) => {
      if (v > topCount) {
        topCount = v;
        topRegion = k;
      }
    });

    return {
      total,
      hadir,
      sudahKomsel,
      belumKomsel,
      topRegion: topRegion !== '-' ? topRegion.toUpperCase() : '-',
    };
  }, [registrations]);

  // 1. IF NOT LOGGED IN: SHOW ADMIN LOGIN CARD
  if (!isAuthenticated) {
    return (
      <section className="relative min-h-[90vh] w-full flex items-center justify-center px-4 py-20 z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-9 relative overflow-hidden border border-amber-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          {/* Top Gold Ribbon */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20" />

          {/* Back Button */}
          <button
            onClick={onBackToHome}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-amber-200/80 hover:text-white mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(245,208,97,0.25)]">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-300 block mb-1">
              PORTAL KHUSUS PANITIA
            </span>
            <h2 className="text-2xl font-bold font-['Cinzel'] text-gold-gradient uppercase tracking-wider">
              LOGIN ADMIN NATAL 2026
            </h2>
            <p className="text-xs text-gray-400 font-light mt-1">
              Persekutuan Doa Universitas Gunadarma
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 mb-4"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5">
                Username Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4 text-amber-300/70" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="gold-btn w-full py-3.5 rounded-xl font-semibold text-neutral-950 text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(245,208,97,0.3)]"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>MEMVERIFIKASI...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-neutral-950" />
                  <span>MASUK SEBAGAI ADMIN</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-6 p-3.5 rounded-xl bg-amber-950/20 border border-amber-400/20 text-xs text-gray-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Akun Demo Panitia:
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-amber-300 underline hover:text-white cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2 rounded-lg border border-white/5">
              <div>
                <span className="text-gray-400 block text-[10px]">User:</span>
                <span className="text-amber-200">admin</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Pass:</span>
                <span className="text-amber-200">natal2026</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  // 2. IF LOGGED IN: SHOW FULL ADMIN DASHBOARD
  return (
    <section className="relative min-h-screen w-full py-12 sm:py-20 px-3 sm:px-6 lg:px-8 z-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-400/25">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-300">
                PANEL RESMI KESEKRETARIATAN NATAL 2026
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                Backend API Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Cinzel'] text-gold-gradient tracking-wide uppercase">
              DATA REGISTRASI PESERTA
            </h1>
            <p className="text-xs text-gray-400 font-light">
              Persekutuan Doa Universitas Gunadarma • Live Database & Presensi Check-In
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Live Refresh Button */}
            <button
              onClick={loadData}
              type="button"
              disabled={isLoadingData}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 hover:bg-amber-500/20 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
              title="Perbarui data terbaru dari backend server"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>{isLoadingData ? 'Memuat...' : 'Refresh'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExport}
              type="button"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-600/50 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
              title="Unduh seluruh data registrasi dalam format CSV/Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export CSV/Excel</span>
            </button>

            {/* Back to Home Button */}
            <button
              onClick={onBackToHome}
              type="button"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-medium transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ke Beranda</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              type="button"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Total Registrasi */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-400/20 relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-200">
                Total Terdaftar
              </span>
              <Users className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-white">
              {stats.total}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Peserta Natal 2026</span>
          </div>

          {/* Card 2: Kehadiran / Check-in */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-400/25 relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
                Hadir (Check-In)
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-emerald-400">
              {stats.hadir}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              {stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) : 0}% Tingkat Kehadiran
            </span>
          </div>

          {/* Card 3: Komsel Ratio */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-400/20 relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-200">
                Belum Komsel
              </span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-amber-300">
              {stats.belumKomsel}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Rindu Bergabung Komsel</span>
          </div>

          {/* Card 4: Region Terbanyak */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-400/20 relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-200">
                Region Terbanyak
              </span>
              <MapPin className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xl sm:text-3xl font-extrabold font-['Cinzel'] text-white truncate">
              {stats.topRegion}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Dominasi Pendaftar</span>
          </div>
        </div>

        {/* Filter and Search Toolbar */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 border border-amber-400/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4 text-amber-300/70" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama, NPM, Email, WA..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Filter Region */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-amber-300/70" />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-neutral-900 text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {/* Filter Status Komsel */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Users className="w-3.5 h-3.5 text-amber-300/70" />
              </div>
              <select
                value={selectedKomselFilter}
                onChange={(e) => setSelectedKomselFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
              >
                <option value="Semua" className="bg-neutral-900 text-white">
                  Semua Komsel
                </option>
                <option value="Sudah Komsel" className="bg-neutral-900 text-white">
                  Sudah Memiliki Komsel
                </option>
                <option value="Belum Komsel" className="bg-neutral-900 text-white">
                  Belum Memiliki Komsel
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            {/* Filter Check-In */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300/70" />
              </div>
              <select
                value={selectedCheckInFilter}
                onChange={(e) => setSelectedCheckInFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
              >
                <option value="Semua" className="bg-neutral-900 text-white">
                  Semua Presensi
                </option>
                <option value="Hadir" className="bg-neutral-900 text-white">
                  Sudah Check-In
                </option>
                <option value="Belum Hadir" className="bg-neutral-900 text-white">
                  Belum Check-In
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>
              Menampilkan <strong className="text-amber-300">{filteredData.length}</strong> dari{' '}
              {registrations.length} peserta
            </span>
            {(searchQuery ||
              selectedRegion !== 'Semua Region' ||
              selectedKomselFilter !== 'Semua' ||
              selectedCheckInFilter !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('Semua Region');
                  setSelectedKomselFilter('Semua');
                  setSelectedCheckInFilter('Semua');
                }}
                className="text-amber-300 hover:text-white underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Data List / Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-amber-400/20">
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <Users className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-sm font-medium">Tidak ada data peserta yang cocok.</p>
              <p className="text-xs text-gray-500">
                Silakan coba ubah kata kunci pencarian atau sesuaikan filter Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-amber-200 border-b border-white/10 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">No</th>
                    <th className="py-3.5 px-4 font-semibold">Kode Tiket</th>
                    <th className="py-3.5 px-4 font-semibold">Nama & NPM</th>
                    <th className="py-3.5 px-4 font-semibold">Kontak</th>
                    <th className="py-3.5 px-4 font-semibold">Region & Jurusan</th>
                    <th className="py-3.5 px-4 font-semibold">Kakak Komsel</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Presensi</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {filteredData.map((row, idx) => (
                    <tr
                      key={row.ticketId || idx}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-amber-300">
                        {row.ticketId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{row.fullName}</div>
                        <div className="text-[11px] font-mono text-gray-400">{row.npm}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <a
                            href={`https://wa.me/${row.whatsapp?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-emerald-300"
                          >
                            {row.whatsapp}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] truncate max-w-[170px]">
                          <Mail className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate">{row.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/15 text-amber-200 border border-amber-400/20 mb-1">
                          {row.region?.toUpperCase()}
                        </span>
                        <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                          {row.faculty || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {row.mentorName === '-' ? (
                          <span className="text-amber-300/80 italic text-[11px]">
                            Belum Komsel
                          </span>
                        ) : (
                          <span className="text-gray-200 font-medium">{row.mentorName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(row.ticketId)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                            row.isCheckedIn
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                              : 'bg-neutral-800 text-gray-400 border border-white/10 hover:border-amber-400/30 hover:text-amber-200'
                          }`}
                          title="Klik untuk ubah status presensi"
                        >
                          {row.isCheckedIn ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Hadir</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span>Belum</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Ticket Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedParticipant(row)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-400/20 text-amber-300 transition-colors cursor-pointer"
                            title="Lihat Detail Tiket"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Entry */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(row.ticketId)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Data Peserta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PARTICIPANT DETAIL TICKET MODAL */}
      <AnimatePresence>
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel max-w-md w-full rounded-2xl p-6 relative border border-amber-400/40 my-auto shadow-[0_0_50px_rgba(245,208,97,0.3)]"
            >
              <button
                onClick={() => setSelectedParticipant(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                <Ticket className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold font-['Cinzel'] text-gold-gradient uppercase">
                  DETAIL TIKET RESMI PESERTA
                </h3>
              </div>

              {/* Pass Card Preview */}
              <div className="rounded-xl p-4 bg-gradient-to-b from-[#09152b] via-[#051a14] to-[#1a060d] border border-amber-400/30 space-y-3 text-xs mb-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-amber-300 font-['Cinzel']">NATAL PD UG 2026</span>
                  <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                    {selectedParticipant.isCheckedIn ? '✓ SUDAH CHECK-IN' : 'BELUM CHECK-IN'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Nama Lengkap</span>
                  <span className="text-sm font-semibold text-white">
                    {selectedParticipant.fullName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Kode Tiket</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {selectedParticipant.ticketId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">NPM</span>
                    <span className="font-mono text-white">{selectedParticipant.npm}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">WhatsApp</span>
                    <span className="text-white">{selectedParticipant.whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Email</span>
                    <span className="text-white truncate block">{selectedParticipant.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Region</span>
                    <span className="text-white uppercase">{selectedParticipant.region}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Kakak Komsel</span>
                    <span className="text-white">{selectedParticipant.mentorName || '-'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Jurusan/Fakultas</span>
                  <span className="text-white">{selectedParticipant.faculty || '-'}</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCheckIn(selectedParticipant.ticketId);
                    setSelectedParticipant((prev) => ({
                      ...prev,
                      isCheckedIn: !prev.isCheckedIn,
                    }));
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                    selectedParticipant.isCheckedIn
                      ? 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                      : 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                  }`}
                >
                  {selectedParticipant.isCheckedIn ? 'Batalkan Check-In' : 'Tandai Hadir (Check-In)'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel max-w-sm w-full rounded-2xl p-6 text-center border border-rose-500/40 my-auto shadow-[0_0_40px_rgba(244,63,94,0.3)]"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white uppercase font-['Cinzel'] mb-1">
                Hapus Data Peserta?
              </h4>
              <p className="text-xs text-gray-300 font-light mb-5">
                Tindakan ini akan menghapus data pendaftaran secara permanen dari basis data.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs tracking-wider uppercase cursor-pointer"
                >
                  Ya, Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs tracking-wider uppercase cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
