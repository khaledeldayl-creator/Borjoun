"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Toasts from "@/components/Toasts";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/utils/supabase";

export default function Register() {
  const navigate = useNavigate();
  const { lang, addToast } = useAppStore();
  const t = translations[lang];

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      addToast("Error", "Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(supabaseConfigMessage);
      }

      const checkRes = await apiRequest(`/auth/check-username?username=${encodeURIComponent(username)}`);
      if (checkRes.exists) {
        addToast("Registration Failed", "Username is already taken.", "error");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            referral_code: referralCode || undefined,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      addToast("Registration Success", "Account created! Please check your email to verify and complete signup.", "success");
      navigate("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not register account";
      addToast("Registration Failed", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Toasts />

      <main className="auth-page" dir={lang === "ar" ? "rtl" : "ltr"}>
        <section className="auth-card">
          <h2 className="auth-title">{t.auth_create}</h2>
          <p className="auth-subtitle">Join the Next-Gen AI rewards ecosystem</p>

          <form onSubmit={handleRegister} className="auth-form">
            <div>
              <label className="auth-label">{t.auth_username}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-input"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="auth-label">{t.auth_email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="auth-label">{t.auth_password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Password"
                required
              />
            </div>

            <div>
              <label className="auth-label">Referral Code (Optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="auth-input"
                placeholder="REF-XXXXXX"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit neon-glow-purple">
              {loading ? "Registering Account..." : t.auth_create}
            </button>

            <p className="auth-footer-text">
              {t.auth_has_account}{" "}
              <Link to="/login" className="auth-link">
                {t.nav_login}
              </Link>
            </p>
          </form>
        </section>
      </main>
    </>
  );
}
