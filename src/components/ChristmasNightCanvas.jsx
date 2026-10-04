import React, { useEffect, useRef } from 'react';

export default function ChristmasNightCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const isMobile = width < 768;

    // Mobile performance tuning:
    // Cap devicePixelRatio to 1.25 on mobile to avoid 4.5M pixel fill rate choking mobile GPU
    const dpr = isMobile
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : Math.min(window.devicePixelRatio || 1, 1.75);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    // Reduced particle counts tailored for buttery smooth 60fps on mobile
    const snowCount = isMobile ? 24 : 70;
    const starCount = isMobile ? 40 : 120;
    const dustCount = isMobile ? 14 : 45;

    // =========================================================================
    // GPU SPRITE CACHE: Pre-render glow gradients ONCE on tiny offscreen canvases
    // Replaces hundreds of runtime ctx.createRadialGradient() calls per frame!
    // =========================================================================
    const emberSprite = document.createElement('canvas');
    emberSprite.width = 32;
    emberSprite.height = 32;
    const eCtx = emberSprite.getContext('2d');
    const eGrad = eCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    eGrad.addColorStop(0, 'rgba(255, 245, 180, 0.95)');
    eGrad.addColorStop(0.35, 'rgba(245, 208, 97, 0.45)');
    eGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    eCtx.fillStyle = eGrad;
    eCtx.beginPath();
    eCtx.arc(16, 16, 16, 0, Math.PI * 2);
    eCtx.fill();

    const snowSprite = document.createElement('canvas');
    snowSprite.width = 24;
    snowSprite.height = 24;
    const sCtx = snowSprite.getContext('2d');
    const sGrad = sCtx.createRadialGradient(12, 12, 0, 12, 12, 12);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sGrad.addColorStop(0.5, 'rgba(220, 240, 255, 0.35)');
    sGrad.addColorStop(1, 'rgba(200, 225, 255, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.beginPath();
    sCtx.arc(12, 12, 12, 0, Math.PI * 2);
    sCtx.fill();

    // 1. Initialize Stars
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.3 + 0.4,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinkleSpeed: Math.random() * 0.02 + 0.006,
      phase: Math.random() * Math.PI * 2,
    }));

    // 2. Initialize Snowflakes
    const snowflakes = Array.from({ length: snowCount }, () => {
      const isSoft = Math.random() > 0.65;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        isSoft,
        radius: isSoft ? Math.random() * 2.2 + 1.2 : Math.random() * 1.4 + 0.7,
        speedY: Math.random() * 0.65 + 0.35,
        speedX: Math.random() * 0.3 - 0.15,
        swaySpeed: Math.random() * 0.012 + 0.004,
        swayPhase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.4 + 0.35,
      };
    });

    // 3. Initialize Golden Dust
    const goldenDust = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3.5 + 2.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      speedX: Math.random() * 0.25 - 0.12,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.025 + 0.008,
      alpha: Math.random() * 0.5 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // --- A. BATCH DRAW STARS (Single Path Call for Maximum Performance) ---
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.phase += s.twinkleSpeed;
        const currentAlpha = s.baseAlpha + Math.sin(s.phase) * 0.25;
        if (currentAlpha > 0.15) {
          ctx.moveTo(s.x + s.size, s.y);
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        }
      }
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // --- B. DRAW GOLDEN EMBERS VIA PRE-RENDERED GPU SPRITE (Blazing Fast) ---
      for (let i = 0; i < goldenDust.length; i++) {
        const p = goldenDust[i];
        p.phase += p.pulseSpeed;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.phase * 0.5) * 0.15;

        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentAlpha));
        const r = p.radius;
        ctx.drawImage(emberSprite, p.x - r, p.y - r, r * 2, r * 2);
      }

      // --- C. DRAW SNOWFLAKES (Batched crisp snow + Sprited soft snow) ---
      // 1. Soft foreground snow using sprite
      for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];
        flake.swayPhase += flake.swaySpeed;
        flake.y += flake.speedY;
        flake.x += flake.speedX + Math.sin(flake.swayPhase) * 0.35;

        if (flake.y > height + 15) {
          flake.y = -10;
          flake.x = Math.random() * width;
        }
        if (flake.x < -15) flake.x = width + 15;
        if (flake.x > width + 15) flake.x = -15;

        if (flake.isSoft) {
          ctx.globalAlpha = flake.opacity;
          const r = flake.radius * 2;
          ctx.drawImage(snowSprite, flake.x - r, flake.y - r, r * 2, r * 2);
        }
      }

      // 2. Crisp snowflakes in single batched fill
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];
        if (!flake.isSoft) {
          ctx.moveTo(flake.x + flake.radius, flake.y);
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        }
      }
      ctx.globalAlpha = 0.75;
      ctx.fill();

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full transform-gpu"
      style={{ willChange: 'contents' }}
    />
  );
}
