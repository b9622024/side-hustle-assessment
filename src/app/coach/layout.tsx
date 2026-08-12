import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "教練後台｜副業適性測驗",
  robots: { index: false, follow: false, nocache: true },
};

export default function CoachRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
