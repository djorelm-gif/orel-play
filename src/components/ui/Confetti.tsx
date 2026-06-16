'use client';

import { useEffect, useRef } from 'react';

// Premium confetti — gold-only palette (no neon), three particle types, two
// side cannons firing toward each other + a soft top rain. Each foil flake
// fakes a 3D flip by scaling vertically with cos(flipAngle), so the surface
// catches light like real metallic confetti.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  // RGB triplet so we can fade with alpha without re-parsing colour strings.
  rgb: string;
  type: 'foil' | 'ribbon' | 'sparkle';
  rot: number;
  vrot: number;
  flip: number;
  vflip: number;
  life: number;
  maxLife: number;
}

// Three hues of gold + white sparkle. No magenta, no green — the previous
// rainbow palette read as a kids' party-popper.
const PALETTE = [
  '255, 247, 220', // champagne white-gold
  '255, 232, 170', // gold-light
  '232, 196, 102', // bright gold
  '216, 168, 78', // brand gold
  '184, 134, 56', // deep gold
];
const SPARKLE_RGB = '255, 252, 235';

function pushBurst(
  particles: Particle[],
  originX: number,
  originY: number,
  angleRad: number,
  spreadRad: number,
  speedMin: number,
  speedMax: number,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = angleRad + (Math.random() - 0.5) * spreadRad;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const r = Math.random();
    const type: Particle['type'] = r < 0.62 ? 'foil' : r < 0.86 ? 'ribbon' : 'sparkle';
    const rgb = type === 'sparkle' ? SPARKLE_RGB : PALETTE[Math.floor(Math.random() * PALETTE.length)];
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size:
        type === 'sparkle'
          ? 2 + Math.random() * 3
          : type === 'ribbon'
            ? 4 + Math.random() * 6
            : 6 + Math.random() * 10,
      rgb,
      type,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.4,
      flip: Math.random() * Math.PI * 2,
      vflip: 0.18 + Math.random() * 0.28,
      life: 0,
      maxLife: 200 + Math.random() * 240,
    });
  }
}

export function Confetti({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: Particle[] = [];

    // Three staggered bursts spaced ~250ms apart for a proper "celebrate" feel.
    // Left cannon shoots up + slightly right; right cannon mirrors. Top rain
    // adds the long tail that drifts down after the sides finish.
    const fireBurst = (wave: number) => {
      const baseSpeed = 16 - wave * 2;
      const sideCount = 80;
      const topCount = 40;
      // Left side cannon — angle = -π/3 (up + 60° toward right).
      pushBurst(particles, -10, H + 10, -Math.PI / 3, Math.PI / 5, baseSpeed, baseSpeed + 8, sideCount);
      // Right side cannon — angle = -2π/3 (up + 60° toward left).
      pushBurst(particles, W + 10, H + 10, -Math.PI + Math.PI / 3, Math.PI / 5, baseSpeed, baseSpeed + 8, sideCount);
      // Soft rain from above — gentle downward velocity, wide spread.
      pushBurst(particles, W * 0.5, -20, Math.PI / 2, Math.PI / 1.2, 1, 4, topCount);
    };

    fireBurst(0);
    const t1 = window.setTimeout(() => fireBurst(1), 240);
    const t2 = window.setTimeout(() => fireBurst(2), 520);

    let stop = false;
    const tick = () => {
      if (stop) return;
      // Clear with a slight fade to leave a faint glow trail under the gold.
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of particles) {
        p.life += 1;
        p.vy += 0.16; // gravity
        p.vx *= 0.996; // air drag
        p.vy *= 0.997;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.flip += p.vflip;

        if (p.y > H + 80 || p.life > p.maxLife) continue;
        alive++;

        const opacity = Math.max(0, 1 - p.life / p.maxLife);
        // Fake 3D flip: surface area visible to camera scales with |cos(flip)|.
        // When the flake is edge-on it almost disappears (sparkle effect).
        const flipScale = Math.abs(Math.cos(p.flip));
        const brightness = 0.35 + 0.65 * flipScale;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (p.type === 'foil') {
          // Thin metallic flake — wider than tall, scaled vertically by flip.
          const w = p.size;
          const h = p.size * 0.6 * flipScale + 0.5;
          // Drop shadow beneath the flake.
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.25})`;
          ctx.fillRect(-w / 2 + 1, -h / 2 + 1, w, h);
          // Main face — bright when facing camera.
          ctx.fillStyle = `rgba(${p.rgb}, ${opacity * brightness})`;
          ctx.fillRect(-w / 2, -h / 2, w, h);
          // Top-edge highlight band (gives the foil look).
          ctx.fillStyle = `rgba(255, 252, 235, ${opacity * brightness * 0.6})`;
          ctx.fillRect(-w / 2, -h / 2, w, Math.max(0.6, h * 0.18));
        } else if (p.type === 'ribbon') {
          // Long thin strip — feels like curling ribbon.
          const h = p.size * 2.4 * flipScale + 0.5;
          const w = 1.6;
          ctx.fillStyle = `rgba(${p.rgb}, ${opacity * brightness})`;
          ctx.fillRect(-w / 2, -h / 2, w, h);
        } else {
          // Sparkle — small circle with a radial soft glow.
          const r = p.size * (0.6 + flipScale * 0.4);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
          grad.addColorStop(0, `rgba(${SPARKLE_RGB}, ${opacity})`);
          grad.addColorStop(0.45, `rgba(255, 232, 170, ${opacity * 0.55})`);
          grad.addColorStop(1, 'rgba(255, 232, 170, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
      if (alive > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stop = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ctx.clearRect(0, 0, W, H);
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden
    />
  );
}
