"use client";

import { ArrowLeft, ArrowRight, BookOpen, Clock, MagnifyingGlass, Stack } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch, Course } from "../_lib/api";
import styles from "./styles.module.css";

const levelNames = { beginner: "Boshlang‘ich", intermediate: "O‘rta", advanced: "Yuqori" };
const cardClasses = [styles.violet, styles.orange, styles.blue, styles.green];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/v1/courses")
      .then(async (response) => {
        if (!response.ok) throw new Error("Kurslarni yuklab bo‘lmadi");
        setCourses((await response.json()) as Course[]);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => courses.filter((course) =>
    `${course.title} ${course.category} ${course.summary}`.toLocaleLowerCase("uz")
      .includes(query.toLocaleLowerCase("uz"))), [courses, query]);

  return (
    <main className={styles.shell}>
      <header><Link href="/" className={styles.brand}><BookOpen weight="fill" />sitlearning</Link><Link href="/login" className={styles.login}>Boshqaruvga kirish</Link></header>
      <section className={styles.hero}>
        <Link href="/" className={styles.back}><ArrowLeft /> Bosh sahifa</Link>
        <p>KURSLAR KATALOGI</p><h1>Yangi bilim sari yo‘l</h1><span>PostgreSQL bazasidagi nashr qilingan kurslarni ko‘ring va darslarni boshlang.</span>
        <label><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kurs yoki yo‘nalishni qidiring…" /></label>
      </section>
      <section className={styles.grid}>
        {loading && <div className={styles.state}>Kurslar yuklanmoqda…</div>}
        {error && <div className={`${styles.state} ${styles.error}`}>{error}</div>}
        {!loading && !error && filtered.map((course, index) => (
          <article key={course.id}>
            <div className={`${styles.art} ${cardClasses[index % cardClasses.length]}`}><span>{course.category}</span><BookOpen weight="duotone" /></div>
            <div className={styles.body}>
              <div className={styles.meta}><span>{levelNames[course.level]}</span><span><Clock /> {course.duration_weeks} hafta</span></div>
              <h2>{course.title}</h2><p>{course.summary}</p>
              <div className={styles.footer}><span><Stack /> {course.lesson_count} dars</span><Link href={`/courses/${course.id}`}>Kursni ko‘rish <ArrowRight /></Link></div>
            </div>
          </article>
        ))}
        {!loading && !error && filtered.length === 0 && <div className={styles.state}>Mos kurs topilmadi.</div>}
      </section>
    </main>
  );
}
