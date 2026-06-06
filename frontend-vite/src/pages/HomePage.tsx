"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Toasts from "@/components/Toasts";
import VpnDetector from "@/components/VpnDetector";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";

export default function Home() {
  const { lang, setUser } = useAppStore();
  const t = translations[lang];
  const isAr = lang === "ar";
  const [stats, setStats] = useState({
    activeUsers: 0,
    offersDone: 0,
    paidOut: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiRequest("/users/profile")
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem("token");
        });
    }

    apiRequest("/public/stats")
      .then((res) => {
        setStats({
          activeUsers: res.total_users,
          offersDone: res.total_conversions,
          paidOut: res.total_paid_out
        });
      })
      .catch(console.error);

  }, []);

  return (
    <>
      <Navbar />
      <VpnDetector />
      <Toasts />

      {/* Hero Section */}
      <section 
        className="relative pt-36 pb-20 px-4 md:px-16 min-h-screen flex flex-col justify-center items-center text-center overflow-hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        </div>

        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-primary">
              {isAr ? "منصة المكافآت الذكية المتطورة" : "NEXT-GEN REWARDS HUB"}
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl mb-6 leading-tight text-on-surface font-black tracking-tight max-w-3xl">
            {isAr ? "اضمن أرباحك بطرق ذكية" : t.hero_title_1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
              {isAr ? "مع نظام مكافآت برجون" : t.hero_title_2}
            </span>
          </h1>

          <p className="text-sm md:text-base text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed font-semibold">
            {t.hero_subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link 
              to="/register" 
              className="px-10 py-4.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs shadow-md shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-center"
            >
              {t.hero_cta}
            </Link>
            <a 
              href="#how-it-works" 
              className="px-10 py-4.5 bg-white border border-slate-100 hover:bg-slate-50 text-secondary font-bold rounded-2xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">play_circle</span>
              <span>{t.hero_how}</span>
            </a>
          </div>

          {/* Hero Video */}
          <div className="mt-16 w-full max-w-4xl mx-auto relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(249,115,22,0.15)] border-4 border-white/50 bg-white group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10"></div>
            <video 
              src="/hero-video.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
            />
          </div>
        </div>

        {/* Bento Grid features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative z-10 px-4">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-right shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            <div className="text-right">
              <h3 className="font-display text-base font-black mb-2 text-on-surface">{t.feat_payouts}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">{t.feat_payouts_desc}</p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-right shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">security</span>
            </div>
            <div className="text-right">
              <h3 className="font-display text-base font-black mb-2 text-on-surface">{t.feat_tracking}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">{t.feat_tracking_desc}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-right shadow-sm flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div className="text-right">
              <h3 className="font-display text-base font-black mb-2 text-on-surface">{t.feat_multiplier}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">{t.feat_multiplier_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Feed Ticker */}
      <div className="w-full bg-white border-y border-slate-100 py-4 overflow-hidden shadow-sm">
        <div className="ticker-scroll">
          <div className="flex items-center gap-12 px-6 whitespace-nowrap">
            {[1, 2].map((groupIndex) => (
              <div key={groupIndex} className="flex gap-12">
                <span className="flex items-center gap-2 font-mono text-xs text-on-surface-variant font-bold">
                  <span className="material-symbols-outlined text-primary text-[10px] fill-1">circle</span>
                  Ahmed earned <span className="text-primary font-black">$4.20</span>
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-on-surface-variant font-bold">
                  <span className="material-symbols-outlined text-primary text-[10px] fill-1">circle</span>
                  Sarah just withdrew <span className="text-primary font-black">$25.00 via Vodafone Cash</span>
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-on-surface-variant font-bold">
                  <span className="material-symbols-outlined text-primary text-[10px] fill-1">circle</span>
                  Michael completed <span className="text-amber-500 font-black">TapResearch Survey</span>
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-on-surface-variant font-bold">
                  <span className="material-symbols-outlined text-primary text-[10px] fill-1">circle</span>
                  User #8821 earned <span className="text-primary font-black">$12.50</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <section className="py-20 px-4 md:px-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h4 className="font-display text-4xl md:text-5xl text-primary font-black mb-2">
              {stats.activeUsers.toLocaleString()}+
            </h4>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-body">
              {isAr ? "مستخدم نشط" : "Active Users"}
            </p>
          </div>
          <div>
            <h4 className="font-display text-4xl md:text-5xl text-primary font-black mb-2">{stats.offersDone.toLocaleString()}</h4>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-body">
              {isAr ? "عرض مكتمل" : "Offers Done"}
            </p>
          </div>
          <div>
            <h4 className="font-display text-4xl md:text-5xl text-primary font-black mb-2">${stats.paidOut.toLocaleString()}+</h4>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-body">
              {isAr ? "مدفوعات للأعضاء" : "Paid Out"}
            </p>
          </div>
          <div>
            <h4 className="font-display text-4xl md:text-5xl text-primary font-black mb-2">24/7</h4>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-body">
              {isAr ? "دعم فني متواصل" : "Support"}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works"
        className="py-24 px-4 md:px-16 bg-white border-y border-slate-100 relative overflow-hidden"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/20 -skew-x-12 transform pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 px-4">
          <h2 className="font-display text-3xl font-black mb-16 text-center text-on-surface">
            {t.steps_title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-8 hover:border-primary/20 group-hover:scale-105 transition-all relative z-10 shadow-sm text-primary">
                <span className="material-symbols-outlined text-4xl">person_add</span>
              </div>
              <h3 className="font-display text-base font-black mb-3 text-on-surface">{t.steps_1_title}</h3>
              <p className="text-xs text-on-surface-variant font-semibold max-w-xs leading-relaxed">{t.steps_1_desc}</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-8 hover:border-primary/20 group-hover:scale-105 transition-all relative z-10 shadow-sm text-primary">
                <span className="material-symbols-outlined text-4xl">task</span>
              </div>
              <h3 className="font-display text-base font-black mb-3 text-on-surface">{t.steps_2_title}</h3>
              <p className="text-xs text-on-surface-variant font-semibold max-w-xs leading-relaxed">{t.steps_2_desc}</p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-8 hover:border-primary/20 group-hover:scale-105 transition-all relative z-10 shadow-sm text-primary">
                <span className="material-symbols-outlined text-4xl">payments</span>
              </div>
              <h3 className="font-display text-base font-black mb-3 text-on-surface">{t.steps_3_title}</h3>
              <p className="text-xs text-on-surface-variant font-semibold max-w-xs leading-relaxed">{t.steps_3_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Withdrawal Methods Section */}
      <section 
        className="py-24 px-4 md:px-16 max-w-7xl mx-auto"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="text-center mb-16 px-4">
          <h2 className="font-display text-3xl font-black text-on-surface mb-3">{t.withdraw_title}</h2>
          <p className="text-xs text-on-surface-variant font-bold">{t.withdraw_subtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto px-4">
          {[
            { name: t.withdraw_method_paypal, icon: "payments" },
          ].map((method) => (
            <Link 
              key={method.name}
              to="/withdraw"
              className="bg-white px-8 py-5 rounded-2xl border border-slate-100 hover:border-primary/20 flex items-center gap-4 transition-all hover:-translate-y-0.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-3xl text-primary">{method.icon}</span>
              <span className="font-display text-sm font-black text-on-surface">{method.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section 
        className="py-24 px-4 md:px-16 bg-white border-y border-slate-100"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-on-surface mb-3">{t.leaderboard_title}</h2>
            <p className="text-xs text-on-surface-variant font-bold">{t.leaderboard_subtitle}</p>
          </div>

          <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
            <div className="grid grid-cols-4 p-6 bg-slate-50 border-b border-slate-100 font-mono text-[10px] uppercase font-black text-slate-400">
              <span>{t.leaderboard_rank}</span>
              <span>{t.leaderboard_user}</span>
              <span>{t.leaderboard_tasks}</span>
              <span className="text-right">{t.leaderboard_earnings}</span>
            </div>

            {[
              { rank: 1, name: "CryptoKing", tasks: 1242, coins: 452040, color: "text-primary bg-orange-50 border border-orange-100" },
              { rank: 2, name: "AI_Wizard", tasks: 985, coins: 381020, color: "text-amber-600 bg-amber-50 border border-amber-100" },
              { rank: 3, name: "MatrixEarn", tasks: 870, coins: 294500, color: "text-slate-600 bg-slate-50 border border-slate-100" },
            ].map((row) => (
              <div key={row.rank} className="grid grid-cols-4 p-6 items-center border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${row.color}`}>
                    {row.rank}
                  </span>
                </div>
                <div className="font-body font-black text-xs text-on-surface">{row.name}</div>
                <div className="font-mono text-xs font-semibold text-on-surface-variant">{row.tasks}</div>
                <div className="text-right font-display font-black text-xs text-primary">
                  {row.coins.toLocaleString()} {isAr ? "عملة" : "Coins"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section 
        className="py-24 px-4 md:px-16"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="max-w-7xl mx-auto bg-white rounded-[40px] p-12 md:p-24 text-center relative overflow-hidden border border-slate-100 shadow-sm px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 pointer-events-none"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="font-display text-3xl md:text-5xl font-black mb-8 text-on-surface">
              {t.cta_title}
            </h2>
            <p className="text-xs md:text-sm text-on-surface-variant mb-12 font-semibold leading-relaxed">
              {t.cta_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Link 
                to="/register" 
                className="px-12 py-5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all text-center shadow-md shadow-orange-100"
              >
                {t.cta_button}
              </Link>
              <a 
                href="https://discord.gg" 
                target="_blank" 
                rel="noreferrer" 
                className="px-12 py-5 border border-slate-200 hover:bg-slate-50 text-secondary font-bold rounded-2xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all text-center bg-white shadow-sm"
              >
                {t.cta_discord}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="bg-white border-t border-slate-100 py-20 px-4 md:px-16 text-right"
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-4">
          <div className="flex flex-col items-start gap-4">
            <div className="font-display text-2xl text-primary font-black">BORJOUN</div>
            <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">
              {t.footer_desc}
            </p>
          </div>
          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-black mb-6">Platform</h5>
            <div className="flex flex-col gap-4 text-xs font-semibold text-on-surface-variant">
              <Link to="/offers" className="hover:text-primary">Earn Coins</Link>
              <Link to="/withdraw" className="hover:text-primary">Withdraw</Link>
              <Link to="/dashboard" className="hover:text-primary">User Panel</Link>
            </div>
          </div>
          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-black mb-6">Support</h5>
            <div className="flex flex-col gap-4 text-xs font-semibold text-on-surface-variant">
              <Link to="/support" className="hover:text-primary">Live Tickets</Link>
              <a href="#how-it-works" className="hover:text-primary">FAQ Guide</a>
            </div>
          </div>
          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-black mb-6">Legal</h5>
            <div className="flex flex-col gap-4 text-xs font-semibold text-on-surface-variant">
              <span className="cursor-pointer hover:text-primary">Privacy Policy</span>
              <span className="cursor-pointer hover:text-primary">Terms of Service</span>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-primary font-black uppercase tracking-widest">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>{t.footer_secured}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 px-4">
          <p className="font-mono text-[9px] text-slate-400 font-black tracking-wider">
            © 2026 BORJOUN. ALL RIGHTS RESERVED. PROTOCOL SECURED.
          </p>
          <div className="flex gap-8">
            <span className="font-mono text-[9px] text-slate-400 font-black">REGION: GLOBAL</span>
            <span className="font-mono text-[9px] text-slate-400 font-black">STATUS: ACTIVE</span>
          </div>
        </div>
      </footer>
    </>
  );
}
