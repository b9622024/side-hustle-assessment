import type { Metadata } from "next";
import "./globals.css";
import { BuildInfo } from "./_components/build-info";

export const metadata: Metadata = {
  title: "副業適性測驗｜找出適合你的第二收入模式",
  description: "透過工作風格、生命靈數與實際行為，整理你的副業行動輪廓。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}<BuildInfo /></body></html>;
}
