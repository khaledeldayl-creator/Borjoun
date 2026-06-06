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
  const { token, lang, user, setUser, addToast, currency } = useAppStore();
  const t = translations[lang];
  const isAr = lang === "ar";

  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([]);
  const [loadingWalls, setLoadingWalls] = useState(true);
  const [selectedWall, setSelectedWall] = useState<Offerwall | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSimulateCompletion = async (offerName: string, coinsVal: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const payoutDollar = coinsVal / 1000.0;
      const network = selectedWall?.id || "generic";
      
      const response = await apiRequest(
        `/admin/simulate-postback?network=${network}&payout=${payoutDollar}&offer_id=${encodeURIComponent(offerName)}`,
        { method: "POST" }
      );

      addToast(
        isAr ? "اكتمل العرض بنجاح!" : "Offer Completed!", 
        isAr ? `تم محاكاة الطلب وإضافة الرصيد لحسابك!` : `Mock postback triggered! ${response.message}`, 
        "success"
      );
      
      const profile = await apiRequest("/users/profile");
      setUser(profile);
    } catch (err: any) {
      addToast(
        isAr ? "خطأ في الاتصال" : "Postback Trigger Error", 
        err.message || "Failed to trigger postback", 
        "error"
      );
    } finally {
      setLoading(false);
    }
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

      {/* Sandbox Offerwall Iframe simulation */}
      {selectedWall && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[32px] overflow-hidden border border-slate-100 flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <h2 className="font-display font-black text-on-surface text-sm">
                  {selectedWall.name} {isAr ? "بوابة المحاكاة والربح الآمن" : "Secure Sandbox Connection"}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedWall(null)}
                className="text-secondary hover:text-on-surface font-black text-xl cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Simulation Sandbox Grid */}
            <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/20">
              <div className="flex flex-col justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div>
                  <h3 className="font-display font-black text-on-surface text-sm">CPX / Lootably Integration Sandbox</h3>
                  <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed font-medium">
                    For testing purposes, click any action to simulate offer completions. Under the hood, this fires a signed Webhook (postback) payload containing hashes to credit your balance automatically.
                  </p>
                </div>
                
                {/* Offers List */}
                <div className="mt-6 flex flex-col gap-3">
                  {[
                    { name: "Complete Quick Profile Survey", coins: 850 },
                    { name: "Install TikTok & Register Account", coins: 4500 },
                    { name: "Complete Level 50 in Lords Mobile", coins: 15000 },
                    { name: "Watch 3 Video Ads", coins: 150 },
                  ].map((offer) => (
                    <div 
                      key={offer.name} 
                      onClick={() => handleSimulateCompletion(offer.name, offer.coins)}
                      className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50 hover:bg-orange-50 hover:border-orange-100 rounded-xl cursor-pointer transition-all"
                    >
                      <span className="text-[10px] font-bold text-on-surface">{offer.name}</span>
                      <span className="font-display text-[10px] font-black text-primary bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">
                        +{formatCurrency(offer.coins, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col justify-center items-center p-8 bg-slate-50/40 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">iframe</span>
                <h4 className="font-display font-black text-on-surface text-xs">Live Production IFrame View</h4>
                <p className="text-[10px] text-on-surface-variant mt-2 max-w-sm leading-relaxed font-semibold">
                  In production, this area will load the wall URL directly: <br />
                  <code className="block bg-white p-2 rounded border border-slate-100 mt-2 font-mono text-[9px] break-all text-primary font-bold">
                    {getGeneratedIframeUrl(selectedWall)}
                  </code>
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
