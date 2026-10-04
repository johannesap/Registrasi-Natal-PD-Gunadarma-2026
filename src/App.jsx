import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import ChristmasNightCanvas from "./components/ChristmasNightCanvas";
import HeroSection from "./components/HeroSection";
import RegistrationSection from "./components/RegistrationSection";
import AdminPortal from "./components/AdminPortal";
import Footer from "./components/Footer";
import audioManager from "./utils/audioManager";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.hash === "#admin") return "admin";
    if (window.location.hash === "#registrasi") return "registration";
    return "hero";
  });
  const [openingKey, setOpeningKey] = useState(0);

  // Sync with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        setCurrentPage("admin");
      } else if (window.location.hash === "#registrasi") {
        setCurrentPage("registration");
      } else {
        setCurrentPage("hero");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Immediate autoplay on opening web
  useEffect(() => {
    audioManager.attemptAutoplay();
  }, []);

  const navigateTo = (page) => {
    if (page === "admin") {
      window.location.hash = "#admin";
      setCurrentPage("admin");
    } else if (page === "registration") {
      window.location.hash = "#registrasi";
      setCurrentPage("registration");
    } else {
      window.location.hash = "";
      setCurrentPage("hero");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReplayOpening = () => {
    navigateTo("hero");
    setOpeningKey((prev) => prev + 1);
    audioManager.restart();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#02040a] text-gray-100 overflow-x-hidden selection:bg-amber-400/25 selection:text-amber-200 flex flex-col justify-between">
      {/* 1. CINEMATIC HIGH-PERFORMANCE BACKGROUND (GPU Optimized) */}
      <div className="fixed inset-0 pointer-events-none -z-30 overflow-hidden">
        {/* Unified multi-stop night sky gradient - 0% blur overhead, 100% GPU accelerated */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 12%, rgba(12, 35, 64, 0.75) 0%, rgba(3, 13, 29, 0.85) 45%, #02040a 100%), ' +
              'radial-gradient(circle at 15% 40%, rgba(6, 61, 46, 0.35) 0%, transparent 50%), ' +
              'radial-gradient(circle at 85% 55%, rgba(56, 8, 22, 0.3) 0%, transparent 50%), ' +
              'radial-gradient(circle at 50% 28%, rgba(245, 208, 97, 0.12) 0%, transparent 60%)',
          }}
        />

        {/* Lightweight subtle center warmth on desktop only */}
        <div
          className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-[550px] h-[380px] rounded-full opacity-25 pointer-events-none blur-3xl transform-gpu"
          style={{
            background: 'radial-gradient(circle, rgba(254, 243, 199, 0.3) 0%, rgba(245, 208, 97, 0.15) 40%, transparent 70%)',
          }}
        />

        {/* Subtle Vignette Mask */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* 2. 60FPS CANVAS (Stars, Snow, Golden Stardust) */}
      <ChristmasNightCanvas />

      {/* 3. FLOATING NAVBAR */}
      <Navbar currentPage={currentPage} onNavigate={navigateTo} onReplayOpening={handleReplayOpening} />

      {/* 4. MULTI-PAGE ROUTER WITH CINEMATIC TRANSITIONS */}
      <main className="relative z-20 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentPage === "hero" && (
            <motion.div
              key={`page-hero-${openingKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full"
            >
              <HeroSection key={openingKey} openingKey={openingKey} onStartRegistration={() => navigateTo("registration")} />
            </motion.div>
          )}

          {currentPage === "registration" && (
            <motion.div
              key="page-registration"
              initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full pt-16"
            >
              <RegistrationSection onBackToHero={() => navigateTo("hero")} />
            </motion.div>
          )}

          {currentPage === "admin" && (
            <motion.div
              key="page-admin"
              initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full pt-16"
            >
              <AdminPortal onBackToHome={() => navigateTo("hero")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. OFFICIAL FOOTER */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}
