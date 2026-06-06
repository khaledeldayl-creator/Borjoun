import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { getCurrencySymbol } from "@/utils/currency";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, lang, toggleLang, logout, currency, setCurrency } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[lang];
  const isAr = lang === "ar";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState("21:15:50");

  // Countdown timer simulation for sidebar challenge
  useEffect(() => {
    const timer = setInterval(() => {
      const parts = countdown.split(":").map(Number);
      let [h, m, s] = parts;
      if (s > 0) s--;
      else {
        s = 59;
        if (m > 0) m--;
        else {
          m = 59;
          if (h > 0) h--;
          else {
            h = 24;
          }
        }
      }
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    { label: isAr ? "الرئيسية" : "Home", path: "/dashboard", icon: "grid_view" },
    { label: isAr ? "تصفح" : "Browse", path: "/offers", icon: "explore" },
    { label: isAr ? "عروض" : "Offers", path: "/offers?tab=offers", icon: "sell" },
    { label: isAr ? "استطلاعات" : "Surveys", path: "/offers?tab=surveys", icon: "bar_chart" },
    { label: isAr ? "مهام" : "Tasks", path: "/offers?tab=tasks", icon: "task" },
    { label: isAr ? "الكوبونات" : "Coupons", path: "/coupons", icon: "confirmation_number" },
    { label: isAr ? "إعلان" : "Advertise", path: "/support?type=advertise", icon: "campaign" },
    { label: isAr ? "إحالات" : "Referrals", path: "/dashboard#referrals", icon: "group" },
  ];

  return (
    <div 
      className="min-h-screen bg-background text-on-background font-body flex overflow-x-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden lg:flex flex-col w-72 bg-white border-outline/50 fixed top-0 bottom-0 z-30 transition-all shadow-sm ${
          isAr ? "right-0 border-l" : "left-0 border-r"
        }`}
      >
        {/* Logo Branding */}
        <div className="p-8 border-b border-slate-50 flex flex-col gap-1 items-start">
          <Link to="/" className="font-display text-3xl font-black text-on-surface tracking-tight">
            BORJOUN
          </Link>
          <span className="text-[10px] text-primary font-bold tracking-widest uppercase">
            {isAr ? "نظام المكافآت المتطور" : "Advanced Rewards System"}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path.includes("tab") && location.search.includes(item.path.split("?")[1]));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-[0_4px_12px_rgba(255,153,0,0.25)] scale-[1.02]"
                    : "text-secondary hover:bg-slate-50 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Logout Option */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all mt-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
          </button>
        </nav>

        {/* Challenge Widget */}
        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100/50 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-lg">emoji_events</span>
              <span className="text-xs font-bold">{isAr ? "التحدي القادم" : "Next Challenge"}</span>
            </div>
            <div className="font-mono text-sm text-secondary tracking-wider font-semibold">
              {countdown} 2026.05.24
            </div>
            <Link
              to="/withdraw"
              className="w-full py-3 bg-gradient-to-r from-primary to-amber-500 hover:from-primary-hover hover:to-amber-600 text-white font-bold rounded-2xl text-xs text-center shadow-[0_4px_10px_rgba(255,153,0,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isAr ? "تحويل النقاط" : "Convert Points"}
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div 
            className={`w-72 bg-white h-full relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-${
              isAr ? "right" : "left"
            } duration-200 ${isAr ? "mr-auto" : "ml-auto"}`}
          >
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <div className="font-display text-2xl font-black text-on-surface">BORJOUN</div>
                <span className="text-[9px] text-primary font-bold uppercase">
                  {isAr ? "نظام المكافآت المتطور" : "Advanced Rewards System"}
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="material-symbols-outlined text-secondary cursor-pointer"
              >
                close
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "text-secondary hover:bg-slate-50 hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all mt-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                <span>{isAr ? "تسجيل الخروج" : "Logout"}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen ${isAr ? "lg:pr-72" : "lg:pl-72"}`}>
        
        {/* Dashboard Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-md z-20 px-4 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          
          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-secondary hover:text-primary transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Actions Container */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <button
              onClick={toggleLang}
              className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-secondary hover:text-primary hover:border-primary/20 transition-all cursor-pointer shadow-sm"
              title={isAr ? "Change to English" : "تغيير للغة العربية"}
            >
              <span className="material-symbols-outlined text-lg">language</span>
            </button>
          </div>

          {/* User Profile Info Card */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Settings & Alerts */}
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/support"
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-secondary hover:text-primary hover:border-primary/20 transition-all cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                </Link>
                <Link
                  to="/support"
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-secondary hover:text-primary hover:border-primary/20 transition-all cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">settings</span>
                </Link>
              </div>

              {/* Level / User Card */}
              <div className="flex items-center gap-3 bg-white border border-slate-100/80 px-4 py-2 rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-primary font-black border border-slate-100 font-display text-xs">
                  {isAr ? "ر" : "U"}
                </div>
                <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-xs font-bold text-on-surface">{user.username}</span>
                  <span className="text-[9px] text-secondary-variant font-bold">
                    {isAr ? `المركز: 5` : `Rank: 5`}
                  </span>
                </div>
                <div className="border-r border-slate-100 h-6 mx-1"></div>
                <span className="text-[10px] font-black bg-amber-50 border border-amber-200 text-amber-600 px-2 py-1 rounded-lg">
                  Lv.0
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-8">
          {children}
        </main>

        {/* Dashboard Footer */}
        <footer className="mt-auto py-8 px-4 md:px-8 bg-white border-t border-slate-50 text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant font-semibold">
          <div>
            © 2026 BORJOUN. {isAr ? "جميع الحقوق محفوظة لنظام مكافآت برجون" : "All rights reserved."}
          </div>
          <div className="flex gap-4">
            <Link to="/support" className="hover:text-primary">{isAr ? "الأسئلة الشائعة" : "FAQ"}</Link>
            <Link to="/support" className="hover:text-primary">{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
            <Link to="/support" className="hover:text-primary">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
            <Link to="/support" className="hover:text-primary">{isAr ? "الدعم الفني" : "Support"}</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
