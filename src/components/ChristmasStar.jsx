import React from 'react';
import { motion } from 'framer-motion';

export default function ChristmasStar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: -40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
      className="relative flex items-center justify-center pointer-events-none select-none"
    >
      {/* 1. Deep Celestial Warm Center Bloom */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-r from-amber-400/25 via-yellow-200/20 to-transparent blur-3xl -z-10 animate-gold-breath" />
      
      {/* 2. Soft Red & Emerald Ambient Radiance (Sacred Christmas Colors) */}
      <div className="absolute w-80 h-32 rounded-full bg-rose-600/10 blur-3xl -z-10" />
      <div className="absolute w-32 h-80 rounded-full bg-emerald-600/10 blur-3xl -z-10" />

      {/* 3. Rotating Light Rays Corona */}
      <div className="absolute w-64 h-64 sm:w-80 sm:h-80 animate-rotate-slow opacity-60">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <radialGradient id="rayGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffdf0" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#f5d061" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#d4af37" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Delicate light flares */}
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <line
              key={deg}
              x1="10"
              y1="100"
              x2="190"
              y2="100"
              stroke="url(#rayGrad)"
              strokeWidth="0.8"
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
        </svg>
      </div>

      {/* 4. Reverse Rotating Secondary Rays for shimmer depth */}
      <div className="absolute w-52 h-52 sm:w-64 sm:h-64 animate-rotate-reverse-slow opacity-40">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {[15, 45, 75, 105, 135, 165].map((deg) => (
            <line
              key={deg}
              x1="25"
              y1="100"
              x2="175"
              y2="100"
              stroke="#FFF5C0"
              strokeWidth="0.5"
              strokeDasharray="4 8"
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
        </svg>
      </div>

      {/* 5. Bethlehem 8-Point Star with Pulse Animation */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 animate-pulse-glow flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_0_25px_rgba(245,208,97,0.9)]"
        >
          <defs>
            <linearGradient id="starGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#FFF9D2" />
              <stop offset="60%" stopColor="#F5D061" />
              <stop offset="100%" stopColor="#E6B325" />
            </linearGradient>
            <radialGradient id="centerCoreGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFF2A8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F5D061" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Primary Vertical & Horizontal Rays (Long) */}
          {/* North */}
          <polygon points="100,100 97,95 100,5 103,95" fill="url(#starGoldGrad)" />
          {/* South */}
          <polygon points="100,100 97,105 100,195 103,105" fill="url(#starGoldGrad)" />
          {/* West */}
          <polygon points="100,100 95,97 5,100 95,103" fill="url(#starGoldGrad)" />
          {/* East */}
          <polygon points="100,100 105,97 195,100 105,103" fill="url(#starGoldGrad)" />

          {/* Diagonal Secondary Rays */}
          {/* NW */}
          <polygon points="100,100 97,96 35,35 96,97" fill="url(#starGoldGrad)" opacity="0.9" />
          {/* NE */}
          <polygon points="100,100 103,96 165,35 104,97" fill="url(#starGoldGrad)" opacity="0.9" />
          {/* SW */}
          <polygon points="100,100 96,103 35,165 97,104" fill="url(#starGoldGrad)" opacity="0.9" />
          {/* SE */}
          <polygon points="100,100 104,103 165,165 103,104" fill="url(#starGoldGrad)" opacity="0.9" />

          {/* Center Brilliant Core */}
          <circle cx="100" cy="100" r="16" fill="url(#centerCoreGrad)" />
          <circle cx="100" cy="100" r="5" fill="#FFFFFF" />
        </svg>
      </div>
    </motion.div>
  );
}
