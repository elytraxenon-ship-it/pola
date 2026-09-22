import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isSafeRedirect(next: string | null): boolean {
  if (!next) return false;
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeRedirect = isSafeRedirect(next) ? next : "/";

  if (code) {
    const cookiesToSetLater: { name: string; value: string; options?: any }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              cookiesToSetLater.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let destination = safeRedirect;

      // Check if user needs onboarding
      const user = sessionData?.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        // If new user or onboarding not finished, redirect directly to /onboarding
        if (profile && profile.onboarding_completed === false) {
          destination = "/onboarding";
        }
      }

      const response = NextResponse.redirect(new URL(destination, origin));

      // CRITICAL: Copy all Supabase auth session cookies onto the redirect response
      cookiesToSetLater.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return response;
    }

    console.error("[auth/callback] Error exchanging code:", error.message);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  return NextResponse.redirect(new URL("/?error=no_code", origin));
}
