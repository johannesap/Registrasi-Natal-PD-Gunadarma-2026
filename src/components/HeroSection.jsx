import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Calendar, MapPin } from 'lucide-react';
import ChristmasStar from './ChristmasStar';
import TreeSilhouette from './TreeSilhouette';

export default function HeroSection({
  onStartRegistration,
  openingKey = 0,
}) {
  const [openingComplete, setOpeningComplete] = useState(false);
  const [isLightSweeping, setIsLightSweeping] = useState(false);

  // Opening sequence finishes after ~4 seconds
  useEffect(() => {
    setOpeningComplete(false);
    const timer = setTimeout(() => {
      setOpeningComplete(true);
    }, 4200);

    return () => clearTimeout(timer);
  }, [openingKey]);

  const handleStartRegistration = () => {
    setIsLightSweeping(true);
    setTimeout(() => {
      onStartRegistration();
      setTimeout(() => setIsLightSweeping(false), 800);
    }, 450);
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 sm:px-6 pt-24 sm:pt-28 pb-8 overflow-hidden select-none">
      {/* Cinematic Center Radiant Warm Aura (GPU Optimized) */}
      <motion.div
        key={`aura-${openingKey}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: 'easeOut', delay: 0.2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[320px] sm:h-[600px] rounded-full pointer-events-none -z-10 transform-gpu"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 208, 97, 0.16) 0%, rgba(220, 38, 38, 0.06) 40%, transparent 70%)',
          willChange: 'opacity, transform',
        }}
      />

      {/* Christmas Tree Silhouette Backdrop */}
      <TreeSilhouette />

      {/* Light Sweep Cinematic Transition Overlay */}
      <AnimatePresence>
        {isLightSweeping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.8, 1.3, 1.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-radial from-amber-100 via-amber-300/40 to-transparent transform-gpu"
          />
        )}
      </AnimatePresence>

      {/* Main Center Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto text-center w-full z-20 my-auto">
        {/* 1. Christmas Star */}
        <div className="mb-2 sm:mb-4 transform-gpu">
          <ChristmasStar />
        </div>

        {/* 2. Official Badge */}
        <motion.div
          key={`badge-${openingKey}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-3 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium text-amber-200/90 border border-amber-400/25 bg-amber-950/20 backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.15)] transform-gpu"
          style={{ willChange: 'transform, opacity' }}
        >
          <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Ibadah & Perayaan Natal 2026</span>
          <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
        </motion.div>

        {/* 3. "NATAL" - Largest text with GPU-accelerated smooth scale + opacity */}
        <motion.div
          key={`natal-${openingKey}`}
          initial={{
            opacity: 0,
            scale: 0.9,
            y: 12,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 1.2,
            delay: 1.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative px-2 transform-gpu"
          style={{ willChange: 'transform, opacity' }}
        >
          <h1
            className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-extrabold tracking-wide sm:tracking-wider font-['Cinzel'] leading-none text-gold-gradient uppercase py-1 select-none"
            style={{
              textShadow:
                '0 0 20px rgba(254, 240, 138, 0.35), 0 0 50px rgba(234, 179, 8, 0.2)',
            }}
          >
            NATAL
          </h1>

          {/* Underline subtle light bar */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.8 }}
            transition={{ duration: 1.0, delay: 1.5, ease: 'easeOut' }}
            className="h-[1.5px] w-32 sm:w-60 md:w-80 mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-300 to-transparent transform-gpu"
            style={{ willChange: 'transform, opacity' }}
          />
        </motion.div>

        {/* 4. "PERSEKUTUAN DOA" - Smooth Hardware-Accelerated Animation */}
        <motion.h2
          key={`pd-${openingKey}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.0,
            delay: 1.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[0.14em] sm:tracking-[0.2em] uppercase text-white font-['Cinzel'] mt-2.5 sm:mt-4 px-2 transform-gpu"
          style={{
            textShadow: '0 0 15px rgba(255, 255, 255, 0.35)',
            willChange: 'transform, opacity',
          }}
        >
          PERSEKUTUAN DOA
        </motion.h2>

        {/* 5. "UNIVERSITAS GUNADARMA" - Sophisticated Letter Spacing without relayout */}
        <motion.p
          key={`ug-${openingKey}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.0,
            delay: 2.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-[11px] sm:text-xs md:text-sm lg:text-base font-light text-amber-100/90 uppercase font-sans mt-1.5 sm:mt-2 tracking-[0.25em] sm:tracking-[0.35em] px-2 transform-gpu"
          style={{ willChange: 'transform, opacity' }}
        >
          UNIVERSITAS GUNADARMA
        </motion.p>

        {/* 6. TAGLINE: "Merayakan Kasih, Menyalakan Harapan" */}
        <motion.div
          key={`tagline-${openingKey}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.4,
            delay: 3.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-5 sm:mt-7 max-w-xl mx-auto px-4"
        >
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-['Cormorant_Garamond'] italic font-normal tracking-wide text-amber-200/90 leading-relaxed">
            &ldquo;Merayakan Kasih, Menyalakan Harapan&rdquo;
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-light mt-1 tracking-normal sm:tracking-wider">
            &ldquo;Terang itu bercahaya di dalam kegelapan dan kegelapan itu tidak menguasainya.&rdquo; — Yohanes 1:5
          </p>
        </motion.div>

        {/* 7. CTA BUTTON: "MULAI REGISTRASI" */}
        <motion.div
          key={`cta-${openingKey}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 1.2,
            delay: 3.9,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4"
        >
          <button
            onClick={handleStartRegistration}
            type="button"
            className="gold-btn group w-full max-w-xs sm:max-w-none sm:w-auto px-7 sm:px-11 py-3.5 sm:py-4.5 rounded-full font-sans font-semibold text-neutral-950 text-xs sm:text-base tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2.5 sm:gap-3 shadow-[0_0_30px_rgba(245,208,97,0.45)] hover:shadow-[0_0_50px_rgba(245,208,97,0.8)]"
          >
            <Sparkles className="w-4 h-4 text-amber-950 transition-transform group-hover:rotate-45 shrink-0" />
            <span>MULAI REGISTRASI</span>
            <span className="w-2 h-2 rounded-full bg-amber-950/70 group-hover:scale-150 transition-transform shrink-0" />
          </button>
        </motion.div>

        {/* Quick Event Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 4.2 }}
          className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-[11px] sm:text-xs text-gray-400/90 tracking-wider font-light px-2"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
            <span>Desember 2026</span>
          </div>
          <div className="hidden sm:inline w-1 h-1 rounded-full bg-amber-400/40" />
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
            <span>Auditorium Universitas Gunadarma</span>
          </div>
        </motion.div>
      </div>

      {/* 8. INDICATOR TO REGISTRATION PAGE */}
      <motion.div
        key={`scroll-${openingKey}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: openingComplete ? 1 : 0.8, y: 0 }}
        transition={{ duration: 1, delay: 4.3 }}
        onClick={handleStartRegistration}
        className="z-20 mt-6 flex flex-col items-center justify-center cursor-pointer group hover:text-amber-200 transition-colors"
      >
        <span className="text-[11px] sm:text-xs font-light tracking-[0.25em] uppercase text-gray-400 group-hover:text-amber-300 transition-colors">
          Buka Halaman Registrasi
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="mt-1.5 text-amber-400/80 group-hover:text-amber-300"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
