"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Toasts from "@/components/Toasts";
import RouletteWheel from "@/components/RouletteWheel";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";
import { formatCurrency } from "@/utils/currency";
// formatCurrency kept for balance display

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, user, lang, setUser, addToast, currency } = useAppStore();
  const t = translations[lang];

  const [streakLoading, setStreakLoading] = useState(false);
  const [claimCountdown, setClaimCountdown] = useState("24:00:00");
  const isAr = lang === "ar";

  // Calculate countdown until next daily claim (resets 24h after last claim)
  const getSecondsUntilNextClaim = () => {
    if (!user?.last_claim_date) return 0;
    const last = new Date(user.last_claim_date);
    const nextClaim = new Date(last.getTime() + 24 * 60 * 60 * 1000);
    const diff = Math.max(0, Math.floor((nextClaim.getTime() - Date.now()) / 1000));
    return diff;
  };

  const formatSeconds = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!user) return;
    let remaining = getSecondsUntilNextClaim();
    setClaimCountdown(formatSeconds(remaining));

    const timer = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      setClaimCountdown(formatSeconds(remaining));
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.last_claim_date]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Refresh profile state
    apiRequest("/users/profile")
      .then((profile) => setUser(profile))
      .catch((err) => {
        addToast(
          isAr ? "خطأ في تحميل الحساب" : "Error loading profile",
          err.message,
          "error"
        );
      });
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  const hasClaimedToday = (() => {
    if (!user.last_claim_date) return false;
    const last = new Date(user.last_claim_date);
    const now = new Date();
    return last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate();
  })();

  // Calculate Level and XP Progress (Max XP = 1000 per level)
  const currentXP = parseFloat(user.total_earned.toString());
  const level = Math.floor(currentXP / 1000);
  const xpInCurrentLevel = currentXP % 1000;
  const remainingXP = 1000 - xpInCurrentLevel;
  const xpPercentage = (xpInCurrentLevel / 1000) * 100;

  const handleClaimStreak = async () => {
    setStreakLoading(true);
    try {
      const result = await apiRequest("/rewards/claim-streak", { method: "POST" });
      addToast(
        isAr ? "تم المطالبة بنجاح!" : "Streak Claimed!",
        isAr 
          ? `ربحت ${parseFloat(result.reward).toFixed(0)} نقطة. اليوم ${result.streak} نشط!`
          : `Earned ${parseFloat(result.reward).toFixed(0)} coins. Day ${result.streak} Active!`,
        "success"
      );
      
      const updatedProfile = await apiRequest("/users/profile");
      setUser(updatedProfile);
    } catch (err: any) {
      addToast(
        isAr ? "فشلت المطالبة" : "Claim Failed",
        isAr ? "لقد طالبت بالفعل بمكافأتك اليوم." : (err.message || "Daily reward already claimed today."),
        "error"
      );
    } finally {
      setStreakLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isAr ? "صباح الخير" : "Good Morning";
    return isAr ? "مساء الخير" : "Good Evening";
  };

  return (
    <DashboardLayout>
      <Toasts />

      {/* 1. Welcome Banner */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="flex flex-col gap-1 z-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            {isAr ? "المستوى الحالي" : "CURRENT LEVEL"}
          </span>
          <h1 className="font-display text-4xl font-black text-primary tracking-tight">
            LV.{level}
          </h1>
          <h2 className="font-display text-2xl font-black text-on-surface mt-2">
            {getGreeting()}، {user.username}
          </h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            {isAr ? "أهلاً بك في نظام مكافآت برجون المتطور" : "Welcome to the advanced Borjoun rewards system"}
          </p>
        </div>

        {/* Level Avatar circle */}
        <div className="flex items-center gap-4 z-10 self-end md:self-auto">
          <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-primary shadow-inner">
            <span className="material-symbols-outlined text-3xl font-bold">
              {new Date().getHours() < 12 || new Date().getHours() > 18 ? "dark_mode" : "light_mode"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Start Earning CTA */}
      <div
        onClick={() => navigate("/offers")}
        className="bg-gradient-to-r from-primary to-amber-500 p-6 md:p-8 rounded-[32px] flex items-center justify-between gap-4 cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-orange-100"
      >
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-xl font-black text-white">
            {isAr ? "ابدأ الكسب الآن" : "Start Earning Now"}
          </h3>
          <p className="text-xs text-white/80 font-medium">
            {isAr ? "أكمل العروض والاستبيانات وحوّل وقتك إلى أرباح حقيقية" : "Complete offers & surveys and turn your time into real rewards"}
          </p>
        </div>
        <span className="material-symbols-outlined text-white text-4xl flex-shrink-0">
          arrow_forward
        </span>
      </div>

      {/* 3. Performance & Activity */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">star</span>
          <h3 className="font-display text-lg font-black text-on-surface">
            {isAr ? "الأداء والنشاط" : "Performance & Activity"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Main Balance */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                <span className="text-xs font-bold">{isAr ? "الرصيد الرئيسي" : "Main Balance"}</span>
              </div>
              <h4 className="font-display text-3xl font-black text-on-surface mt-2 break-all">
                {formatCurrency(parseFloat(user.wallet_balance.toString()), currency)}
              </h4>
            </div>
            <button 
              onClick={() => navigate("/withdraw")}
              className="w-full py-3 bg-orange-50 hover:bg-orange-100 text-primary font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">outbox</span>
              <span>{isAr ? "سحب الرصيد" : "Withdraw Balance"}</span>
            </button>
          </div>

          {/* Card 2: Purchase Balance */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-base">shopping_bag</span>
                <span className="text-xs font-bold">{isAr ? "رصيد الشراء" : "Purchase Balance"}</span>
              </div>
              <h4 className="font-display text-3xl font-black text-on-surface mt-2 break-all">
                {formatCurrency(0, currency)}
              </h4>
            </div>
            <button 
              onClick={() => navigate("/deposit")}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-secondary font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
              <span>{isAr ? "إيداع رصيد" : "Deposit Balance"}</span>
            </button>
          </div>

          {/* Card 3: Referrals */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-base">diversity_3</span>
                <span className="text-xs font-bold">{isAr ? "إجمالي الإحالات" : "Total Referrals"}</span>
              </div>
              <h4 className="font-display text-3xl font-black text-on-surface mt-2">
                0
              </h4>
            </div>
            <button 
              onClick={() => {
                const el = document.getElementById("referrals-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-secondary font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">insights</span>
              <span>{isAr ? "عرض الإحصائيات" : "Show Statistics"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Streak & Level-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Streak Rewards Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <h3 className="font-display text-base font-black text-on-surface">
                  {isAr ? "مكافآت السلسلة" : "Streak Rewards"}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-2 leading-relaxed">
                {isAr 
                  ? "أكثر اليوم للحفاظ على سلسلتك واكسب E£ 52.9 إضافية"
                  : "Complete tasks today to keep your streak and earn an extra E£ 52.9!"}
              </p>
            </div>

            {/* Countdown Badge */}
            <span className="text-[10px] font-black bg-orange-50 border border-orange-100 text-primary px-3 py-1.5 rounded-xl whitespace-nowrap">
              {isAr ? "المطالبة القادمة في:" : "Next claim in:"} {claimCountdown}
            </span>
          </div>

          {/* Daily streak track timeline */}
          <div className="grid grid-cols-7 gap-2 my-4">
            {[
              { label: isAr ? "اليوم" : "Today", value: 3.18, checked: true },
              { label: "D2", value: 6.35, checked: false },
              { label: "D3", value: 9.53, checked: false },
              { label: "D4", value: 12.7, checked: false },
              { label: "D5", value: 15.9, checked: false },
              { label: "D6", value: 19.1, checked: false },
              { label: "D7", value: 396.0, checked: false, gift: true },
            ].map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs shadow-sm transition-all ${
                  day.checked 
                    ? "bg-primary border-primary text-white" 
                    : "bg-slate-50 border-slate-100 text-secondary"
                }`}>
                  {day.checked ? (
                    <span className="material-symbols-outlined text-sm font-black">check</span>
                  ) : day.gift ? (
                    <span className="material-symbols-outlined text-sm">redeem</span>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[8px] font-bold text-slate-400">{day.label}</span>
                  <span className="text-[8px] font-bold text-primary mt-1">
                    {day.gift ? (isAr ? "حتى " : "up to ") : ""}
                    {formatCurrency(day.value, 'EGP').split(" ")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleClaimStreak}
            disabled={streakLoading || hasClaimedToday}
            className={`w-full py-4 font-bold rounded-2xl text-xs transition-all ${
              hasClaimedToday
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-hover cursor-pointer"
            }`}
          >
            {streakLoading
              ? (isAr ? "جارٍ المطالبة..." : "Claiming...")
              : hasClaimedToday
                ? (isAr ? "تم المطالبة اليوم" : "Claimed Today")
                : (isAr ? "اطلب مكافأتك اليومية" : "Claim Daily Reward")}
          </button>
        </div>

        {/* Level Up Gradient Card */}
        <div className="bg-gradient-to-br from-primary to-amber-500 p-8 rounded-3xl text-white shadow-[0_8px_30px_rgba(255,153,0,0.15)] flex flex-col justify-between gap-6 relative overflow-hidden">
          {/* Abstract circles */}
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>

          <div className="flex justify-between items-start z-10">
            <h3 className="font-display text-lg font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">insights</span>
              <span>{isAr ? "رفع المستوى" : "Level Up"}</span>
            </h3>
            <span className="material-symbols-outlined text-lg">arrow_outward</span>
          </div>

          <div className="flex flex-col items-center gap-4 z-10 py-2">
            <h2 className="font-display text-6xl font-black tracking-tighter">
              Lv.{level}
            </h2>
            <p className="text-xs font-semibold text-white/95 mt-1">
              {isAr 
                ? `${remainingXP} عملة متبقية للمستوى التالي`
                : `${remainingXP} coins remaining for next level`}
            </p>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-white/20 rounded-full mt-2 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center items-center z-10 pt-2 border-t border-white/10">
            <button 
              onClick={() => {
                addToast(
                  isAr ? "معلومات اللقب" : "Title Information",
                  isAr 
                    ? "كلما كسبت 1000 نقطة، سيرتفع مستواك وتزيد مضاعفات أرباحك بنسبة 2%."
                    : "For every 1000 coins earned, you level up and increase your rewards multiplier by 2%.",
                  "info"
                );
              }}
              className="text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">info</span>
              <span>{isAr ? "معلومات اللقب" : "Title Information"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 5. Roulette Wheel */}
      <RouletteWheel />

      {/* 6. Referrals Widget Section */}
      <div 
        id="referrals-section"
        className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-xl font-black text-on-surface">
              {t.dash_referrals}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed max-w-sm">
              {t.dash_ref_desc}
            </p>
            <div className="flex gap-4 text-[10px] font-bold text-primary mt-4 uppercase tracking-wider">
              <span>{isAr ? "إجمالي المدعوين:" : "Total Invited:"} 0</span>
              <span>•</span>
              <span>{isAr ? "أرباح العمولة:" : "Commissions:"} {formatCurrency(0, currency)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-mono font-black uppercase text-slate-400">
              {t.dash_ref_link}
            </label>
            <div className="flex bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden p-1.5">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/register?ref=${user.referral_code}`}
                className="flex-1 bg-transparent px-3 text-xs font-mono font-semibold focus:outline-none text-on-surface overflow-x-auto"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referral_code}`);
                  addToast(t.dash_copied, t.dash_ref_link, "success");
                }}
                className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-orange-100"
              >
                {t.dash_copy}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
