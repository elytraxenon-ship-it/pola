import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Script from "next/script";
import { AppInstallProvider } from "@/components/app-install";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "پۆلا - تۆڕی کۆمەڵایەتی",
  description: "لەگەڵ جیهانەکەت پەیوەندی ببەستە لە پۆلا",
  icons: { apple: { url: "/pwa-icons/apple.png", sizes: "180x180", type: "image/png" } },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

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
        <LanguageProvider>
          <AppInstallProvider>{children}</AppInstallProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

