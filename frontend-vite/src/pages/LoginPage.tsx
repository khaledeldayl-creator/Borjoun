"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Toasts from "@/components/Toasts";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/utils/supabase";

export default function Login() {
  const navigate = useNavigate();
  const { lang, token, addToast, setToken, setUser } = useAppStore();
  const t = translations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Error", "Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(supabaseConfigMessage);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session?.access_token) {
        throw new Error("Supabase did not return a valid session. Please try again.");
      }

      setToken(data.session.access_token);
      const profile = await apiRequest("/users/profile");
      setUser(profile);

      addToast("Welcome back!", "Logged in successfully", "success");
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      addToast("Login Failed", message, "error");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      addToast("Error", "Please enter your email", "error");
      return;
    }

    setResetLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(supabaseConfigMessage);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      addToast("Reset Link Sent", "Password reset instructions have been sent to your email.", "success");
      setShowForgotPassword(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send password reset email";
      addToast("Error", message, "error");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Toasts />

      <main className="auth-page" dir={lang === "ar" ? "rtl" : "ltr"}>
        <section className="auth-card">
          <h2 className="auth-title">
            {showForgotPassword ? "Reset Password" : t.nav_login}
          </h2>
          <p className="auth-subtitle">
            {showForgotPassword ? "Enter your email to receive a password reset link" : "Access your secure Borjoun profile"}
          </p>

          {showForgotPassword ? (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div>
                <label className="auth-label">{t.auth_email}</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="auth-input"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <button type="submit" disabled={resetLoading} className="auth-submit neon-glow-purple">
                {resetLoading ? "Sending Link..." : "Send Reset Link"}
              </button>

              <button type="button" onClick={() => setShowForgotPassword(false)} className="auth-text-button">
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
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
                <div className="auth-label-row">
                  <label className="auth-label mb-0">{t.auth_password}</label>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="auth-text-button">
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="Password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="auth-submit neon-glow-purple">
                {loading ? t.auth_verifying : t.auth_login_btn}
              </button>

              <p className="auth-footer-text">
                {t.auth_no_account}{" "}
                <Link to="/register" className="auth-link">
                  {t.nav_signup}
                </Link>
              </p>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
