"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/utils/supabase";
import { useAppStore } from "@/store/store";
import { apiRequest } from "@/utils/api";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setToken, setUser, addToast } = useAppStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setToken(null);
      setUser(null);
      return;
    }

    // 1. Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        apiRequest("/users/profile")
          .then((profile) => {
            if (profile.role === "user") {
              addToast("Access Denied", "You do not have administrative permissions.", "error");
              supabase.auth.signOut();
              setToken(null);
              setUser(null);
            } else {
              setUser(profile);
            }
          })
          .catch((err) => {
            console.error("Error fetching profile on mount:", err);
            supabase.auth.signOut();
            setToken(null);
            setUser(null);
          });
      } else {
        setToken(null);
        setUser(null);
      }
    });

    // 2. Listen to authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setToken(session.access_token);
        try {
          const profile = await apiRequest("/users/profile");
          if (profile.role === "user") {
            addToast("Access Denied", "You do not have administrative permissions.", "error");
            supabase.auth.signOut();
            setToken(null);
            setUser(null);
          } else {
            setUser(profile);
          }
        } catch (err) {
          console.error("Error fetching profile on auth change:", err);
          if (event === "SIGNED_IN") {
            supabase.auth.signOut();
            setToken(null);
            setUser(null);
          }
        }
      } else {
        setToken(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setToken, setUser]);

  return <>{children}</>;
}
