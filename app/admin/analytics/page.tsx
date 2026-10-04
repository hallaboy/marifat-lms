"use client";

import {
  ArrowLeft,
  BookOpen,
  ChartBar,
  CheckCircle,
  ClipboardText,
  Exam,
  Student,
  TrendUp,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminAnalytics, apiFetch, AuthUser } from "../../_lib/api";
import styles from "./styles.module.css";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") {
          return router.replace("/");
        }
        const response = await apiFetch("/api/v1/admin/analytics");
        if (!response.ok) throw new Error("Analitikani yuklab bo‘lmadi");
        setAnalytics((await response.json()) as AdminAnalytics);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const overview = analytics?.overview;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/admin"><ArrowLeft /> Boshqaruv paneli</Link>
        <div><p>O‘QUV ANALITIKASI</p><h1>Natijalar va faollik</h1><span>Kurslar bo‘yicha o‘zlashtirish, test va vazifalar holatini kuzating.</span></div>
        <ChartBar weight="duotone" />
      </header>

      {loading && <section className={styles.state}>Analitika yuklanmoqda…</section>}
      {error && <section className={`${styles.state} ${styles.error}`}>{error}</section>}

      {analytics && overview && (
        <>
          <section className={styles.primaryStats}>
            <article><span className={styles.purple}><TrendUp /></span><div><small>O‘rtacha o‘zlashtirish</small><strong>{overview.average_course_progress}%</strong><p>{overview.completed_enrollments} ta kurs yakunlangan</p></div></article>
            <article><span className={styles.blue}><Exam /></span><div><small>Test natijasi</small><strong>{overview.average_assessment_score}%</strong><p>O‘tish ko‘rsatkichi {overview.assessment_pass_rate}%</p></div></article>
            <article><span className={styles.orange}><ClipboardText /></span><div><small>Vazifalar natijasi</small><strong>{overview.average_assignment_score}%</strong><p>{overview.graded_assignments} ta ish baholangan</p></div></article>
            <article><span className={styles.green}><Student /></span><div><small>Faol o‘quv jarayoni</small><strong>{overview.active_enrollments}</strong><p>Jami {overview.total_enrollments} ta biriktirish</p></div></article>
          </section>

          <section className={styles.activity}>
            <div><CheckCircle /><span><strong>{overview.completed_lessons}</strong><small>yakunlangan dars</small></span></div>
            <div><Exam /><span><strong>{overview.submitted_assessments}</strong><small>topshirilgan test</small></span></div>
            <div><ClipboardText /><span><strong>{overview.assignment_submissions}</strong><small>yuborilgan vazifa</small></span></div>
          </section>

          <section className={styles.courseSection}>
            <div className={styles.sectionTitle}><div><p>KURSLAR KESIMIDA</p><h2>O‘zlashtirish jadvali</h2></div><span>{analytics.courses.length} ta kurs</span></div>
            {analytics.courses.length === 0 ? (
              <div className={styles.empty}><BookOpen /><h3>Hali kurslar yaratilmagan</h3><p>Kurslar paydo bo‘lgach, ularning natijalari shu yerda ko‘rinadi.</p></div>
            ) : (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Kurs</th><th>O‘quvchilar</th><th>Yakunlagan</th><th>O‘zlashtirish</th><th>Test natijasi</th><th>Vazifalar</th></tr></thead>
                  <tbody>{analytics.courses.map((course) => (
                    <tr key={course.course_id}>
                      <td><Link href={`/admin/courses/${course.course_id}`}>{course.course_title}</Link></td>
                      <td>{course.enrollment_count}</td>
                      <td>{course.completed_enrollments}</td>
                      <td><div className={styles.progressCell}><span><i style={{ width: `${course.average_progress}%` }} /></span><b>{course.average_progress}%</b></div></td>
                      <td><b>{course.average_assessment_score}%</b><small>{course.submitted_assessments} urinish</small></td>
                      <td><b>{course.assignment_submissions}</b><small>topshiriq</small></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
