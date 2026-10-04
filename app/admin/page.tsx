"use client";

import { BookOpen, Books, CalendarBlank, ChalkboardTeacher, ChartBar, ClipboardText, CreditCard, Exam, Gauge, SignOut, Student, UserPlus, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminStats, apiFetch, AuthUser, readCsrfCookie } from "../_lib/api";
import styles from "./styles.module.css";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (!profileResponse.ok) {
          router.replace("/login");
          return;
        }
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "super_admin" && profile.role !== "admin") {
          router.replace("/");
          return;
        }
        setUser(profile);
        const statsResponse = await apiFetch("/api/v1/admin/stats");
        if (!statsResponse.ok) throw new Error("Statistikani yuklab bo‘lmadi");
        setStats((await statsResponse.json()) as AdminStats);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      }
    }
    void load();
  }, [router]);

  async function logout() {
    const csrfToken = readCsrfCookie();
    if (csrfToken) {
      await apiFetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
      }).catch(() => undefined);
    }
    router.replace("/login");
  }

  if (!user && !error) return <main className={styles.loading}>Boshqaruv paneli yuklanmoqda…</main>;

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}><span><BookOpen weight="fill" /></span>ma&apos;rifat</Link>
        <nav>
          <Link href="/admin" className={styles.active}><Gauge weight="fill" />Umumiy ko‘rinish</Link>
          <Link href="/users"><Users />Foydalanuvchilar</Link>
          <Link href="/admin/courses"><BookOpen />Kurslar</Link>
          <Link href="/admin/enrollments"><UserPlus />Biriktirish</Link>
          <Link href="/admin/assessments"><Exam />Testlar</Link>
          <Link href="/admin/assignments"><ClipboardText />Uy vazifalari</Link>
          <Link href="/admin/analytics"><ChartBar />Analitika</Link>
          <Link href="/admin/payments"><CreditCard />To‘lovlar</Link>
          <Link href="/admin/calendar"><CalendarBlank />Taqvim</Link>
          <Link href="/admin/resources"><Books />Resurslar</Link>
          <Link href="/admin/materials"><BookOpen />Multimedia</Link>
        </nav>
        <button onClick={logout}><SignOut />Tizimdan chiqish</button>
      </aside>

      <section className={styles.workspace}>
        <header>
          <div><p>ADMINISTRATOR PANELI</p><h1>Xush kelibsiz, {user?.full_name}</h1></div>
          <span><b>{user?.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</b><small>{user?.email}</small></span>
        </header>
        {error ? <div className={styles.error}>{error}</div> : (
          <>
            <section className={styles.stats}>
              <article><span><Users /></span><div><small>Jami foydalanuvchi</small><strong>{stats?.total_users ?? "—"}</strong></div></article>
              <article><span><Gauge /></span><div><small>Administratorlar</small><strong>{stats?.administrators ?? "—"}</strong></div></article>
              <article><span><ChalkboardTeacher /></span><div><small>O‘qituvchilar</small><strong>{stats?.teachers ?? "—"}</strong></div></article>
              <article><span><Student /></span><div><small>Talabalar</small><strong>{stats?.students ?? "—"}</strong></div></article>
            </section>
            <section className={styles.statusCard}>
              <div><span className={styles.online} /><div><h2>Tizim xavfsiz ishlayapti</h2><p>FastAPI va PostgreSQL ulanishi faol. Sessiyalar server tomonidan boshqariladi.</p></div></div>
              <aside><strong>{stats?.active_sessions ?? 0}</strong><small>Faol sessiya</small></aside>
            </section>
            <section className={styles.nextStep}>
              <p>FAOL MODULLAR</p><h2>Kurslar va foydalanuvchilar boshqaruvi</h2><span>Kurs, dars va nashr jarayonini boshqaring yoki talaba hamda o‘qituvchi hisoblarini yarating.</span>
              <Link href="/admin/courses">Kurslarni boshqarish →</Link>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
