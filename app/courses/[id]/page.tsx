"use client";

import { ArrowLeft, BookOpen, Clock, LockKey, PlayCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, CourseDetail } from "../../_lib/api";
import styles from "./styles.module.css";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/courses/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (response.status === 401) return setRequiresLogin(true);
        if (!response.ok) throw new Error("Kursni yuklab bo‘lmadi");
        setCourse((await response.json()) as CourseDetail);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"));
  }, [id]);

  if (requiresLogin) return <main className={styles.center}><LockKey weight="duotone" /><h1>Darslarni ko‘rish uchun tizimga kiring</h1><p>Kurs katalogi ochiq, dars mazmuni esa faqat autentifikatsiyadan keyin ko‘rsatiladi.</p><Link href="/login">Tizimga kirish</Link></main>;
  if (error) return <main className={styles.center}><h1>{error}</h1><Link href="/courses">Kurslarga qaytish</Link></main>;
  if (!course) return <main className={styles.center}>Kurs yuklanmoqda…</main>;

  return (
    <main className={styles.shell}>
      <header><Link href="/courses"><ArrowLeft /> Kurslar</Link><span><BookOpen weight="fill" /> ma&apos;rifat</span></header>
      <section className={styles.hero}><p>{course.category} • {course.level}</p><h1>{course.title}</h1><div>{course.summary}</div><span><Clock /> {course.duration_weeks} hafta · {course.lesson_count} dars</span></section>
      <section className={styles.lessons}><h2>Darslar dasturi</h2>{course.lessons.map((lesson) => <article key={lesson.id}><span>{lesson.position}</span><div><h3>{lesson.title}</h3><p>{lesson.content_text ?? "Multimedia dars"}</p></div><small><Clock /> {lesson.duration_minutes} daqiqa</small><PlayCircle weight="duotone" /></article>)}</section>
    </main>
  );
}
