import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
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
  toasts: ToastMessage[];
  
  // Actions
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  toggleLang: () => void;
  addToast: (title: string, message: string, type: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  lang: "en",
  toasts: [],

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token });
  },

  setUser: (user) => set({ user }),

  toggleLang: () => set((state) => ({ lang: state.lang === "en" ? "ar" : "en" })),
  
  addToast: (title, message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, title, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  logout: async () => {
    try {
      const { supabase } = await import("@/utils/supabase");
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error signing out:", e);
    }
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
}));
