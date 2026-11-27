import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  ScanLine,
  Trash2,
  RefreshCw,
  Users,
  MapPin,
  Ticket,
  Clock,
  ArrowLeft,
  Phone,
  Tag,
  Bus,
  Car,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  fetchRegistrations,
  deleteRegistration,
  setCheckIn,
  setBusAttendance,
  isAdminAuthenticated,
  currentRole,
  loginAdmin,
  logoutAdmin,
} from '../utils/storage';
import { REGIONS, regionName } from '../utils/regions';
import { AFFILIATION_LABELS, withAffiliation } from '../utils/event';
import { intlPhone } from '../utils/phone';
import AccountManager from './AccountManager';
import ChangePasswordDialog from './ChangePasswordDialog';
import CheckInScanner from './CheckInScanner';
import BusData from './BusData';
import ParticipantPdf from './ParticipantPdf';
import PanelSidebar from './PanelSidebar';

const SEKRETARIAT_VIEWS = [
  { id: 'dashboard', label: 'Data Peserta', icon: Users },
  { id: 'bus', label: 'Data Bus', icon: Bus },
  { id: 'pribadi', label: 'Keberangkatan Pribadi', icon: Car },
];

export default function AdminPortal({ onBackToHome }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedKomselFilter, setSelectedKomselFilter] = useState('Semua');
  const [selectedCheckInFilter, setSelectedCheckInFilter] = useState('Semua');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'bus' | 'pribadi'
  const [printJob, setPrintJob] = useState(null); // { at, rows } while the "Export PDF" print dialog is open

  // admin only manages accounts; sekretariat gets the registrations dashboard
  const role = isAuthenticated ? currentRole() : null;

  useEffect(() => {
    if (role === 'sekretariat') {
      loadData();
    }
  }, [role]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      setRegistrations(await fetchRegistrations());
    } catch (err) {
      handleActionError(err);
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
        setIsAuthenticated(true); // the effect above loads the data
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
    setShowScanner(false);
    setUsername('');
    setPassword('');
  };

  const handleSessionExpired = (err) => {
    handleLogout();
    setLoginError(err.message);
  };

  // Changes are only shown once the server has saved them
  const handleActionError = (err) => {
    if (err.status === 401) return handleSessionExpired(err);
    window.alert(err.message);
  };

  const saveCheckIn = async (ticketId, checkedIn) => {
    const { participant: updated, alreadyCheckedIn } = await setCheckIn(ticketId, checkedIn);
    setRegistrations((list) => list.map((r) => (r.ticketId === updated.ticketId ? updated : r)));
    setSelectedParticipant((p) => (p?.ticketId === updated.ticketId ? updated : p));
    return { updated, alreadyCheckedIn };
  };

  // Sends the wanted state, not "flip", so a double tap cannot undo a check-in
  // Bus attendance on Data Bus, apart from the door check-in; sends the wanted state, not "flip"
  const handleSetBus = async (row, leg) => {
    try {
      const updated = await setBusAttendance(row.ticketId, leg, !(leg === 'berangkat' ? row.busDeparted : row.busReturned));
      setRegistrations((list) => list.map((r) => (r.ticketId === updated.ticketId ? updated : r)));
    } catch (err) {
      handleActionError(err);
    }
  };

  const handleToggleCheckIn = async (row) => {
    try {
      await saveCheckIn(row.ticketId, !row.isCheckedIn);
    } catch (err) {
      handleActionError(err);
    }
  };

  // Scanned QR: the ticket code, or the ?tiket= link on tickets issued before the scanner existed
  const handleScan = async (data) => {
    let code = data;
    try {
      code = new URL(data).searchParams.get('tiket') ?? data;
    } catch {
      // not a link: the QR is the code itself
    }
    code = code.trim().toUpperCase();

    // The server says whether this ticket was already checked in, at any desk, so a shared screenshot is caught everywhere
    try {
      const { updated, alreadyCheckedIn } = await saveCheckIn(code, true);
      if (alreadyCheckedIn) {
        const by = updated.checkedInBy ? `, oleh ${updated.checkedInBy}` : '';
        return { ok: false, text: `${updated.fullName} SUDAH check-in sebelumnya (${updated.checkedInAt}${by}).` };
      }
      return { ok: true, text: `HADIR: ${updated.fullName}` };
    } catch (err) {
      if (err.status === 401) handleSessionExpired(err);
      return { ok: false, text: err.status === 404 ? `Tiket ${code} tidak terdaftar.` : err.message };
    }
  };

  const handleDelete = async (ticketId) => {
    try {
      await deleteRegistration(ticketId);
      setRegistrations((list) => list.filter((r) => r.ticketId !== ticketId));
    } catch (err) {
      return handleActionError(err);
    } finally {
      setDeleteConfirmId(null);
    }
    if (selectedParticipant?.ticketId === ticketId) {
      setSelectedParticipant(null);
    }
  };

  // Exports what the filters currently show
  const handleExport = () => setPrintJob({ at: Date.now(), rows: filteredData });

  // Filtered registrations
  const filteredData = useMemo(() => {
    return registrations.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.fullName?.toLowerCase().includes(q) ||
        item.departureArea?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q) ||
        item.affiliation?.toLowerCase().includes(q) ||
        item.whatsapp?.toLowerCase().includes(q) ||
        item.ticketId?.toLowerCase().includes(q) ||
        item.mentorName?.toLowerCase().includes(q) ||
        item.faculty?.toLowerCase().includes(q);

      // "Alumni / Tamu" = everyone who is not a Gunadarma student: they are saved with region '-' (old data: 'alumni_tamu')
      const matchRegion =
        selectedRegion === 'all' ||
        item.region === selectedRegion ||
        (selectedRegion === 'alumni_tamu' && item.region === '-');

      // Alumni / Pengurus and Tamu are neither "Sudah" nor "Belum"
      const matchKomsel =
        selectedKomselFilter === 'Semua' ||
        (selectedKomselFilter === 'Sudah Komsel' && item.komselStatus?.includes('Sudah memiliki')) ||
        (selectedKomselFilter === 'Belum Komsel' && item.komselStatus?.includes('Belum memiliki'));

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

    // Region counts
    const regionMap = {};
    registrations.forEach((r) => {
      const reg = r.region || 'Lainnya';
      if (reg === '-') return; // not a Gunadarma student: no campus region
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
      tidakHadir: total - hadir,
      topRegion: topRegion !== '-' ? regionName(topRegion).toUpperCase() : '-',
    };
  }, [registrations]);

  return (
    <>
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.section
          key="admin-login-screen"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative min-h-[90vh] w-full flex items-center justify-center px-4 py-16 sm:py-20 z-20 transform-gpu"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-9 relative overflow-hidden border border-amber-400/30 shadow-xl sm:shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform-gpu">
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
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(255,239,210,0.25)] transform-gpu">
                <ShieldCheck className="w-7 h-7 text-amber-300" />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-300 block mb-1">
                PORTAL KHUSUS PANITIA
              </span>
              <h2 className="text-2xl font-bold font-['Cinzel'] text-gold-gradient uppercase tracking-wider">
                LOGIN NATAL 2026
              </h2>
              <p className="text-xs text-gray-400 font-light mt-1">
                Persekutuan Doa Universitas Gunadarma
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 mb-4 transform-gpu"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-username" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <input
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-xs font-semibold tracking-wider text-amber-200/90 uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <KeyRound className="w-4 h-4 text-amber-300/70" />
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-10 pr-11 py-3 bg-neutral-900/80 border border-white/10 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 px-3.5 flex items-center text-amber-300/70 hover:text-amber-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="gold-btn w-full py-3.5 rounded-xl font-semibold text-neutral-950 text-xs tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(255,239,210,0.3)] transform-gpu"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>MEMVERIFIKASI...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-neutral-950" />
                    <span>MASUK</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.section>
      ) : role === 'admin' ? (
        <AccountManager
          key="admin-accounts-screen"
          onChangePassword={() => setShowPasswordDialog(true)}
          onLogout={handleLogout}
          onAuthError={handleActionError}
        />
      ) : (
        <motion.section
          key="admin-dashboard-screen"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative min-h-screen w-full md:flex z-20 transform-gpu"
          style={{ willChange: 'transform, opacity' }}
        >
        <PanelSidebar
          items={SEKRETARIAT_VIEWS}
          current={view}
          onSelect={setView}
          onChangePassword={() => setShowPasswordDialog(true)}
          onLogout={handleLogout}
        />

        <div className="flex-1 min-w-0 px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto space-y-6">
          {view === 'bus' || view === 'pribadi' ? (
            <BusData
              key={view}
              registrations={registrations}
              departure={view === 'bus' ? 'Bersama' : 'Pribadi'}
              onSetBus={handleSetBus}
            />
          ) : (
            <>
        {/* Top Header Bar */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-amber-400/25">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-300">
                PANEL RESMI PENDATAAN NATAL 2026
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
            {/* Door check-in by camera */}
            <button
              onClick={() => setShowScanner(true)}
              type="button"
              className="gold-btn w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-neutral-950 text-xs font-semibold tracking-wider uppercase cursor-pointer"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scan QR Check-In</span>
            </button>

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
              title="Simpan data peserta (sesuai filter) sebagai PDF"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Export PDF</span>
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
                Hadir
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

          {/* Card 3: Not (yet) present */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-400/20 relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-200">
                Tidak Hadir
              </span>
              <Clock className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl sm:text-4xl font-extrabold font-mono text-amber-300">
              {stats.tidakHadir}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">Belum tercatat hadir</span>
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
                aria-label="Cari peserta"
                placeholder="Cari Nama, Status, WA, Area..."
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
                aria-label="Filter region"
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
              >
                <option value="all" className="bg-neutral-900 text-white">
                  Semua Region
                </option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                    {r.name}
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
                aria-label="Filter komsel"
                onChange={(e) => setSelectedKomselFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
              >
                <option value="Semua" className="bg-neutral-900 text-white">
                  Komsel
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
                aria-label="Filter presensi"
                onChange={(e) => setSelectedCheckInFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-900/80 border border-white/10 rounded-xl text-xs sm:text-sm text-gray-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all appearance-none cursor-pointer"
              >
                <option value="Semua" className="bg-neutral-900 text-white">
                  Presensi
                </option>
                <option value="Hadir" className="bg-neutral-900 text-white">
                  Hadir
                </option>
                <option value="Belum Hadir" className="bg-neutral-900 text-white">
                  Belum Hadir
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
              selectedRegion !== 'all' ||
              selectedKomselFilter !== 'Semua' ||
              selectedCheckInFilter !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('all');
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
                    {/* On phones only name, check-in and actions show, so the check-in button fits on screen */}
                    <th className="hidden md:table-cell py-3.5 px-4 font-semibold">No</th>
                    <th className="hidden md:table-cell py-3.5 px-4 font-semibold">Kode Tiket</th>
                    <th className="py-3.5 px-4 font-semibold">Nama & Keberangkatan</th>
                    <th className="hidden md:table-cell py-3.5 px-4 font-semibold">Kontak</th>
                    <th className="hidden md:table-cell py-3.5 px-4 font-semibold">Region & Jurusan</th>
                    <th className="hidden md:table-cell py-3.5 px-4 font-semibold text-center">Angkatan</th>
                    <th className="hidden md:table-cell py-3.5 px-4 font-semibold">Kakak Komsel</th>
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
                      <td className="hidden md:table-cell py-3.5 px-4 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="hidden md:table-cell py-3.5 px-4 font-mono font-medium text-amber-300 whitespace-nowrap">
                        {row.ticketId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{row.fullName}</div>
                        <div className="text-[11px] text-gray-400">
                          {row.gender} • {row.departure}
                          {row.departureArea !== '-' && ` (${row.departureArea})`}
                        </div>
                        <div className="md:hidden text-[11px] font-mono text-amber-300">{row.ticketId}</div>
                        {/* On phones the Angkatan column is hidden, so it sits under the name */}
                        {row.angkatan !== '-' && (
                          <div className="md:hidden text-[11px] text-gray-400">Angkatan {row.angkatan}</div>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                          <a
                            href={`https://wa.me/${intlPhone(row.whatsapp?.replace(/\D/g, '') || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-emerald-300"
                          >
                            {row.whatsapp}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] truncate max-w-[170px]">
                          <Tag className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate" title={withAffiliation(row)}>{withAffiliation(row)}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/15 text-amber-200 border border-amber-400/20 mb-1">
                          {regionName(row.region)?.toUpperCase()}
                        </span>
                        <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                          {row.faculty || '-'}
                        </div>
                      </td>
                      <td className="hidden md:table-cell py-3.5 px-4 text-center font-mono text-gray-200">{row.angkatan}</td>
                      <td className="hidden md:table-cell py-3.5 px-4">
                        {row.komselStatus?.includes('Belum memiliki') ? (
                          <span className="text-amber-300/80 italic text-[11px]">
                            Belum Komsel
                          </span>
                        ) : (
                          <span className="text-gray-200 font-medium">{row.mentorName || '-'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(row)}
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
            </>
          )}
        </div>
      </div>

      {printJob && <ParticipantPdf key={printJob.at} at={printJob.at} rows={printJob.rows} onDone={() => setPrintJob(null)} />}

      {showScanner && role === 'sekretariat' && (
        <CheckInScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* PARTICIPANT DETAIL TICKET MODAL */}
      {createPortal(
      <AnimatePresence>
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 sm:backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="glass-panel max-w-md w-full rounded-2xl p-6 relative border border-amber-400/40 my-auto shadow-xl sm:shadow-[0_0_50px_rgba(255,239,210,0.3)] transform-gpu"
              style={{ willChange: 'transform, opacity' }}
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
              <div className="rounded-xl p-4 bg-gradient-to-b from-[#012265] via-[#0d192d] to-[#480000] border border-amber-400/30 space-y-3 text-xs mb-5">
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
                    <span className="text-[10px] text-gray-400 uppercase block">Jenis Kelamin</span>
                    <span className="text-white">{selectedParticipant.gender}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">WhatsApp</span>
                    <span className="text-white">{selectedParticipant.whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Status</span>
                    <span className="text-white truncate block">{selectedParticipant.status}</span>
                  </div>
                </div>

                {AFFILIATION_LABELS[selectedParticipant.status] && (
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">
                      {AFFILIATION_LABELS[selectedParticipant.status]}
                    </span>
                    <span className="text-white">{selectedParticipant.affiliation}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Region</span>
                    <span className="text-white uppercase">{regionName(selectedParticipant.region)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Kakak Komsel</span>
                    <span className="text-white">{selectedParticipant.mentorName || '-'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Jurusan / Angkatan</span>
                    <span className="text-white">
                      {selectedParticipant.faculty || '-'}
                      {selectedParticipant.angkatan !== '-' && ` / ${selectedParticipant.angkatan}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block">Keberangkatan</span>
                    <span className="text-white">
                      {selectedParticipant.departure}
                      {selectedParticipant.departureArea !== '-' && ` (${selectedParticipant.departureArea})`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleCheckIn(selectedParticipant)}
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
      </AnimatePresence>,
      document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {createPortal(
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 sm:backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="glass-panel max-w-sm w-full rounded-2xl p-6 text-center border border-rose-500/40 my-auto shadow-xl sm:shadow-[0_0_40px_rgba(192,32,32,0.3)] transform-gpu"
              style={{ willChange: 'transform, opacity' }}
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
      </AnimatePresence>,
      document.body
      )}
        </motion.section>
      )}
    </AnimatePresence>

    {/* Admin and sekretariat both change their own password from the sidebar */}
    {showPasswordDialog && (
      <ChangePasswordDialog
        onClose={() => setShowPasswordDialog(false)}
        onAuthError={(err) => {
          setShowPasswordDialog(false);
          handleActionError(err);
        }}
      />
    )}
    </>
  );
}
