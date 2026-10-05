"use client";

import { Bell, BookOpen, Books, ChartBar, ClipboardText, Exam, Lifebuoy, PlugsConnected, SignOut, Student, TrendUp, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, readCsrfCookie, TeacherDashboard } from "../_lib/api";
import styles from "./styles.module.css";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "teacher") {
          return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/my-courses");
        }
        setUser(profile);
        const response = await apiFetch("/api/v1/teacher/dashboard");
        if (!response.ok) throw new Error("O‘qituvchi kabinetini yuklab bo‘lmadi");
        setDashboard((await response.json()) as TeacherDashboard);
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

  const overview = dashboard?.overview;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/teacher" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link>
        <nav><Link href="/notifications"><Bell /> Xabarlar</Link><Link href="/resources"><Books /> Resurslar</Link><Link href="/integrations"><PlugsConnected /> Telegram</Link><Link href="/help"><Lifebuoy /> Yordam</Link></nav>
        <div className={styles.profile}><span><small>O‘qituvchi</small><b>{user?.full_name}</b></span><button onClick={logout}><SignOut /> Chiqish</button></div>
      </header>

      <section className={styles.hero}><div><p>O‘QITUVCHI KABINETI</p><h1>Xush kelibsiz, {user?.full_name?.split(" ")[0] ?? "ustoz"}!</h1><span>Biriktirilgan kurslar, talabalar natijalari va tekshiriladigan vazifalar bir joyda.</span></div><ChartBar weight="duotone" /></section>

      {loading && <section className={styles.state}>Kabinet yuklanmoqda…</section>}
      {error && <section className={`${styles.state} ${styles.error}`}>{error}</section>}

      {overview && dashboard && <>
        <section className={styles.stats}>
          <article><i className={styles.purple}><BookOpen /></i><div><small>Biriktirilgan kurslar</small><strong>{overview.assigned_courses}</strong><span>ta kurs</span></div></article>
          <article><i className={styles.blue}><UsersThree /></i><div><small>Jami talabalar</small><strong>{overview.total_students}</strong><span>{overview.active_students} tasi faol</span></div></article>
          <article><i className={styles.green}><TrendUp /></i><div><small>O‘rtacha progress</small><strong>{overview.average_progress}%</strong><span>kurslar bo‘yicha</span></div></article>
          <article><i className={styles.orange}><ClipboardText /></i><div><small>Tekshiriladigan ishlar</small><strong>{overview.pending_submissions}</strong><span>ta yangi javob</span></div></article>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionTitle}><div><p>MENING KURSLARIM</p><h2>Kurslar va o‘zlashtirish</h2></div><span><Exam /> Test o‘rtachasi {overview.average_assessment_score}%</span></div>
          {dashboard.courses.length === 0 ? <div className={styles.empty}><BookOpen /><h3>Sizga hali kurs biriktirilmagan</h3><p>Administrator kurs biriktirgach, u shu yerda ko‘rinadi.</p></div> : <div className={styles.courseGrid}>{dashboard.courses.map((course) => <article className={styles.courseCard} key={course.course_id}>
            <div className={styles.cardTop}><span>{course.category}</span><small className={styles[course.status]}>{course.status === "published" ? "Nashr qilingan" : course.status === "draft" ? "Qoralama" : "Arxiv"}</small></div>
            <h3>{course.title}</h3>
            <div className={styles.courseNumbers}><span><Student /> <b>{course.student_count}</b><small>talaba</small></span><span><BookOpen /> <b>{course.lesson_count}</b><small>dars</small></span><span><ClipboardText /> <b>{course.pending_submissions}</b><small>yangi ish</small></span></div>
            <div className={styles.progressText}><span>O‘rtacha o‘zlashtirish</span><b>{course.average_progress}%</b></div><div className={styles.progress}><i style={{ width: `${course.average_progress}%` }} /></div>
            <footer><span>{course.completed_students} talaba yakunlagan</span><span className={styles.cardLinks}><Link href={`/teacher/courses/${course.course_id}`}>Natijalar</Link><Link href={`/teacher/courses/${course.course_id}/manage`}>Kontent →</Link></span></footer>
          </article>)}</div>}
        </section>
      </>}
    </main>
  );
}
