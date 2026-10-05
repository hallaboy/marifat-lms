import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sitlearning.uz"),
  title: "sitlearning — Zamonaviy ta'lim platformasi",
  description: "sitlearning.uz — kurslar, darslar va natijalarni bir joyda boshqarish platformasi.",
  applicationName: "sitlearning",
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
