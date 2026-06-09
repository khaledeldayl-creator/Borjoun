"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/utils/api";
import { useAppStore } from "@/store/store";
import { formatCurrency } from "@/utils/currency";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface WheelSettings {
  isEnabled: boolean;
  dailyLimit: number;
  segments: Segment[];
}

export default function RouletteWheel() {
  const { token, user, setUser, addToast, lang, currency } = useAppStore();
  const isAr = lang === "ar";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<WheelSettings | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ reward: number; label: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const currentRotationRef = useRef(0);

  useEffect(() => {
    if (!token) return;
    apiRequest("/wheel/settings").then((data) => {
      setSettings(data);
    }).catch(() => {});
    apiRequest("/wheel/spins-today").then((data) => {
      setSpinsLeft(data.spinsLeft);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (settings) drawWheel(currentRotationRef.current);
  }, [settings]);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !settings) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const segments = settings.segments;
    const numSegments = segments.length;
    const arcSize = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer ring shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.restore();

    segments.forEach((seg, i) => {
      const startAngle = angle + i * arcSize;
      const endAngle = startAngle + arcSize;

      // Segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${numSegments > 8 ? 11 : 13}px system-ui`;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, radius - 10, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center icon
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", centerX, centerY);
  };

  const handleSpin = async () => {
    if (spinning || spinsLeft <= 0 || !settings) return;
    setSpinning(true);
    setShowResult(false);
    setResult(null);

    try {
      const data = await apiRequest("/wheel/spin", { method: "POST" });
      const { segmentIndex, reward, label, spinsLeft: newSpinsLeft } = data;

      // Calculate target angle to land on the winning segment
      const numSegments = settings.segments.length;
      const arcSize = (2 * Math.PI) / numSegments;

      // We want segmentIndex to be at the top (pointer position = -π/2)
      const segmentMidAngle = segmentIndex * arcSize + arcSize / 2;
      const targetOffset = -Math.PI / 2 - segmentMidAngle;

      // Spin 5-8 full rotations + land on target
      const extraSpins = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
      const finalAngle = currentRotationRef.current + extraSpins + (targetOffset - (currentRotationRef.current % (2 * Math.PI)) + 2 * Math.PI * 3) % (2 * Math.PI);

      // Animate
      const duration = 4000;
      const startTime = performance.now();
      const startAngle = currentRotationRef.current;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startAngle + (finalAngle - startAngle) * eased;
        currentRotationRef.current = currentAngle;
        drawWheel(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentRotationRef.current = finalAngle;
          setSpinsLeft(newSpinsLeft);
          setResult({ reward, label });
          setShowResult(true);
          setSpinning(false);
          // Refresh user balance
          apiRequest("/users/profile").then(setUser).catch(() => {});
          addToast(
            isAr ? "🎉 مبروك!" : "🎉 Congratulations!",
            isAr ? `ربحت ${reward} نقطة!` : `You won ${reward} coins!`,
            "success"
          );
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      addToast(
        isAr ? "خطأ" : "Error",
        err.message || "Failed to spin",
        "error"
      );
      setSpinning(false);
    }
  };

  if (!settings || !settings.isEnabled) return null;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">casino</span>
          <h3 className="font-display text-lg font-black text-on-surface">
            {isAr ? "عجلة الحظ" : "Luck Wheel"}
          </h3>
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-xl border ${
          spinsLeft > 0
            ? "bg-green-50 text-green-600 border-green-100"
            : "bg-slate-50 text-slate-400 border-slate-100"
        }`}>
          {isAr ? `${spinsLeft} دورة متبقية` : `${spinsLeft} spin${spinsLeft !== 1 ? "s" : ""} left`}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Wheel */}
        <div className="relative flex-shrink-0">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-md" />
          </div>
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            className="rounded-full"
          />
        </div>

        {/* Right side: result + button */}
        <div className="flex flex-col items-center md:items-start gap-6 flex-1">
          {/* Result box */}
          {showResult && result ? (
            <div className="w-full bg-gradient-to-br from-primary to-amber-500 rounded-3xl p-6 text-white text-center shadow-lg shadow-orange-100 animate-bounce-once">
              <p className="text-xs font-bold opacity-80 mb-1">
                {isAr ? "لقد ربحت" : "You Won"}
              </p>
              <p className="font-display text-5xl font-black">
                {result.reward}
              </p>
              <p className="text-sm font-bold opacity-90 mt-1">
                {isAr ? "نقطة" : "coins"} · {formatCurrency(result.reward, currency)}
              </p>
            </div>
          ) : (
            <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">
                casino
              </span>
              <p className="text-xs font-bold text-on-surface-variant">
                {isAr ? "اضغط لتدوير العجلة وربح النقاط!" : "Spin the wheel to win coins!"}
              </p>
            </div>
          )}

          {/* Segments preview */}
          <div className="flex flex-wrap gap-2">
            {settings.segments
              .filter((s, i, arr) => arr.findIndex(x => x.value === s.value) === i)
              .map((seg, i) => (
                <span
                  key={i}
                  className="text-[10px] font-black px-2.5 py-1 rounded-lg text-white"
                  style={{ backgroundColor: seg.color }}
                >
                  {seg.label}
                </span>
              ))}
          </div>

          {/* Spin button */}
          <button
            onClick={handleSpin}
            disabled={spinning || spinsLeft <= 0}
            className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
              spinning || spinsLeft <= 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-orange-100 cursor-pointer"
            }`}
          >
            {spinning
              ? (isAr ? "⏳ جاري الدوران..." : "⏳ Spinning...")
              : spinsLeft <= 0
              ? (isAr ? "استنفدت دوراتك اليومية" : "No spins left today")
              : (isAr ? "🎰 أدر العجلة!" : "🎰 Spin the Wheel!")}
          </button>

          {spinsLeft <= 0 && (
            <p className="text-[10px] text-slate-400 font-semibold text-center">
              {isAr ? "عد غداً للحصول على دورات جديدة" : "Come back tomorrow for new spins"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
