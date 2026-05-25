import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Talk — 한국어 회화 마켓플레이스",
  description: "검증된 한국인 튜터와 1:1 줌으로 한국어를 연습하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
