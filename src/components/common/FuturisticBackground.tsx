import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Cpu,
  Radio,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Magnet,
  Eye,
  EyeOff,
} from 'lucide-react';

export type BackgroundMode = 'mesh' | 'radar' | 'stream';
export type BackgroundIntensity = 'subtle' | 'balanced' | 'cyber';

interface NodePoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  hue: number;
  pulsePhase: number;
  pulseSpeed: number;
  label?: string;
}

interface DataPacket {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: string;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface StreamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  history: { x: number; y: number }[];
  maxHistory: number;
  alpha: number;
  color: string;
}

const ZONE_TAGS = [
  'ARSI', 'BALE', 'E.SHEWA', 'W.SHEWA', 'JIMMA', 'ILU.ABA', 
  'E.HARARGHE', 'W.HARARGHE', 'BORENA', 'GUJI', 'KELEM', 'H.GUDURU'
];

interface FuturisticBackgroundProps {
  isDarkMode?: boolean;
}

export const FuturisticBackground: React.FC<FuturisticBackgroundProps> = ({ isDarkMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // User preferences with LocalStorage fallback
  const [mode, setMode] = useState<BackgroundMode>(() => {
    const saved = localStorage.getItem('oromia_bg_mode');
    return (saved as BackgroundMode) || 'mesh';
  });

  const [intensity, setIntensity] = useState<BackgroundIntensity>(() => {
    const saved = localStorage.getItem('oromia_bg_intensity');
    return (saved as BackgroundIntensity) || 'balanced';
  });

  const [isInteractive, setIsInteractive] = useState<boolean>(() => {
    const saved = localStorage.getItem('oromia_bg_interactive');
    return saved !== null ? saved === 'true' : true;
  });

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem('oromia_bg_visible');
    return saved !== null ? saved === 'true' : true;
  });

  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(false);

  // Mouse telemetry state
  const mouseRef = useRef<{
    x: number;
    y: number;
    isActive: boolean;
    lastActive: number;
  }>({
    x: -9999,
    y: -9999,
    isActive: false,
    lastActive: 0,
  });

  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Save changes
  useEffect(() => {
    localStorage.setItem('oromia_bg_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('oromia_bg_intensity', intensity);
  }, [intensity]);

  useEffect(() => {
    localStorage.setItem('oromia_bg_interactive', String(isInteractive));
  }, [isInteractive]);

  useEffect(() => {
    localStorage.setItem('oromia_bg_visible', String(isVisible));
  }, [isVisible]);

  // Window pointer listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isActive = true;
      mouseRef.current.lastActive = performance.now();
    };

    const handlePointerLeave = () => {
      mouseRef.current.isActive = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  // Update cursor telemetry readout every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (mouseRef.current.isActive) {
        setCursorCoords({
          x: Math.round(mouseRef.current.x),
          y: Math.round(mouseRef.current.y),
        });
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Shockwave trigger on click/tap
  const triggerShockwave = useCallback((x: number, y: number) => {
    // Add ripple
    window.dispatchEvent(
      new CustomEvent('futuristic-bg-click', { detail: { x, y } })
    );
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Don't trigger if clicked on HUD control itself
      const target = e.target as HTMLElement | null;
      if (target?.closest('#futuristic-hud-control')) return;
      triggerShockwave(e.clientX, e.clientY);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [triggerShockwave]);

  // Main Canvas Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Dynamic config according to intensity
    const intensityMultiplier =
      intensity === 'subtle' ? 0.45 : intensity === 'cyber' ? 1.4 : 1.0;

    const nodeCount = Math.floor(
      (window.innerWidth < 768 ? 32 : 65) * (intensity === 'subtle' ? 0.7 : intensity === 'cyber' ? 1.25 : 1)
    );

    // Initial node cloud
    const nodes: NodePoint[] = [];
    const shockwaves: Shockwave[] = [];
    const packets: DataPacket[] = [];
    const streamParticles: StreamParticle[] = [];

    // Radar scan state
    let radarAngle = 0;

    // Resize handling
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Spawn nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45 * intensityMultiplier,
        vy: (Math.random() - 0.5) * 0.45 * intensityMultiplier,
        radius: Math.random() * 2.2 + 1.2,
        baseAlpha: Math.random() * 0.45 + 0.35,
        hue: Math.random() > 0.4 ? 160 : Math.random() > 0.5 ? 195 : 42, // emerald, cyan, or wheat amber
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        label: i % 5 === 0 ? ZONE_TAGS[i % ZONE_TAGS.length] : undefined,
      });
    }

    // Spawn stream particles
    const streamCount = Math.floor(width < 768 ? 35 : 75);
    for (let i = 0; i < streamCount; i++) {
      streamParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() * 0.8 + 0.5) * (Math.random() > 0.15 ? 1 : -1),
        vy: (Math.sin((i / streamCount) * Math.PI * 4) * 0.6),
        history: [],
        maxHistory: Math.floor(Math.random() * 12 + 6),
        alpha: Math.random() * 0.5 + 0.2,
        color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#06b6d4' : '#f59e0b',
      });
    }

    // Listen for custom shockwave
    const onShockwave = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      shockwaves.push({
        x: customEvent.detail.x,
        y: customEvent.detail.y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.4,
        alpha: 0.85 * intensityMultiplier,
        color: isDarkMode ? '#10b981' : '#0d9488',
      });
    };

    window.addEventListener('futuristic-bg-click', onShockwave);

    let lastPacketSpawn = 0;

    // Render loop
    const render = (now: number) => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark') || isDarkMode;
      const mouse = mouseRef.current;
      const mouseActive = isInteractive && mouse.isActive && now - mouse.lastActive < 4000;

      // 1. Draw subtle isometric / cybernetic coordinates grid
      const gridSize = 80;
      const gridAlpha = (isDark ? 0.04 : 0.025) * intensityMultiplier;
      ctx.strokeStyle = isDark ? `rgba(56, 189, 248, ${gridAlpha})` : `rgba(15, 23, 42, ${gridAlpha})`;
      ctx.lineWidth = 0.5;

      // Vertical subtle lines
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Micro crosshair grid points
      const crossSize = 3;
      const crossAlpha = (isDark ? 0.12 : 0.08) * intensityMultiplier;
      ctx.strokeStyle = isDark ? `rgba(16, 185, 129, ${crossAlpha})` : `rgba(13, 148, 136, ${crossAlpha})`;
      ctx.beginPath();
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
        }
      }
      ctx.stroke();

      // 2. MODE SPECIFIC RENDERING

      if (mode === 'mesh' || mode === 'radar') {
        // Connect nodes within proximity
        const maxDist = (width < 768 ? 95 : 140) * (intensity === 'cyber' ? 1.2 : 1.0);

        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];

          // Move node
          n1.x += n1.vx;
          n1.y += n1.vy;
          n1.pulsePhase += n1.pulseSpeed;

          // Screen wrap
          if (n1.x < -20) n1.x = width + 20;
          if (n1.x > width + 20) n1.x = -20;
          if (n1.y < -20) n1.y = height + 20;
          if (n1.y > height + 20) n1.y = -20;

          // Interactive mouse gravity / repulsion
          if (mouseActive) {
            const dx = mouse.x - n1.x;
            const dy = mouse.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const mouseRadius = 180;

            if (dist < mouseRadius && dist > 1) {
              const force = (1 - dist / mouseRadius) * 0.08;
              n1.vx += (dx / dist) * force;
              n1.vy += (dy / dist) * force;

              // Cap max velocity
              const speed = Math.sqrt(n1.vx * n1.vx + n1.vy * n1.vy);
              if (speed > 2.5) {
                n1.vx = (n1.vx / speed) * 2.5;
                n1.vy = (n1.vy / speed) * 2.5;
              }

              // Draw direct laser vector from node to mouse
              const mouseLineAlpha = (1 - dist / mouseRadius) * (isDark ? 0.35 : 0.22) * intensityMultiplier;
              ctx.beginPath();
              ctx.strokeStyle = isDark
                ? `rgba(56, 189, 248, ${mouseLineAlpha})`
                : `rgba(13, 148, 136, ${mouseLineAlpha})`;
              ctx.lineWidth = 1;
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }

          // Gentle drag
          n1.vx *= 0.99;
          n1.vy *= 0.99;

          // Links between nodes
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
              const alphaRatio = 1 - dist / maxDist;
              const linkAlpha = alphaRatio * (isDark ? 0.18 : 0.1) * intensityMultiplier;

              ctx.beginPath();
              ctx.strokeStyle = isDark
                ? `rgba(16, 185, 129, ${linkAlpha})`
                : `rgba(15, 23, 42, ${linkAlpha})`;
              ctx.lineWidth = 0.75;
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();

              // Occasionally spawn a data packet
              if (
                now - lastPacketSpawn > 180 &&
                packets.length < 24 &&
                Math.random() < 0.04
              ) {
                packets.push({
                  fromNode: i,
                  toNode: j,
                  progress: 0,
                  speed: 0.015 + Math.random() * 0.02,
                  color:
                    Math.random() > 0.5
                      ? isDark ? '#38bdf8' : '#0284c7'
                      : isDark ? '#10b981' : '#059669',
                });
                lastPacketSpawn = now;
              }
            }
          }

          // Draw the Node itself
          const pulse = (Math.sin(n1.pulsePhase) + 1) * 0.5;
          const nodeRadius = n1.radius + pulse * 1.2;
          const nodeAlpha = (n1.baseAlpha + pulse * 0.3) * (isDark ? 0.8 : 0.5) * intensityMultiplier;

          // Outer halo
          const haloGradient = ctx.createRadialGradient(
            n1.x,
            n1.y,
            0,
            n1.x,
            n1.y,
            nodeRadius * 3.5
          );
          haloGradient.addColorStop(
            0,
            isDark
              ? `hsla(${n1.hue}, 85%, 60%, ${nodeAlpha * 0.4})`
              : `hsla(${n1.hue}, 70%, 45%, ${nodeAlpha * 0.25})`
          );
          haloGradient.addColorStop(1, 'transparent');

          ctx.fillStyle = haloGradient;
          ctx.beginPath();
          ctx.arc(n1.x, n1.y, nodeRadius * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Core node
          ctx.fillStyle = isDark
            ? `hsla(${n1.hue}, 90%, 65%, ${nodeAlpha})`
            : `hsla(${n1.hue}, 75%, 45%, ${nodeAlpha})`;
          ctx.beginPath();
          ctx.arc(n1.x, n1.y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();

          // Zone HUD label (faint telemetry tag)
          if (n1.label && intensity !== 'subtle') {
            ctx.font = '8px monospace';
            ctx.fillStyle = isDark
              ? `rgba(148, 163, 184, ${0.4 * intensityMultiplier})`
              : `rgba(71, 85, 105, ${0.35 * intensityMultiplier})`;
            ctx.fillText(n1.label, n1.x + 6, n1.y - 4);
          }
        }

        // Draw and update data packets traveling along vector lines
        for (let p = packets.length - 1; p >= 0; p--) {
          const packet = packets[p];
          const n1 = nodes[packet.fromNode];
          const n2 = nodes[packet.toNode];

          if (!n1 || !n2) {
            packets.splice(p, 1);
            continue;
          }

          packet.progress += packet.speed;
          if (packet.progress >= 1) {
            packets.splice(p, 1);
            continue;
          }

          const curX = n1.x + (n2.x - n1.x) * packet.progress;
          const curY = n1.y + (n2.y - n1.y) * packet.progress;

          ctx.fillStyle = packet.color;
          ctx.shadowColor = packet.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(curX, curY, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      // RADAR MODE ADDITIONS
      if (mode === 'radar') {
        const cx = width * 0.85;
        const cy = height * 0.45;
        const radarMaxR = Math.min(width, height) * 0.48;

        radarAngle += 0.012;

        // Concentric range rings
        ctx.lineWidth = 1;
        for (let r = 80; r < radarMaxR; r += 70) {
          ctx.strokeStyle = isDark
            ? `rgba(6, 182, 212, ${(0.08 * (1 - r / radarMaxR)) * intensityMultiplier})`
            : `rgba(13, 148, 136, ${(0.06 * (1 - r / radarMaxR)) * intensityMultiplier})`;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();

          // Range tick label
          ctx.font = '8px monospace';
          ctx.fillStyle = isDark
            ? `rgba(56, 189, 248, ${(0.25 * (1 - r / radarMaxR)) * intensityMultiplier})`
            : `rgba(15, 118, 110, ${(0.25 * (1 - r / radarMaxR)) * intensityMultiplier})`;
          ctx.fillText(`${Math.round(r * 2.5)}km`, cx + r + 4, cy - 3);
        }

        // Radar axis crosshairs
        ctx.strokeStyle = isDark
          ? `rgba(16, 185, 129, ${0.1 * intensityMultiplier})`
          : `rgba(15, 23, 42, ${0.06 * intensityMultiplier})`;
        ctx.beginPath();
        ctx.moveTo(cx - radarMaxR, cy);
        ctx.lineTo(cx + radarMaxR, cy);
        ctx.moveTo(cx, cy - radarMaxR);
        ctx.lineTo(cx, cy + radarMaxR);
        ctx.stroke();

        // Sweeping radar beam gradient
        const beamLength = radarMaxR;
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, beamLength);
        sweepGrad.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(13, 148, 136, 0.18)');
        sweepGrad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(radarAngle);
        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, beamLength, 0, Math.PI / 4);
        ctx.closePath();
        ctx.fill();

        // Beam leading edge
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(13, 148, 136, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(Math.PI / 4) * beamLength, Math.sin(Math.PI / 4) * beamLength);
        ctx.stroke();
        ctx.restore();
      }

      // BIO-CYBER STREAM MODE
      if (mode === 'stream') {
        for (let s = 0; s < streamParticles.length; s++) {
          const sp = streamParticles[s];

          // Push into history
          sp.history.push({ x: sp.x, y: sp.y });
          if (sp.history.length > sp.maxHistory) {
            sp.history.shift();
          }

          // Flow curl
          sp.x += sp.vx;
          sp.y += sp.vy + Math.sin((sp.x * 0.005) + now * 0.001) * 0.7;

          // Wrap around
          if (sp.x < -30) {
            sp.x = width + 30;
            sp.history = [];
          }
          if (sp.x > width + 30) {
            sp.x = -30;
            sp.history = [];
          }
          if (sp.y < -30) {
            sp.y = height + 30;
            sp.history = [];
          }
          if (sp.y > height + 30) {
            sp.y = -30;
            sp.history = [];
          }

          // Mouse vortex in stream mode
          if (mouseActive) {
            const dx = mouse.x - sp.x;
            const dy = mouse.y - sp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160 && dist > 2) {
              const tangentX = -dy / dist;
              const tangentY = dx / dist;
              sp.vx += tangentX * 0.15;
              sp.vy += tangentY * 0.15;
            }
          }

          // Draw trail
          if (sp.history.length > 2) {
            ctx.beginPath();
            ctx.moveTo(sp.history[0].x, sp.history[0].y);
            for (let h = 1; h < sp.history.length; h++) {
              ctx.lineTo(sp.history[h].x, sp.history[h].y);
            }
            ctx.strokeStyle = sp.color;
            ctx.globalAlpha = sp.alpha * (isDark ? 0.6 : 0.35) * intensityMultiplier;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }

          // Head dot
          ctx.fillStyle = sp.color;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Shockwaves from clicks/taps
      for (let w = shockwaves.length - 1; w >= 0; w--) {
        const sw = shockwaves[w];
        sw.radius += 5;
        sw.alpha *= 0.96;

        if (sw.alpha < 0.02 || sw.radius > sw.maxRadius) {
          shockwaves.splice(w, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Echo secondary pulse ring
        if (sw.radius > 25) {
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius - 20, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Interactive Cursor Ring / Reticle
      if (mouseActive) {
        ctx.save();
        const pulse = (Math.sin(now * 0.006) + 1) * 0.5;
        const ringRadius = 24 + pulse * 4;

        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(13, 148, 136, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Corner tick marks
        const tickLen = 6;
        ctx.beginPath();
        // Top
        ctx.moveTo(mouse.x, mouse.y - ringRadius - 4);
        ctx.lineTo(mouse.x, mouse.y - ringRadius - 4 - tickLen);
        // Bottom
        ctx.moveTo(mouse.x, mouse.y + ringRadius + 4);
        ctx.lineTo(mouse.x, mouse.y + ringRadius + 4 + tickLen);
        // Left
        ctx.moveTo(mouse.x - ringRadius - 4, mouse.y);
        ctx.lineTo(mouse.x - ringRadius - 4 - tickLen, mouse.y);
        // Right
        ctx.moveTo(mouse.x + ringRadius + 4, mouse.y);
        ctx.lineTo(mouse.x + ringRadius + 4 + tickLen, mouse.y);
        ctx.stroke();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('futuristic-bg-click', onShockwave);
    };
  }, [mode, intensity, isInteractive, isVisible, isDarkMode]);

  return (
    <>
      {/* Background Canvas Layer */}
      {isVisible && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0"
          style={{ willChange: 'transform' }}
        />
      )}

      {/* Floating Futuristic HUD Control Pill / Panel */}
      <div
        id="futuristic-hud-control"
        className="fixed bottom-4 right-4 z-30 font-mono text-xs select-none print:hidden"
      >
        {!isWidgetExpanded ? (
          /* Minimized cyber badge */
          <button
            onClick={() => setIsWidgetExpanded(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-950/90 text-emerald-400 dark:text-emerald-300 border border-emerald-500/40 shadow-lg backdrop-blur-md hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Open Futuristic Background Controls"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span className="text-[11px] font-bold tracking-wider">SYS.HUD</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
              [{mode}]
            </span>
          </button>
        ) : (
          /* Expanded Futuristic Controller */
          <div className="w-72 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-slate-200 border border-emerald-500/50 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-xs tracking-wider text-emerald-400">
                  FUTURISTIC SYSTEMS BG
                </span>
              </div>
              <button
                onClick={() => setIsWidgetExpanded(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimize controller"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Micro Cursor Telemetry */}
            <div className="px-2 py-1.5 mb-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[10px] text-slate-400 flex items-center justify-between">
              <span>OR-GEO // GRID ACTIVE</span>
              <span className="text-emerald-400 font-bold">
                X:{cursorCoords.x} Y:{cursorCoords.y}
              </span>
            </div>

            {/* Presets / Modes */}
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Graphics Mode</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'mesh', label: 'Telemetry', icon: Radio },
                  { id: 'radar', label: 'Orbital', icon: Cpu },
                  { id: 'stream', label: 'Bio-Flow', icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setMode(item.id as BackgroundMode)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer border ${
                        mode === item.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity / Glow level */}
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Visual Intensity</span>
                <span className="text-emerald-400 capitalize">{intensity}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['subtle', 'balanced', 'cyber'] as BackgroundIntensity[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`py-1 px-2 rounded-lg text-[10px] capitalize font-medium transition-all cursor-pointer border ${
                      intensity === level
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Interactive Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              {/* Interactive Magnetism */}
              <button
                onClick={() => setIsInteractive(!isInteractive)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                  isInteractive
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/60'
                }`}
                title="Toggle interactive mouse attraction & vector beams"
              >
                <Magnet className="w-3 h-3" />
                <span>{isInteractive ? 'Magnet: On' : 'Magnet: Off'}</span>
              </button>

              {/* Master Visibility */}
              <button
                onClick={() => setIsVisible(!isVisible)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
                  isVisible
                    ? 'bg-slate-800 text-slate-200 border-slate-600'
                    : 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                }`}
                title="Toggle background graphics"
              >
                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{isVisible ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
