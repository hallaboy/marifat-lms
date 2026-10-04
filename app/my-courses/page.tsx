"use client";

import { ArrowRight, BookOpen, CalendarBlank, ChartBar, CheckCircle, ClipboardText, Clock, Exam, LockKey, SignOut, Stack } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, MyCourse, readCsrfCookie } from "../_lib/api";
import styles from "./styles.module.css";

const statusName = { active: "Davom etmoqda", completed: "Tugallangan", suspended: "To‘xtatilgan" };

export default function MyCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "student") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/courses");
        setUser(profile);
        const response = await apiFetch("/api/v1/me/courses");
        if (!response.ok) throw new Error("Kurslaringizni yuklab bo‘lmadi");
        setCourses((await response.json()) as MyCourse[]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  async function logout() {
    const token = readCsrfCookie();
    if (token) await apiFetch("/api/v1/auth/logout", { method: "POST", headers: { "X-CSRF-Token": token } }).catch(() => undefined);
    router.replace("/login");
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link><div><Link href="/calendar" style={{ color: "#6048dc", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><CalendarBlank /> Taqvim</Link><Link href="/results" style={{ color: "#6048dc", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><ChartBar /> Natijalar</Link><Link href="/assignments" style={{ color: "#6048dc", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><ClipboardText /> Vazifalar</Link><Link href="/assessments" style={{ color: "#6048dc", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><Exam /> Testlar</Link><span>{user?.full_name}</span><button onClick={logout}><SignOut /> Chiqish</button></div></header>
      <section className={styles.hero}><p>SHAXSIY KABINET</p><h1>Mening kurslarim</h1><span>Biriktirilgan kurslarni davom ettiring va natijangizni kuzating.</span></section>
      <section className={styles.grid}>
        {loading && <div className={styles.state}>Kurslar yuklanmoqda…</div>}
        {error && <div className={`${styles.state} ${styles.error}`}><LockKey /><b>{error}</b></div>}
        {!loading && !error && courses.map((item, index) => (
          <article key={item.enrollment_id}>
            <div className={`${styles.art} ${styles[`art${index % 4}`]}`}><span>{item.course.category}</span><BookOpen weight="duotone" /></div>
            <div className={styles.body}>
              <div className={styles.topline}><small className={styles[item.status]}>{statusName[item.status]}</small><span><Clock /> {item.course.duration_weeks} hafta</span></div>
              <h2>{item.course.title}</h2><p>{item.course.summary}</p>
              <div className={styles.progressText}><span>O‘zlashtirish</span><strong>{item.progress_percent}%</strong></div>
              <div className={styles.progress}><i style={{ width: `${item.progress_percent}%` }} /></div>
              <footer><span><Stack /> {item.course.lesson_count} dars</span>{item.status === "suspended" ? <b>Kurs vaqtincha yopilgan</b> : <Link href={`/courses/${item.course.id}`}>{item.status === "completed" ? <><CheckCircle /> Qayta ko‘rish</> : <>Davom ettirish <ArrowRight /></>}</Link>}</footer>
            </div>
          </article>
        ))}
        {!loading && !error && courses.length === 0 && <div className={styles.empty}><BookOpen weight="duotone" /><h2>Sizga hali kurs biriktirilmagan</h2><p>Administrator kurs biriktirgach, u shu sahifada paydo bo‘ladi.</p><Link href="/courses">Kurslar katalogini ko‘rish</Link></div>}
      </section>
    </main>
  );
}
