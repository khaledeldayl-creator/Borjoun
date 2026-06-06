"use client";

import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";

export default function Navbar() {
  const { token, user, lang, toggleLang, logout } = useAppStore();
  const t = translations[lang];
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
      <div 
        className="flex justify-between items-center w-full px-4 md:px-16 py-4 max-w-7xl mx-auto"
        dir={isAr ? "rtl" : "ltr"}
      >
        <Link 
          to="/" 
          className="font-display text-2xl md:text-3xl tracking-tight text-primary font-black hover:opacity-90 transition-opacity"
        >
          BORJOUN
        </Link>
        
        <div className="hidden md:flex gap-8 items-center font-semibold text-xs text-secondary">
          <Link to="/" className="text-primary font-bold">
            {t.nav_home}
          </Link>
          <Link to="/offers" className="hover:text-primary transition-colors">
            {t.nav_offers}
          </Link>
          <Link to="/dashboard" className="hover:text-primary transition-colors">
            {t.nav_dashboard}
          </Link>
          <Link to="/coupons" className="hover:text-primary transition-colors font-bold text-amber-500">
            {isAr ? "الكوبونات" : "Coupons"}
          </Link>
          {user && (user.role === "super_admin" || user.role === "moderator" || user.role === "finance") && (
            <Link to="/admin" className="text-red-500 font-bold hover:text-red-600 transition-colors">
              {t.nav_admin}
            </Link>
          )}
          <Link to="/support" className="hover:text-primary transition-colors">
            {t.t_support}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLang}
            className="font-bold text-sm text-secondary hover:text-primary transition-all cursor-pointer px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary/30 hover:bg-primary/5"
          >
            {isAr ? "English" : "عربي"}
          </button>

          {token ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="hidden md:block font-body text-xs font-bold text-primary bg-orange-50/50 px-4 py-2 rounded-full border border-orange-100/50"
              >
                {user?.username} ({user?.wallet_balance ? parseFloat(user.wallet_balance.toString()).toFixed(0) : 0} 🪙)
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-full font-body text-xs hover:scale-105 transition-all cursor-pointer shadow-sm"
              >
                {t.nav_logout}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="hidden md:block font-body text-xs font-bold text-secondary hover:text-primary transition-all"
              >
                {t.nav_login}
              </Link>
              <Link 
                to="/register"
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-body text-xs hover:scale-105 transition-all shadow-md shadow-orange-100"
              >
                {t.nav_signup}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
