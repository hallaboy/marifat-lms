"use client";

import { ArrowLeft, ArrowRight, CheckCircle, ClipboardText, Clock, LockKey, PaperPlaneTilt } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, StudentAssignment } from "../_lib/api";
import styles from "./styles.module.css";

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "student") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/courses");
        const response = await apiFetch("/api/v1/me/assignments");
        if (!response.ok) throw new Error("Uy vazifalarini yuklab bo‘lmadi");
        setAssignments((await response.json()) as StudentAssignment[]);
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
      <header><Link href="/my-courses"><ArrowLeft /> Mening kurslarim</Link><span><ClipboardText weight="fill" /> Uy vazifalari</span></header>
      <section className={styles.hero}><p>AMALIY MASHG‘ULOTLAR</p><h1>Uy vazifalari</h1><span>Vazifalarni muddatida yuboring va o‘qituvchi fikrini kuzating.</span></section>
      <section className={styles.list}>
        {loading && <div className={styles.state}>Vazifalar yuklanmoqda…</div>}
        {error && <div className={`${styles.state} ${styles.error}`}><LockKey /><b>{error}</b></div>}
        {!loading && !error && assignments.map((assignment) => <article key={assignment.id}><div className={styles.icon}><ClipboardText weight="duotone" /></div><div className={styles.body}><small>{assignment.course_title}</small><h2>{assignment.title}</h2><p>{assignment.description}</p><div className={styles.meta}><span><Clock /> {assignment.due_at ? new Date(assignment.due_at).toLocaleString("uz-UZ") : "Muddat belgilanmagan"}</span><span>{assignment.max_score} ball</span></div></div><div className={styles.status}>{assignment.submission?.status === "graded" ? <><CheckCircle weight="fill" /><b>{assignment.submission.score} / {assignment.max_score}</b><small>Baholangan</small></> : assignment.submission ? <><PaperPlaneTilt weight="fill" /><b>Yuborilgan</b><small>Tekshirilmoqda</small></> : <><Clock weight="fill" /><b>{assignment.is_overdue ? "Muddati o‘tgan" : "Kutilmoqda"}</b><small>{assignment.allow_late && assignment.is_overdue ? "Kech yuborish mumkin" : ""}</small></>}<Link href={`/assignments/${assignment.id}`}>{assignment.submission ? "Ko‘rish" : "Bajarish"} <ArrowRight /></Link></div></article>)}
        {!loading && !error && assignments.length === 0 && <div className={styles.empty}><ClipboardText weight="duotone" /><h2>Hozircha uy vazifasi yo‘q</h2><p>Yangi vazifa nashr qilinganda shu sahifada ko‘rinadi.</p></div>}
      </section>
    </main>
  );
}
