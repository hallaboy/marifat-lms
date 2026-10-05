import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sitlearning.uz"),
  title: {
    default: "sitlearning — Zamonaviy ta'lim platformasi",
    template: "%s | sitlearning",
  },
  description: "sitlearning.uz — kurslar, darslar va natijalarni bir joyda boshqarish platformasi.",
  applicationName: "sitlearning",
  keywords: [
    "sitlearning",
    "LMS",
    "onlayn ta'lim",
    "masofaviy ta'lim",
    "o'quv platformasi",
    "onlayn kurslar",
  ],
  creator: "sitlearning",
  publisher: "sitlearning",
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "/",
    siteName: "sitlearning",
    title: "sitlearning — Zamonaviy ta'lim platformasi",
    description: "Kurslar, darslar, topshiriqlar va natijalarni yagona xavfsiz LMS muhitida boshqaring.",
  },
  twitter: {
    card: "summary",
    title: "sitlearning — Zamonaviy ta'lim platformasi",
    description: "Kurslar, darslar, topshiriqlar va natijalarni yagona xavfsiz LMS muhitida boshqaring.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "sitlearning",
  url: "https://sitlearning.uz",
  logo: "https://sitlearning.uz/icon.svg",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "sitlearning",
  url: "https://sitlearning.uz",
  inLanguage: "uz",
  description: "Kurslar, darslar, topshiriqlar va natijalarni boshqarish uchun zamonaviy LMS platformasi.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A fresh CSP nonce is generated for every request.
  await connection();

  return (
    <html lang="uz">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
