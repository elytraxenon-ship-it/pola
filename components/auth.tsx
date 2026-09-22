"use client";

import { useState } from "react";
import { motion, type Variants } from "motion/react";
import { createClient } from "@/lib/supabase/client";

// Simple Google SVG Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export interface AuthProps {
  onLogin?: () => void;
}

export default function Auth({ onLogin }: AuthProps = {}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Email/password login is disabled — show a hint toast
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("چوونەژوورەوەی ئیمەیڵ ناچاڵاکە، تکایە لە ڕێگەی Google بچووە ژوورەوە");
  };

  // Real Google OAuth via Supabase
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        showToast("هەڵەیەک ڕوویدا: " + error.message);
        setLoading(false);
      }
      // On success, browser redirects to Google — no further action needed
    } catch {
      showToast("پەیوەندی بە سوپابەیس نەبوو");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white relative">
      {/* Toast notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg"
          dir="rtl"
        >
          {toast}
        </motion.div>
      )}

      {/* Left Form Section */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Header Branding */}
        <div className="p-6 md:p-10 absolute md:top-4 md:left-4 top-2 left-2">
          <span className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight">POLA</span>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center p-6 md:p-10 mt-4 md:mt-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[420px]"
          >
            {/* Titles */}
            <motion.div variants={itemVariants} className="mb-6 text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                بەخێربێیت بۆ پۆلا
              </h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                پەیوەندی ببەستە لەگەڵ جیهانەکەت، ساتەکانت هاوبەش بکە و ئیلهامبەخش بە.
              </p>
            </motion.div>

            {/* Google Login Button */}
            <motion.div variants={itemVariants} className="mb-4">
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <GoogleIcon className="text-lg" />
                )}
                {loading ? "ئامادەکردن..." : "چوونەژوورەوە لە ڕێگەی گووگڵ"}
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="relative mb-6 flex items-center"
            >
              <div className="grow border-t border-neutral-200"></div>
              <span className="px-4 text-xs font-medium text-neutral-400">یان</span>
              <div className="grow border-t border-neutral-200"></div>
            </motion.div>

            {/* Form — email/password (blocked) */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-2 text-right"
              >
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-neutral-800"
                >
                  ئیمەیڵ
                </label>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-left"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-2 text-right"
              >
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-neutral-800"
                >
                  وشەی تێپەڕ
                </label>
                <input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-left"
                />
              </motion.div>

              {/* Sign in Button */}
              <motion.div variants={itemVariants} className="mt-2">
                <button
                  id="email-signin-btn"
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-b from-[#3a3a3a] to-[#121212] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
                >
                  چوونەژوورەوە
                </button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block lg:w-1/2 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
          <img
            src="https://assets.watermelon.sh/auth-7.avif"
            alt="Pola community background"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
