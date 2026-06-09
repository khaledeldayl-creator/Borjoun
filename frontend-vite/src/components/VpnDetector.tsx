"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";

export default function VpnDetector() {
  const { vpnBlocked, setVpnBlocked, lang, token } = useAppStore();
  const t = translations[lang];

  useEffect(() => {
    if (!token) return;
    apiRequest("/check-ip")
      .then((data) => {
        if (data.isVpn) setVpnBlocked(true);
      })
      .catch(() => {});
  }, [token]);

  if (!vpnBlocked) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-4">
      <div 
        className="glass-card max-w-lg w-full p-8 md:p-10 rounded-[32px] text-center border-t-2 border-t-secondary-container/30 relative overflow-hidden shadow-2xl"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-secondary-container/10 border border-secondary-container/20 flex items-center justify-center mb-6 text-secondary-container">
            <span className="material-symbols-outlined text-5xl">vpn_lock</span>
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-black text-on-surface mb-4">
            {t.block_vpn_title}
          </h2>

          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-6">
            {t.block_vpn_desc}
          </p>

          <div className="text-xs font-mono bg-surface-container-low px-4 py-2 rounded-lg text-primary border border-primary/10">
            SECURITY RULE: [ANTI_PROXY_SHIELD_ACTIVE]
          </div>
        </div>
      </div>
    </div>
  );
}
