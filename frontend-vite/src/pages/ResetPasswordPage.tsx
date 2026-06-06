"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Toasts from "@/components/Toasts";
import { useAppStore } from "@/store/store";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "@/utils/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { lang, addToast } = useAppStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      addToast("Error", "Please fill in all fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Error", "Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Error", "Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(supabaseConfigMessage);
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      addToast("Password Updated", "Your password has been successfully reset. You can now log in.", "success");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update password";
      addToast("Reset Failed", message, "error");
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
          <h2 className="auth-title">Set New Password</h2>
          <p className="auth-subtitle">Create a secure new password for your account</p>

          <form onSubmit={handleReset} className="auth-form">
            <div>
              <label className="auth-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-input"
                placeholder="Password"
                required
              />
            </div>

            <div>
              <label className="auth-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="Confirm password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit neon-glow-purple">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
