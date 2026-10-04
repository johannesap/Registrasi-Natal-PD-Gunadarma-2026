import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import ChristmasNightCanvas from "./components/ChristmasNightCanvas";
import HeroSection from "./components/HeroSection";
import RegistrationSection from "./components/RegistrationSection";
import AdminPortal from "./components/AdminPortal";
import Footer from "./components/Footer";

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
  };

  return (
    <div className="relative min-h-screen w-full bg-[#02040a] text-gray-100 overflow-x-hidden selection:bg-amber-400/25 selection:text-amber-200 flex flex-col justify-between">
      {/* 1. CINEMATIC PERSISTENT BACKGROUND ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none -z-30 overflow-hidden">
        {/* Base dark night gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 15%, #071938 0%, #031c15 35%, #1f050e 70%, #02040a 100%)",
          }}
        />

        {/* Deep Navy Atmosphere (Upper Night Sky) */}
        <div
          className="absolute -top-32 left-1/4 w-[600px] h-[500px] rounded-full blur-[130px] opacity-45 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #0c2340 0%, #030d1d 70%, transparent 100%)",
          }}
        />

        {/* Sacred Dark Pine / Emerald Atmosphere */}
        <div
          className="absolute top-1/3 -left-20 w-[550px] h-[550px] rounded-full blur-[140px] opacity-35 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #063d2e 0%, #021a13 70%, transparent 100%)",
          }}
        />

        {/* Deep Maroon / Burgundy Atmosphere */}
        <div
          className="absolute top-1/2 -right-24 w-[600px] h-[600px] rounded-full blur-[140px] opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #380816 0%, #1a030a 70%, transparent 100%)",
          }}
        />

        {/* Center Warm Gold & Warm White Radiance */}
        <div
          className="absolute top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(254, 243, 199, 0.25) 0%, rgba(245, 208, 97, 0.15) 30%, rgba(220, 38, 38, 0.08) 60%, transparent 80%)",
          }}
        />

        {/* Subtle Vignette Edge Mask */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none" />
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
