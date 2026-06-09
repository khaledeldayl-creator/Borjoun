import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  wallet_balance: number;
  total_earned: number;
  daily_streak: number;
  last_claim_date: string | null;
  role: string;
  status: string;
  referral_code: string;
  created_at: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "earnings";
}

interface AppState {
  token: string | null;
  user: UserProfile | null;
  lang: "en" | "ar";
  currency: "SAR";
  toasts: ToastMessage[];
  vpnBlocked: boolean;
  adBlockActive: boolean;
  
  // Actions
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  toggleLang: () => void;
  setLang: (lang: "en" | "ar") => void;
  setCurrency: (currency: "SAR") => void;
  addToast: (title: string, message: string, type: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
  setVpnBlocked: (blocked: boolean) => void;
  setAdBlockActive: (active: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  lang: typeof window !== "undefined" ? (localStorage.getItem("lang") as "en" | "ar") || "ar" : "ar",
  currency: "SAR",
  toasts: [],
  vpnBlocked: false,
  adBlockActive: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token });
  },

  setUser: (user) => set({ user }),

  toggleLang: () => set((state) => {
    const newLang = state.lang === "en" ? "ar" : "en";
    localStorage.setItem("lang", newLang);
    return { lang: newLang };
  }),
  
  setLang: (lang) => {
    localStorage.setItem("lang", lang);
    set({ lang });
  },

  setCurrency: (currency) => set({ currency }),

  addToast: (title, message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }],
    }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  setVpnBlocked: (vpnBlocked) => set({ vpnBlocked }),
  
  setAdBlockActive: (adBlockActive) => set({ adBlockActive }),

  logout: async () => {
    try {
      const { isSupabaseConfigured, supabase } = await import("@/utils/supabase");
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("Error signing out from Supabase:", e);
    }
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
}));
