"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Auth from "@/components/auth";
import HomePage from "@/components/home-page";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function checkUser(currentUser: User) {
      setUser(currentUser);

      try {
        // Check if this is a new user who hasn't completed onboarding
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profile && profile.onboarding_completed === false) {
          router.replace("/onboarding");
          return;
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      }

      // Only mark as authenticated for homepage if onboarding is completed or not required
      setIsAuthenticated(true);
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUser(session.user);
      } else {
        supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
          if (currentUser) {
            checkUser(currentUser);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        });
      }
    });

    // Listen for auth state changes (OAuth callback, sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  // Loading state while checking session
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl font-bold tracking-tight text-foreground animate-pulse">
            POLA
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return <HomePage onLogout={handleLogout} />;
}
