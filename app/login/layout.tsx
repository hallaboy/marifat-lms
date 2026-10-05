import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tizimga kirish",
  description: "sitlearning LMS platformasiga administrator, o‘qituvchi yoki talaba sifatida xavfsiz kiring.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "/login",
    siteName: "sitlearning",
    title: "sitlearning LMS — Tizimga kirish",
    description: "Administrator, o‘qituvchi va talabalar uchun yagona xavfsiz ta’lim platformasi.",
  },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
