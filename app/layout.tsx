import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma'rifat — Zamonaviy ta'lim platformasi",
  description: "Kurslar, darslar va natijalarni bir joyda boshqaring.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
