import React, { useEffect, useRef } from "react";
import { Sparkles, Mic, Volume2, Cpu } from "lucide-react";
import { CompanionState } from "../../types";

interface CompanionOrbProps {
  state: CompanionState;
  onTap?: () => void;
  statusMessage?: string;
  size?: "sm" | "md" | "lg";
}

export const CompanionOrb: React.FC<CompanionOrbProps> = ({
  state,
  onTap,
  statusMessage,
  size = "lg",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Base radius calculation
      const baseRadius = size === "lg" ? 64 : size === "md" ? 48 : 32;

      // Dynamic wave variation based on state
      let speed = 0.04;
      let waveAmp = 5;
      let ringCount = 3;

      if (state === "listening") {
        speed = 0.08;
        waveAmp = 12;
      } else if (state === "thinking") {
        speed = 0.12;
        waveAmp = 8;
      } else if (state === "speaking") {
        speed = 0.1;
        waveAmp = 15;
      }

      step += speed;

      // Outer ethereal pulse rings
      for (let i = 0; i < ringCount; i++) {
        const ringProgress = (step * 0.4 + i * 0.4) % 1;
        const currentRingRadius = baseRadius + ringProgress * 36;
        const alpha = Math.max(0, 1 - ringProgress) * 0.25;

        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRingRadius, 0, Math.PI * 2);
        ctx.strokeStyle =
          state === "listening"
            ? `rgba(236, 72, 153, ${alpha})`
            : state === "speaking"
            ? `rgba(6, 182, 212, ${alpha})`
            : `rgba(99, 102, 241, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Deformable inner organic fluid orb
      ctx.save();
      ctx.beginPath();
      const points = 16;
      for (let j = 0; j <= points; j++) {
        const angle = (j / points) * Math.PI * 2;
        const wave = Math.sin(angle * 4 + step) * waveAmp;
        const r = baseRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Multi-stop high-tech gradient
      const gradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.3
      );

      if (state === "listening") {
        gradient.addColorStop(0, "#f43f5e");
        gradient.addColorStop(0.5, "#ec4899");
        gradient.addColorStop(1, "#8b5cf6");
      } else if (state === "thinking") {
        gradient.addColorStop(0, "#a855f7");
        gradient.addColorStop(0.5, "#6366f1");
        gradient.addColorStop(1, "#3b82f6");
      } else if (state === "speaking") {
        gradient.addColorStop(0, "#38bdf8");
        gradient.addColorStop(0.5, "#06b6d4");
        gradient.addColorStop(1, "#4f46e5");
      } else {
        // Idle
        gradient.addColorStop(0, "#818cf8");
        gradient.addColorStop(0.45, "#6366f1");
        gradient.addColorStop(0.85, "#312e81");
        gradient.addColorStop(1, "#0f172a");
      }

      ctx.fillStyle = gradient;
      ctx.shadowBlur = size === "lg" ? 30 : 18;
      ctx.shadowColor =
        state === "listening"
          ? "rgba(244, 63, 94, 0.6)"
          : state === "speaking"
          ? "rgba(6, 182, 212, 0.6)"
          : "rgba(99, 102, 241, 0.5)";
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, size]);

  const stateInfo = {
    idle: {
      label: "Ready to assist",
      icon: Sparkles,
      color: "text-indigo-400 bg-indigo-950/60 border-indigo-700/40",
    },
    listening: {
      label: "Listening to you...",
      icon: Mic,
      color: "text-rose-400 bg-rose-950/60 border-rose-700/40",
    },
    thinking: {
      label: "Analyzing with Gemini...",
      icon: Cpu,
      color: "text-purple-400 bg-purple-950/60 border-purple-700/40",
    },
    speaking: {
      label: "Anu is responding...",
      icon: Volume2,
      color: "text-cyan-400 bg-cyan-950/60 border-cyan-700/40",
    },
  }[state];

  const StateIcon = stateInfo.icon;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Canvas Orb with Glow */}
      <div
        onClick={onTap}
        className="relative cursor-pointer transition-transform duration-200 active:scale-95 group"
        title="Tap to interact with Anu"
      >
        <canvas
          ref={canvasRef}
          width={size === "lg" ? 220 : size === "md" ? 170 : 120}
          height={size === "lg" ? 220 : size === "md" ? 170 : 120}
          className="mx-auto"
        />

        {/* Center overlay core for tactile Android feel */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-slate-950/40 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white/90 animate-pulse" />
          </div>
        </div>
      </div>

      {/* State pill indicator */}
      <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md shadow-sm transition-all duration-300">
        <span
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${stateInfo.color}`}
        >
          <StateIcon className="w-3 h-3 animate-pulse" />
          <span>{statusMessage || stateInfo.label}</span>
        </span>
      </div>
    </div>
  );
};
