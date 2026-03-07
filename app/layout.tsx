import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, DM_Mono } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "360醫療AI大調查 | 醫美評鑑 · 全台最大",
  description: "全台唯一五維度AI評鑑，查診所、查醫師、查療程，司法糾紛・合法登記・真實口碑一次查完。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${notoSansTC.variable} ${notoSerifTC.variable} ${dmMono.variable} antialiased`}
      >
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
