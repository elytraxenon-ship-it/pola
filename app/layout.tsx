import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "پۆلا - تۆڕی کۆمەڵایەتی",
  description: "لەگەڵ جیهانەکەت پەیوەندی ببەستە لە پۆلا",
};

import { LanguageProvider } from "@/lib/language-context";
import Script from "next/script";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ckb" dir="rtl" suppressHydrationWarning className={`${vazirmatn.variable} h-full antialiased`}>
      <head>
        <Script
          id="pola-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try { var t = localStorage.getItem('pola_theme'); var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', d); } catch (_) {}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

