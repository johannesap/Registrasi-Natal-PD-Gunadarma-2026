import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import ChristmasNightCanvas from "./components/ChristmasNightCanvas";
import HeroSection from "./components/HeroSection";
import RegistrationSection from "./components/RegistrationSection";
import Footer from "./components/Footer";
import audioManager from "./utils/audioManager";

// Panitia screens and the QR scanner load only when the portal is opened, not for every visitor
const AdminPortal = lazy(() => import("./components/AdminPortal"));

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.hash === "#admin") return "admin";
    if (window.location.hash === "#registrasi") return "registration";
    return "hero";
  });

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
    if (window.location.hash !== "#admin") audioManager.attemptAutoplay();
  }, []);

  // The panitia page has no navbar (so no music button): stop the song there and keep it stopped
  useEffect(() => {
    if (currentPage !== "admin") return;
    audioManager.init();
    audioManager.pause();
    return audioManager.subscribe((playing) => playing && audioManager.pause());
  }, [currentPage]);

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

  return (
    <div className="relative min-h-screen w-full text-gray-100 overflow-x-clip selection:bg-amber-400/25 selection:text-amber-200 flex flex-col justify-between">
      {/* 1. CINEMATIC HIGH-PERFORMANCE BACKGROUND (GPU Optimized) */}
      <div className="fixed inset-0 pointer-events-none -z-30 overflow-hidden">
        {/* Unified multi-stop night sky gradient - 0% blur overhead, 100% GPU accelerated */}
        <div
          className="absolute inset-0"
          style={{
            // First layer paints on top: red glows at both edges like the poster's curtains, over a navy base
            background:
              'radial-gradient(circle at 0% 55%, rgba(162, 0, 0, 0.3) 0%, transparent 40%), ' +
              'radial-gradient(circle at 100% 45%, rgba(162, 0, 0, 0.3) 0%, transparent 40%), ' +
              'radial-gradient(circle at 50% 28%, rgba(255, 239, 210, 0.08) 0%, transparent 60%), ' +
              'radial-gradient(ellipse at 50% 12%, #012265 0%, #0d192d 55%, #000000 100%)',
          }}
        />

        {/* Lightweight subtle center warmth on desktop only */}
        <div
          className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-[550px] h-[380px] rounded-full opacity-25 pointer-events-none blur-3xl transform-gpu"
          style={{
            background: 'radial-gradient(circle, rgba(255, 250, 240, 0.28) 0%, rgba(255, 239, 210, 0.16) 40%, transparent 70%)',
          }}
        />

        {/* Subtle Vignette Mask */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* 2. 60FPS CANVAS (Stars, Snow, Golden Stardust) */}
      {currentPage !== "admin" && <ChristmasNightCanvas />}

      {/* 3. FLOATING NAVBAR (the panitia page has its own sidebar instead) */}
      {currentPage !== "admin" && <Navbar onNavigate={navigateTo} />}

      {/* 4. MULTI-PAGE ROUTER WITH CINEMATIC TRANSITIONS */}
      <main className="relative z-20 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentPage === "hero" && (
            <motion.div
              key="page-hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full transform-gpu"
              style={{ willChange: "transform, opacity" }}
            >
              <HeroSection onStartRegistration={() => navigateTo("registration")} />
            </motion.div>
          )}

          {currentPage === "registration" && (
            <motion.div
              key="page-registration"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full pt-16 transform-gpu"
              style={{ willChange: "transform, opacity" }}
            >
              <RegistrationSection />
            </motion.div>
          )}

          {currentPage === "admin" && (
            <motion.div
              key="page-admin"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full transform-gpu"
              style={{ willChange: "transform, opacity" }}
            >
              <Suspense fallback={null}>
                <AdminPortal onBackToHome={() => navigateTo("hero")} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. OFFICIAL FOOTER */}
      {/* The panitia portal is its own page (#admin): no public footer there */}
      {currentPage !== "admin" && <Footer />}
    </div>
  );
}
