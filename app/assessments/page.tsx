"use client";

import { ArrowLeft, ArrowRight, CheckCircle, Clock, Exam, LockKey, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, StudentAssessment } from "../_lib/api";
import styles from "./styles.module.css";

const typeName = { quiz: "Test", exam: "Imtihon" };

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "student") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/courses");
        const response = await apiFetch("/api/v1/me/assessments");
        if (!response.ok) throw new Error("Testlarni yuklab bo‘lmadi");
        setAssessments((await response.json()) as StudentAssessment[]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  return (
    <main className={styles.shell}>
      <header><Link href="/my-courses"><ArrowLeft /> Mening kurslarim</Link><span><Exam weight="fill" /> Testlar</span></header>
      <section className={styles.hero}><p>BILIMNI TEKSHIRISH</p><h1>Test va imtihonlar</h1><span>Biriktirilgan kurslaringiz bo‘yicha natijalarni mustahkamlang.</span></section>
      <section className={styles.grid}>
        {loading && <div className={styles.state}>Testlar yuklanmoqda…</div>}
        {error && <div className={`${styles.state} ${styles.error}`}><LockKey /><b>{error}</b></div>}
        {!loading && !error && assessments.map((assessment, index) => (
          <article key={assessment.id}>
            <div className={`${styles.art} ${styles[`art${index % 4}`]}`}><Exam weight="duotone" /><span>{typeName[assessment.assessment_type]}</span></div>
            <div className={styles.body}><small>{assessment.course_title}</small><h2>{assessment.title}</h2><p>{assessment.instructions ?? "Savollarga javob bering va natijangizni darhol bilib oling."}</p><div className={styles.meta}><span><Exam /> {assessment.question_count} savol</span><span><Clock /> {assessment.time_limit_minutes ? `${assessment.time_limit_minutes} daqiqa` : "Cheklanmagan"}</span></div>{assessment.latest_score_percent !== null && <div className={`${styles.result} ${assessment.latest_passed ? styles.passed : styles.failed}`}>{assessment.latest_passed ? <CheckCircle weight="fill" /> : <XCircle weight="fill" />}<span><b>{assessment.latest_score_percent}%</b><small>{assessment.latest_passed ? "Muvaffaqiyatli" : "Qayta urinib ko‘ring"}</small></span></div>}<footer><span>{assessment.attempts_used} / {assessment.max_attempts} urinish</span><Link href={`/assessments/${assessment.id}`}>{assessment.latest_score_percent === null ? "Boshlash" : "Ko‘rish"} <ArrowRight /></Link></footer></div>
          </article>
        ))}
        {!loading && !error && assessments.length === 0 && <div className={styles.empty}><Exam weight="duotone" /><h2>Hozircha test yo‘q</h2><p>Kursingiz uchun test nashr qilinganda shu yerda ko‘rinadi.</p></div>}
      </section>
    </main>
  );
}
