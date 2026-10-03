import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma'rifat — Zamonaviy ta'lim platformasi",
  description: "Kurslar, darslar va natijalarni bir joyda boshqaring.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A fresh CSP nonce is generated for every request.
  await connection();

  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
