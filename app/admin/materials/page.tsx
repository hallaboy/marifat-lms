"use client";

import { ArrowLeft, BookOpen, FilmSlate, Stack } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, Course } from "../../_lib/api";
import styles from "./styles.module.css";

export default function MaterialsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const profile = await apiFetch("/api/v1/auth/me");
      if (!profile.ok) return router.replace("/login");
      const response = await apiFetch("/api/v1/admin/courses");
      if (!response.ok) return setError("Kurslarni yuklab bo‘lmadi");
      setCourses((await response.json()) as Course[]);
    }
    void load().catch(() => setError("Server bilan aloqa uzildi"));
  }, [router]);

  return <main className={styles.shell}><header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header><section><p>MULTIMEDIA KUTUBXONASI</p><h1>Kursni tanlang</h1><div className={styles.subtitle}>Video, audio, hujjat, YouTube va gamifikatsiya resurslarini darslarga biriktiring.</div>{error && <div className={styles.error}>{error}</div>}<div className={styles.grid}>{courses.map((course) => <Link key={course.id} href={`/admin/courses/${course.id}`}><span><FilmSlate weight="duotone" /></span><div><h2>{course.title}</h2><p>{course.category}</p><small><Stack /> {course.lesson_count} dars</small></div><b>Materiallar →</b></Link>)}</div></section></main>;
}
