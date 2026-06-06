import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DynamicAdsRenderer from '../components/DynamicAdsRenderer';

const API_URL = 'http://localhost:8000/api';
const BASE_URL = 'http://localhost:8000';
import { useAppStore } from '../store/store';
import { apiRequest } from '../utils/api';

// ── Confetti Component ──────────────────────────
const Confetti = () => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute opacity-80"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            backgroundColor: colors[i % colors.length],
            animationName: 'confetti-fall',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2.5 + Math.random() * 2}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
      <style>
        {`
          @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

// ── Advertisement Banner ────────────────────────
const AdBanner = ({ ads }: { ads: any[] }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!ads || ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  if (!ads || ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <div className="relative w-full max-w-2xl mx-auto my-8 rounded-3xl overflow-hidden border border-slate-100 shadow-sm group">
      <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10">
        {window.location.pathname.includes('coupons') ? (localStorage.getItem('language-storage')?.includes('"lang":"ar"') ? "إعلان مميز ✨" : "Featured Ad ✨") : "إعلان مميز ✨"}
      </div>
      <img
        src={`https://couponsweb-production-1.up.railway.app${ad.imageUrl}`}
        alt="إعلان"
        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {ad.caption && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
          <p className="text-white font-bold text-center">{ad.caption}</p>
        </div>
      )}
    </div>
  );
};

export default function CouponsPage() {
  const { token, user, setUser, lang } = useAppStore();
  const isAr = lang === 'ar';
  const [status, setStatus] = useState<'idle' | 'warning' | 'entering' | 'timer' | 'won' | 'lost' | 'forfeited'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [drawnAt, setDrawnAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const heartbeatRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Load ad + draw status on mount
  useEffect(() => {
    fetchAds();
    checkDrawStatus();
  }, []);

  // Strict Tab Monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if ((document.hidden || document.visibilityState === 'hidden') && status === 'timer') {
        handleForfeit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [status]);

  // Timer logic
  useEffect(() => {
    if (status === 'timer' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(heartbeatRef.current);
            fetchResult();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      heartbeatRef.current = setInterval(() => {
        apiRequest('/draw/heartbeat', { method: 'POST' }).catch(() => { });
      }, 2000);

      return () => {
        clearInterval(timerRef.current);
        clearInterval(heartbeatRef.current);
      };
    }
  }, [status, timeLeft]);

  const fetchAds = async () => {
    try {
      const data = await apiRequest('/advertisement');
      setAds(data || []);
    } catch (_) { }
  };

  const checkDrawStatus = async () => {
    // optional: could still fetch status if needed
  };

  const handleForfeit = async () => {
    clearInterval(timerRef.current);
    clearInterval(heartbeatRef.current);
    setStatus('forfeited');
    try {
      await apiRequest('/draw/forfeit', { method: 'POST' });
    } catch (_) { }
  };

  const fetchResult = async () => {
    try {
      const data = await apiRequest('/draw/result', { method: 'POST' });
      if (data.forfeited) {
        setStatus('forfeited');
      } else if (data.isWinner) {
        setWonAmount(data.couponValue);
        setDrawnAt(new Date());
        setStatus('won');
        // Refresh user profile to get updated balance
        const updatedProfile = await apiRequest('/users/profile');
        setUser(updatedProfile);
      } else {
        setStatus('lost');
      }
    } catch (_) {
      setStatus('lost');
    }
  };

  const handleStartDraw = async () => {
    if (!token) return setErrorMsg(isAr ? 'الرجاء تسجيل الدخول أولاً' : 'Please login first');

    setErrorMsg('');
    setStatus('entering');
    try {
      const data = await apiRequest('/draw/enter', { method: 'POST' });

      if (data.error) {
        setErrorMsg(data.error);
        setStatus('idle');
      } else {
        setTimeLeft(data.timerDuration || 60);
        setStatus('timer');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'حدث خطأ في الاتصال بالسيرفر' : 'Server connection error occurred'));
      setStatus('idle');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setErrorMsg('');
    setWonAmount(null);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col relative w-full max-w-4xl mx-auto pt-8 pb-20">

        {/* Dynamic Header Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-primary">
              {isAr ? "السحب الفوري للكوبونات" : "Instant Coupon Draw"}
            </span>
          </div>
        </div>

        <DynamicAdsRenderer placement="Coupons Page" />
        <AdBanner ads={ads} />

        {/* ── IDLE: Entry Form ── */}
        {(status === 'idle' || (status === 'entering' && !errorMsg)) && (
          <div className="bg-white p-8 md:p-12 rounded-[32px] border border-slate-100 shadow-sm max-w-2xl mx-auto text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <h1 className="font-display text-3xl md:text-4xl font-black mb-4 text-slate-900">
              {isAr ? "اشترك في السحب" : "Enter the Draw"}
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-semibold mb-8">
              {isAr ? "اضغط هنا للمشاركة في السحب الفوري واربح كوبونات قيمة." : "Click here to participate in the instant draw and win valuable coupons."}
            </p>

            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <p className="text-sm text-slate-600 font-bold mb-4">
                {isAr ? "سيتم استخدام حسابك الحالي للاشتراك في السحب تلقائياً." : "Your current account will be used to automatically enter the draw."}
              </p>
              {errorMsg && <p className="text-xs text-rose-500 font-bold mb-2">{errorMsg}</p>}

              <button
                onClick={() => setStatus('warning')}
                disabled={status === 'entering'}
                className="w-full py-4 bg-primary hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-orange-100 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {status === 'entering' ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    <span>{isAr ? "جاري التحقق..." : "Verifying..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isAr ? "ابدأ السحب الآن" : "Start Draw Now"}</span>
                    <span className={`material-symbols-outlined ${isAr ? 'rotate-180' : ''}`}>arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── WARNING STATE ── */}
        {status === 'warning' && (
          <div className="bg-amber-50 p-8 md:p-12 rounded-[32px] border-2 border-amber-400 shadow-lg shadow-amber-100 max-w-2xl mx-auto text-center relative overflow-hidden">
            <span className="material-symbols-outlined text-6xl text-amber-500 mb-4 block">warning</span>
            <h2 className="font-display text-3xl font-black mb-4 text-amber-600">{isAr ? "تنبيه هام!" : "Important Notice!"}</h2>
            <p className="text-sm md:text-base text-amber-800 font-bold leading-relaxed mb-8">
              {isAr ? "يجب البقاء في هذه الصفحة حتى ينتهي المؤقت." : "You must stay on this page until the timer ends."} <br />
              {isAr ? "مغادرة الصفحة أو التبديل لتطبيق آخر سيؤدي إلى فقدان فرصتك فوراً ولن تستطيع المشاركة مرة أخرى اليوم." : "Leaving the page or switching to another app will immediately forfeit your chance and you won't be able to participate again today."}
            </p>
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <button
                onClick={handleStartDraw}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">timer</span>
                <span>{isAr ? "فهمت، ابدأ المؤقت الآن" : "Understood, Start Timer Now"}</span>
              </button>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-white border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold rounded-2xl transition-colors"
              >
                {isAr ? "تراجع" : "Go Back"}
              </button>
            </div>
          </div>
        )}

        {/* ── TIMER STATE ── */}
        {status === 'timer' && (
          <div className="bg-white p-8 md:p-16 rounded-[32px] border border-slate-100 shadow-sm max-w-2xl mx-auto text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>

            <div className="relative z-10">
              <div className="font-mono text-6xl md:text-8xl font-black text-primary mb-6 drop-shadow-sm">
                {formatTime(timeLeft)}
              </div>
              <h2 className="font-display text-2xl font-black mb-2 text-slate-800">{isAr ? "السحب قيد التقدم..." : "Draw in progress..."}</h2>
              <p className="text-rose-500 font-bold bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl inline-block mb-8">
                ⚠️ {isAr ? "لا تقم بمغادرة هذه الصفحة أبداً!" : "DO NOT leave this page!"}
              </p>

              <div className="flex items-center justify-center gap-2 text-slate-500 font-semibold text-sm">
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>{isAr ? "جارٍ التحقق والتأكيد المتواصل..." : "Verifying and confirming continuously..."}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── WON ── */}
        {status === 'won' && (
          <div className="bg-white p-8 md:p-12 rounded-[32px] border-2 border-primary shadow-xl shadow-orange-100 max-w-2xl mx-auto text-center relative overflow-hidden">
            <Confetti />
            <div className="relative z-10">
              <span className="text-6xl mb-4 block">🏆</span>
              <h2 className="font-display text-3xl font-black mb-2 text-slate-900">{isAr ? "مبروك! أنت الفائز! 🎉" : "Congratulations! You are the winner! 🎉"}</h2>
              <p className="text-slate-500 font-bold mb-8">{isAr ? "لقد تم اختيارك كفائز في هذا السحب" : "You have been selected as the winner in this draw"}</p>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 relative group cursor-pointer">
                <div className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-2">{isAr ? "قيمة الجائزة" : "Prize Value"}</div>
                <div className="font-mono text-3xl md:text-4xl font-black text-emerald-500 mb-2" dir="ltr">{wonAmount} E£</div>
                <div className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                  <span>{isAr ? "تم إضافة الرصيد إلى محفظتك بنجاح" : "Balance successfully added to your wallet"}</span>
                </div>
              </div>

              {drawnAt && (
                <p className="text-xs text-slate-400 font-bold mb-8">
                  {isAr ? "تاريخ السحب:" : "Draw Date:"} {new Date(drawnAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </p>
              )}

              <button onClick={handleReset} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all">
                {isAr ? "العودة للصفحة الرئيسية" : "Return to Home Page"}
              </button>
            </div>
          </div>
        )}

        {/* ── LOST ── */}
        {status === 'lost' && (
          <div className="bg-slate-50 p-8 md:p-12 rounded-[32px] border border-slate-200 shadow-sm max-w-2xl mx-auto text-center">
            <span className="text-6xl mb-4 block grayscale opacity-80">🌟</span>
            <h2 className="font-display text-2xl font-black mb-2 text-slate-700">{isAr ? "حاول مرة أخرى، لقد خسرت" : "Try again, you lost"}</h2>
            <p className="text-slate-500 font-semibold mb-8 max-w-sm mx-auto">
              {isAr ? "شكراً لمشاركتك! لم يحالفك الحظ هذه المرة، يمكنك المحاولة في الجولات القادمة." : "Thank you for participating! Better luck next time, you can try again in upcoming rounds."}
            </p>
            <button onClick={handleReset} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-md shadow-orange-100">
              {isAr ? "العودة والمحاولة مجدداً" : "Go back and try again"}
            </button>
          </div>
        )}

        {/* ── FORFEITED ── */}
        {status === 'forfeited' && (
          <div className="bg-rose-50 p-8 md:p-12 rounded-[32px] border border-rose-200 shadow-sm max-w-2xl mx-auto text-center">
            <span className="text-6xl mb-4 block">🚫</span>
            <h2 className="font-display text-2xl font-black mb-4 text-rose-600">{isAr ? "انت طلعت من الموقع!" : "You left the site!"}</h2>
            <p className="text-rose-800/80 font-bold mb-8 max-w-sm mx-auto leading-relaxed">
              {isAr ? "لقد قمت بمغادرة الصفحة أو التبديل لتطبيق آخر أثناء تشغيل المؤقت، مما أدى إلى إلغاء مشاركتك وخسارة فرصتك." : "You left the page or switched to another app while the timer was running, which cancelled your participation and forfeited your chance."}
            </p>
            <button onClick={handleReset} className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-200">
              {isAr ? "العودة" : "Return"}
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
