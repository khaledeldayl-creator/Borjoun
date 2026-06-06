"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/utils/supabase";
import { useAppStore } from "@/store/store";
import { apiRequest } from "@/utils/api";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setToken, setUser } = useAppStore();

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
          .then((profile) => setUser(profile))
          .catch((err) => {
            console.error("Error fetching profile on mount:", err);
            // If the user profile cannot be fetched (e.g. backend rejects token or user is banned/suspended)
            // we sign out from Supabase to prevent stuck half-logged-in state.
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
          setUser(profile);
        } catch (err) {
          console.error("Error fetching profile on auth change:", err);
          // If we fail to fetch profile (e.g. banned user, trigger hasn't finished, etc.)
          // we only sign out if the user is explicitly signed in but profile call fails.
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
