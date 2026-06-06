import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/store';
import LoginPage from '@/pages/LoginPage';
import AdminPage from '@/pages/AdminPage';
import Toasts from '@/components/Toasts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { token, user } = useAppStore();

  // If token is stored but user profile is still loading on mount
  if (token && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-display text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-slate-400 text-sm font-medium tracking-wide">
          Verifying security keys...
        </p>
      </div>
    );
  }

  const isAuth = !!token && !!user && user.role !== 'user';

  return (
    <>
      <Toasts />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={isAuth ? <AdminPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}
