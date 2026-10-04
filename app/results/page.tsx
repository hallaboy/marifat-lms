"use client";

import { ArrowLeft, BookOpen, CheckCircle, ClipboardText, Exam, Medal, Trophy, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, StudentAnalytics } from "../_lib/api";
import styles from "./styles.module.css";

const formatDate = (value: string) => new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default function ResultsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
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
        const response = await apiFetch("/api/v1/me/analytics");
        if (!response.ok) throw new Error("Natijalarni yuklab bo‘lmadi");
        setAnalytics((await response.json()) as StudentAnalytics);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const summary = analytics?.summary;

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}><Link href="/my-courses" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link><span>{user?.full_name}</span></header>
      <section className={styles.hero}><Link href="/my-courses"><ArrowLeft /> Kurslarimga qaytish</Link><p>SHAXSIY NATIJALAR</p><h1>O‘zlashtirish ko‘rsatkichlari</h1><span>Kurslar, testlar va uy vazifalaridagi natijalaringiz bir joyda.</span><Trophy weight="duotone" /></section>

      {loading && <section className={styles.state}>Natijalar yuklanmoqda…</section>}
      {error && <section className={`${styles.state} ${styles.error}`}>{error}</section>}

      {analytics && summary && (
        <div className={styles.content}>
          <section className={styles.stats}>
            <article><BookOpen /><div><small>Kurslarim</small><strong>{summary.enrolled_courses}</strong><p>{summary.completed_courses} tasi yakunlangan</p></div></article>
            <article><CheckCircle /><div><small>Yakunlangan darslar</small><strong>{summary.completed_lessons}</strong><p>faoliyat qayd etildi</p></div></article>
            <article><Exam /><div><small>Test natijasi</small><strong>{summary.average_assessment_score}%</strong><p>{summary.passed_assessments} ta testdan o‘tildi</p></div></article>
            <article><Medal /><div><small>Vazifalar natijasi</small><strong>{summary.average_assignment_score}%</strong><p>baholangan ishlar bo‘yicha</p></div></article>
          </section>

          <section className={styles.panel}>
            <div className={styles.title}><div><p>KURSLAR</p><h2>O‘quv jarayoni</h2></div><BookOpen /></div>
            <div className={styles.courseGrid}>{analytics.courses.map((course) => (
              <Link href={`/courses/${course.course_id}`} className={styles.course} key={course.course_id}>
                <div><h3>{course.course_title}</h3><span>{course.completed_lessons}/{course.total_lessons} dars yakunlangan</span></div>
                <strong>{course.progress_percent}%</strong>
                <div className={styles.progress}><i style={{ width: `${course.progress_percent}%` }} /></div>
              </Link>
            ))}{analytics.courses.length === 0 && <p className={styles.empty}>Hali biriktirilgan kurslar yo‘q.</p>}</div>
          </section>

          <div className={styles.columns}>
            <section className={styles.panel}>
              <div className={styles.title}><div><p>TEST VA IMTIHONLAR</p><h2>So‘nggi natijalar</h2></div><Exam /></div>
              <div className={styles.list}>{analytics.assessments.map((item) => (
                <article key={item.assessment_id}>
                  <span className={item.passed ? styles.passed : styles.failed}>{item.passed ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}</span>
                  <div><h3>{item.title}</h3><p>{item.course_title} · {item.attempt_number}-urinish</p><small>{formatDate(item.submitted_at)}</small></div>
                  <strong>{item.score_percent}%</strong>
                </article>
              ))}{analytics.assessments.length === 0 && <p className={styles.empty}>Topshirilgan testlar hali yo‘q.</p>}</div>
            </section>

            <section className={styles.panel}>
              <div className={styles.title}><div><p>UY VAZIFALARI</p><h2>Baholash holati</h2></div><ClipboardText /></div>
              <div className={styles.list}>{analytics.assignments.map((item) => (
                <article key={item.assignment_id}>
                  <span className={item.status === "graded" ? styles.passed : styles.pending}><ClipboardText weight="fill" /></span>
                  <div><h3>{item.title}</h3><p>{item.course_title}</p><small>{item.feedback ?? (item.status === "graded" ? "Baholandi" : "O‘qituvchi bahosi kutilmoqda")}</small></div>
                  <strong>{item.score === null ? "—" : `${item.score}/${item.max_score}`}</strong>
                </article>
              ))}{analytics.assignments.length === 0 && <p className={styles.empty}>Yuborilgan vazifalar hali yo‘q.</p>}</div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
