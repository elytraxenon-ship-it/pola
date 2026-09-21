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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ckb" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

