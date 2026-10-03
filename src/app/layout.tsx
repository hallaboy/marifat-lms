import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS — Ta’lim boshqaruv platformasi",
  description:
    "O‘quvchilar, o‘qituvchilar, kurslar va ta’lim natijalarini boshqarish platformasi.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // A fresh CSP nonce is generated for every request, so rendering must be dynamic.
  await connection();

  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
