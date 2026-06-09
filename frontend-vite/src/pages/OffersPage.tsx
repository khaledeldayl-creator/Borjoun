"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Toasts from "@/components/Toasts";
import VpnDetector from "@/components/VpnDetector";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";
import { formatCurrency } from "@/utils/currency";

interface Offerwall {
  id: string;
  name: string;
  category: string;
  multiplier: number;
  icon: string;
  coins: number;
  iframe_url: string;
}

export default function Offers() {
  const navigate = useNavigate();
  const { token, lang, user, addToast, currency } = useAppStore();
  const t = translations[lang];
  const isAr = lang === "ar";

  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([]);
  const [loadingWalls, setLoadingWalls] = useState(true);
  const [selectedWall, setSelectedWall] = useState<Offerwall | null>(null);
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingWalls(true);
    apiRequest("/offerwalls")
      .then((data) => {
        const mapped = data.map((wall: any) => {
          let category = "Offers & Apps";
          let icon = "sports_esports";
          
          if (["cpx", "tapresearch", "yoursurveys", "pollfish", "bitlabs"].includes(wall.identifier)) {
            category = isAr ? "استطلاعات الرأي" : "Surveys";
            icon = "analytics";
          } else {
            category = isAr ? "تنزيل الألعاب والمهام" : "Offers & App Installs";
          }

          return {
            id: wall.identifier,
            name: wall.name,
            category,
            multiplier: parseFloat(wall.multiplier || 1),
            icon,
            coins: Math.round(wall.multiplier * 5000), // representation of max coins reward
            iframe_url: wall.iframe_url
          };
        });
        setOfferwalls(mapped);
        setLoadingWalls(false);
      })
      .catch((err) => {
        console.error("Could not fetch offerwalls:", err);
        setLoadingWalls(false);
      });
  }, [token, isAr]);

  const handleOpenOfferwall = (wall: Offerwall) => {
    setSelectedWall(wall);
    addToast(
      isAr ? "جاري تحميل الحائط" : "Loading Offerwall", 
      isAr ? `جاري تأسيس اتصال آمن بـ ${wall.name}...` : `Establishing secure connection with ${wall.name}...`, 
      "info"
    );
  };


  const getGeneratedIframeUrl = (wall: Offerwall) => {
    if (!user) return "";
    let url = wall.iframe_url;
    url = url.replace("[USER_ID]", user.id);
    url = url.replace("[APP_ID]", "borjoun");
    url = url.replace("[API_KEY]", "api_config_key");
    return url;
  };

  return (
    <DashboardLayout>
      <VpnDetector />
      <Toasts />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-on-surface mb-2">
          {t.nav_offers}
        </h1>
        <p className="text-xs text-on-surface-variant font-medium">
          {isAr 
            ? "أكمل العروض والاستبيانات وحمّل التطبيقات للحصول على نقاط فورا." 
            : "Complete high-paying offers, download apps, and answer surveys to earn coins instantly."}
        </p>
      </div>

      {loadingWalls ? (
        <div className="flex justify-center items-center py-16">
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : offerwalls.length === 0 ? (
        <div className="bg-white p-8 border border-slate-100 rounded-[28px] text-center text-xs font-bold text-on-surface-variant shadow-sm">
          {isAr ? "لا توجد حوائط عروض نشطة حالياً." : "No active offerwalls found at this moment."}
        </div>
      ) : (
        /* Offerwalls Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerwalls.map((wall) => (
            <div 
              key={wall.id}
              onClick={() => handleOpenOfferwall(wall)}
              className="bg-white group p-6 rounded-[28px] border border-slate-100 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-start gap-4 relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-primary text-6xl">verified_user</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">{wall.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-base font-black text-on-surface mb-1 group-hover:text-primary transition-colors">
                  {wall.name}
                </h3>
                <span className="inline-block px-2.5 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-[9px] font-mono text-primary font-black mb-3">
                  {wall.category}
                </span>
                <p className="text-[10px] text-on-surface-variant font-bold">Multiplier: {wall.multiplier}x payout rates</p>
                <div className="mt-4 flex items-center gap-2 text-primary font-bold text-xs uppercase">
                  {t.offer_earn_prefix} {formatCurrency(wall.coins, currency)} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real Offerwall Iframe Modal */}
      {selectedWall && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[32px] overflow-hidden border border-slate-100 flex flex-col shadow-2xl">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <div>
                  <h2 className="font-display font-black text-on-surface text-sm">{selectedWall.name}</h2>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {isAr ? "أكمل العروض لكسب النقاط تلقائياً" : "Complete offers to earn coins automatically"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWall(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-slate-600">close</span>
              </button>
            </div>

            {/* Iframe */}
            <iframe
              src={getGeneratedIframeUrl(selectedWall)}
              className="flex-1 w-full border-0"
              title={selectedWall.name}
              allow="camera; microphone; geolocation"
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
