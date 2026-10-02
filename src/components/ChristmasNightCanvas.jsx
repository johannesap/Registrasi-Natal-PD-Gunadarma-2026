import React, { useEffect, useRef } from 'react';

export default function ChristmasNightCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = window.innerWidth < 768;
    const snowCount = isMobile ? 45 : 110;
    const starCount = isMobile ? 70 : 160;
    const dustCount = isMobile ? 35 : 75;

    // Handle high DPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize Stars
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? '#ffffff' : Math.random() > 0.5 ? '#fde047' : '#93c5fd',
    }));

    // Initialize Snowflakes with depth (z: 1 to 3)
    const snowflakes = Array.from({ length: snowCount }, () => {
      const z = Math.random() * 2 + 1; // 1 = far, 3 = near
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: (Math.random() * 1.8 + 0.8) * (z / 2),
        speedY: (Math.random() * 0.7 + 0.4) * (z / 1.5),
        speedX: Math.random() * 0.4 - 0.2,
        swaySpeed: Math.random() * 0.015 + 0.005,
        swayRange: Math.random() * 25 + 10,
        swayPhase: Math.random() * Math.PI * 2,
        opacity: (Math.random() * 0.5 + 0.25) * (z / 2.5),
      };
    });

    // Initialize Golden Dust Particles (glowing floating embers)
    const goldenDust = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.35 + 0.1), // gently rising
      speedX: Math.random() * 0.3 - 0.15,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
      glow: Math.random() * 8 + 4,
    }));

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Twinkling Stars (No mouse movement shift)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.phase += s.twinkleSpeed;
        const currentAlpha = s.baseAlpha + Math.sin(s.phase) * 0.3;
        const clampedAlpha = Math.max(0.1, Math.min(1, currentAlpha));

        const posX = (s.x + width) % width;
        const posY = (s.y + height) % height;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = clampedAlpha;
        ctx.beginPath();
        ctx.arc(posX, posY, s.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra twinkle rays for brightest stars
        if (s.size > 1.4 && clampedAlpha > 0.6) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(posX - s.size * 2, posY);
          ctx.lineTo(posX + s.size * 2, posY);
          ctx.moveTo(posX, posY - s.size * 2);
          ctx.lineTo(posX, posY + s.size * 2);
          ctx.stroke();
        }
      }

      // 2. Draw Golden Stardust / Embers (No mouse movement shift)
      for (let i = 0; i < goldenDust.length; i++) {
        const p = goldenDust[i];
        p.phase += p.pulseSpeed;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.phase * 0.5) * 0.2;

        if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
        const posX = p.x;
        const posY = p.y;

        // Glowing core
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        const gradient = ctx.createRadialGradient(posX, posY, 0, posX, posY, p.glow);
        gradient.addColorStop(0, 'rgba(255, 245, 180, 0.9)');
        gradient.addColorStop(0.3, 'rgba(245, 208, 97, 0.4)');
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(posX, posY, p.glow, 0, Math.PI * 2);
        ctx.fill();

        // Sharp bright center
        ctx.fillStyle = '#fffdf0';
        ctx.beginPath();
        ctx.arc(posX, posY, p.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw Soft Falling Snow (No mouse movement shift)
      for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];
        flake.swayPhase += flake.swaySpeed;
        flake.y += flake.speedY;
        flake.x += flake.speedX + Math.sin(flake.swayPhase) * 0.5;

        // Wrap around borders
        if (flake.y > height + 10) {
          flake.y = -10;
          flake.x = Math.random() * width;
        }
        if (flake.x < -20) flake.x = width + 20;
        if (flake.x > width + 20) flake.x = -20;

        const posX = flake.x;
        const posY = flake.y;

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, flake.opacity));

        if (flake.z > 2.2) {
          // Foreground fluffy soft snow
          const glowGrad = ctx.createRadialGradient(posX, posY, 0, posX, posY, flake.radius * 2);
          glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          glowGrad.addColorStop(0.5, 'rgba(235, 245, 255, 0.3)');
          glowGrad.addColorStop(1, 'rgba(200, 225, 255, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(posX, posY, flake.radius * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Mid & background crisp snow
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(posX, posY, flake.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
    />
  );
}
