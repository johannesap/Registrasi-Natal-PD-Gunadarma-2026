import React from 'react';
import { motion } from 'framer-motion';

export default function TreeSilhouette() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 0.85, y: 0 }}
      transition={{ duration: 3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 sm:h-96 pointer-events-none select-none -z-10 flex items-end justify-center overflow-hidden"
    >
      {/* Ambient Forest Mist & Emerald Glow */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#02040a] via-[#021811]/30 to-transparent" />
      <div className="absolute bottom-4 w-96 h-40 bg-emerald-900/15 rounded-full blur-3xl" />

      {/* Minimalist Sacred Christmas Tree Outline in Fine Gold & Emerald Glow */}
      <svg
        viewBox="0 0 400 350"
        className="w-full max-w-lg h-auto opacity-35 filter drop-shadow-[0_0_15px_rgba(234,179,8,0.25)]"
      >
        <defs>
          <linearGradient id="treeGoldStroke" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#ca8a04" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#052e24" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="treeFillGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#064e3b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Minimalist Multi-tiered Geometric Pine Structure */}
        {/* Tier 1 (Top) */}
        <polygon
          points="200,60 170,120 230,120"
          fill="url(#treeFillGrad)"
          stroke="url(#treeGoldStroke)"
          strokeWidth="1.2"
        />

        {/* Tier 2 (Upper Mid) */}
        <polygon
          points="200,105 150,175 250,175"
          fill="url(#treeFillGrad)"
          stroke="url(#treeGoldStroke)"
          strokeWidth="1.2"
        />

        {/* Tier 3 (Lower Mid) */}
        <polygon
          points="200,160 125,240 275,240"
          fill="url(#treeFillGrad)"
          stroke="url(#treeGoldStroke)"
          strokeWidth="1.2"
        />

        {/* Tier 4 (Base) */}
        <polygon
          points="200,225 100,315 300,315"
          fill="url(#treeFillGrad)"
          stroke="url(#treeGoldStroke)"
          strokeWidth="1.2"
        />

        {/* Trunk stem */}
        <rect
          x="193"
          y="315"
          width="14"
          height="30"
          fill="url(#treeFillGrad)"
          stroke="url(#treeGoldStroke)"
          strokeWidth="0.8"
        />

        {/* Delicate Golden Bokeh on Pine Vertices */}
        {[
          { cx: 200, cy: 60, r: 2.5 },
          { cx: 170, cy: 120, r: 1.8 },
          { cx: 230, cy: 120, r: 1.8 },
          { cx: 150, cy: 175, r: 2 },
          { cx: 250, cy: 175, r: 2 },
          { cx: 125, cy: 240, r: 2.2 },
          { cx: 275, cy: 240, r: 2.2 },
          { cx: 100, cy: 315, r: 2.5 },
          { cx: 300, cy: 315, r: 2.5 },
          // Gentle interior lights
          { cx: 200, cy: 140, r: 1.5 },
          { cx: 185, cy: 205, r: 1.8 },
          { cx: 215, cy: 210, r: 1.8 },
          { cx: 170, cy: 275, r: 1.6 },
          { cx: 230, cy: 280, r: 1.6 },
        ].map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.cx}
            cy={pt.cy}
            r={pt.r}
            fill="#FFF9D2"
            className="animate-pulse"
            style={{ animationDelay: `${idx * 0.25}s`, animationDuration: '3s' }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
