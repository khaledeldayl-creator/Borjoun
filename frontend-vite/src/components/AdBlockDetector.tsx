"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/store";
import { detectAdBlock } from "@/utils/adblock";
import { translations } from "@/utils/translations";

// How often to re-poll while the overlay is visible (ms)
const RECHECK_INTERVAL_MS = 5_000;

export default function AdBlockDetector() {
  const { adBlockActive, setAdBlockActive, lang } = useAppStore();
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = translations[lang];

  const runCheck = useCallback(async () => {
    const blocked = await detectAdBlock();
    setAdBlockActive(blocked);
    return blocked;
  }, [setAdBlockActive]);

  // Initial check
  useEffect(() => {
    runCheck();
  }, [runCheck]);

  // Continuous polling — only while the overlay is shown
  useEffect(() => {
    if (!adBlockActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(runCheck, RECHECK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [adBlockActive, runCheck]);

  // Recheck immediately when the user switches back to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && adBlockActive) {
        runCheck();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [adBlockActive, runCheck]);

  const handleManualRecheck = async () => {
    setLoading(true);
    await runCheck();
    setLoading(false);
  };

  if (!adBlockActive) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-title"
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex items-center justify-center p-4"
    >
      <div
        className="glass-card max-w-lg w-full p-8 md:p-10 rounded-[32px] text-center border-t-2 border-t-primary/30 relative overflow-hidden shadow-2xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* Ambient blobs */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center mb-6 text-error">
            <span className="material-symbols-outlined text-5xl" aria-hidden="true">
              warning
            </span>
          </div>

          {/* Heading */}
          <h2
            id="adblock-title"
            className="font-display text-2xl md:text-3xl font-black text-on-surface mb-4"
          >
            {t.block_adblock_title}
          </h2>

          {/* Description */}
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-8">
            {t.block_adblock_desc}
          </p>

          {/* Steps hint */}
          <ol className="w-full text-start text-xs text-on-surface-variant mb-8 space-y-2 list-none">
            {[
              lang === "ar"
                ? "افتح إضافة مانع الإعلانات في متصفحك"
                : "Open your ad blocker extension",
              lang === "ar"
                ? "أوقف تشغيله لهذا الموقع أو بشكل كامل"
                : "Disable it for this site or turn it off entirely",
              lang === "ar"
                ? "ثم اضغط على الزر أدناه"
                : "Then click the button below",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {/* CTA */}
          <button
            onClick={handleManualRecheck}
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl text-sm neon-glow-purple hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <span
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                role="status"
                aria-label="Checking…"
              />
            ) : (
              <>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  refresh
                </span>
                {t.block_adblock_btn}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
