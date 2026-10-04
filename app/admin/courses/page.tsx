"use client";

import { ArrowLeft, BookOpen, CheckCircle, FilePlus, Plus, RocketLaunch, Stack } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser, Course, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const statusNames = { draft: "Qoralama", published: "Nashr qilingan", archived: "Arxiv" };

function slugify(value: string) {
  return value.toLocaleLowerCase("uz").normalize("NFKD").replace(/[ʻ’‘']/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 220);
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<AuthUser[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [courseForm, setCourseForm] = useState({ title: "", slug: "", summary: "", category: "", level: "beginner", duration_weeks: 6, teacher_id: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", position: 1, content_type: "text", content_text: "", duration_minutes: 20, is_preview: false, is_published: true });

  useEffect(() => {
    async function load() {
      try {
        const profile = await apiFetch("/api/v1/auth/me");
        if (!profile.ok) return router.replace("/login");
        const courseResponse = await apiFetch("/api/v1/admin/courses");
        const userResponse = await apiFetch("/api/v1/admin/users");
        if (!courseResponse.ok || !userResponse.ok) throw new Error("Boshqaruv ma’lumotlarini yuklab bo‘lmadi");
        setCourses((await courseResponse.json()) as Course[]);
        const users = (await userResponse.json()) as AuthUser[];
        setTeachers(users.filter((user) => user.role === "teacher" && user.is_active));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      }
    }
    void load();
  }, [router]);

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/courses", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ ...courseForm, teacher_id: courseForm.teacher_id || null }) });
    const data = (await response.json().catch(() => ({}))) as Course & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Kursni yaratib bo‘lmadi");
    setCourses((current) => [data, ...current]); setSelected(data); setShowCourseForm(false);
    setCourseForm({ title: "", slug: "", summary: "", category: "", level: "beginner", duration_weeks: 6, teacher_id: "" });
    setMessage("Kurs qoralama sifatida yaratildi. Endi dars qo‘shing.");
  }

  async function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!selected) return;
    const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/courses/${selected.id}/lessons`, { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(lessonForm) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Darsni yaratib bo‘lmadi");
    const updated = { ...selected, lesson_count: selected.lesson_count + 1 };
    setSelected(updated); setCourses((current) => current.map((course) => course.id === updated.id ? updated : course));
    setLessonForm({ title: "", position: updated.lesson_count + 1, content_type: "text", content_text: "", duration_minutes: 20, is_preview: false, is_published: true });
    setMessage("Dars kursga qo‘shildi.");
  }

  async function changeStatus(course: Course, status: Course["status"]) {
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/courses/${course.id}/status`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ status }) });
    const data = (await response.json().catch(() => ({}))) as Course & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Kurs holatini o‘zgartirib bo‘lmadi");
    setCourses((current) => current.map((item) => item.id === data.id ? data : item));
    if (selected?.id === data.id) setSelected(data);
    setMessage(status === "published" ? "Kurs katalogda nashr qilindi." : "Kurs holati yangilandi.");
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />ma&apos;rifat</span></header>
      <section className={styles.content}>
        <div className={styles.titleRow}><div><p>TA’LIM KONTENTI</p><h1>Kurslar boshqaruvi</h1><span>Kurs yarating, dars qo‘shing va katalogga nashr qiling.</span></div><button onClick={() => setShowCourseForm((current) => !current)}><Plus /> Yangi kurs</button></div>
        {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}

        {showCourseForm && <form className={styles.form} onSubmit={createCourse}><h2>Yangi kurs</h2><label>Kurs nomi<input value={courseForm.title} onChange={(event) => { const title=event.target.value; setCourseForm({ ...courseForm, title, slug: slugify(title) }); }} minLength={3} required /></label><label>Slug<input value={courseForm.slug} onChange={(event) => setCourseForm({ ...courseForm, slug: slugify(event.target.value) })} minLength={3} required /></label><label className={styles.wide}>Qisqa tavsif<textarea value={courseForm.summary} onChange={(event) => setCourseForm({ ...courseForm, summary: event.target.value })} minLength={10} required /></label><label>Yo‘nalish<input value={courseForm.category} onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })} required /></label><label>Daraja<select value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}><option value="beginner">Boshlang‘ich</option><option value="intermediate">O‘rta</option><option value="advanced">Yuqori</option></select></label><label>Davomiyligi (hafta)<input type="number" min="1" max="104" value={courseForm.duration_weeks} onChange={(event) => setCourseForm({ ...courseForm, duration_weeks: Number(event.target.value) })} /></label><label>O‘qituvchi<select value={courseForm.teacher_id} onChange={(event) => setCourseForm({ ...courseForm, teacher_id: event.target.value })}><option value="">Keyin biriktirish</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select></label><div className={styles.actions}><button type="button" onClick={() => setShowCourseForm(false)}>Bekor qilish</button><button type="submit"><FilePlus /> Kurs yaratish</button></div></form>}

        <div className={styles.layout}><section className={styles.list}><h2>Kurslar <small>{courses.length}</small></h2>{courses.map((course) => <article key={course.id} className={selected?.id === course.id ? styles.selected : ""} onClick={() => { setSelected(course); setLessonForm((current) => ({ ...current, position: course.lesson_count + 1 })); }}><span className={styles.courseIcon}><BookOpen weight="duotone" /></span><div><strong>{course.title}</strong><small>{course.category} · {course.lesson_count} dars</small></div><b className={styles[course.status]}>{statusNames[course.status]}</b></article>)}</section>
          <aside className={styles.editor}>{selected ? <><div className={styles.courseHead}><span><p>TANLANGAN KURS</p><h2>{selected.title}</h2><small>{selected.summary}</small></span><div>{selected.status !== "published" ? <button onClick={() => changeStatus(selected, "published")}><RocketLaunch /> Nashr qilish</button> : <button onClick={() => changeStatus(selected, "archived")}>Arxivlash</button>}</div></div><div className={styles.metrics}><span><Stack /><b>{selected.lesson_count}</b><small>Darslar</small></span><span><BookOpen /><b>{selected.duration_weeks}</b><small>Hafta</small></span></div><form className={styles.lessonForm} onSubmit={addLesson}><h3>Yangi dars qo‘shish</h3><label>Dars nomi<input value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} minLength={3} required /></label><div><label>Tartib<input type="number" min="1" value={lessonForm.position} onChange={(event) => setLessonForm({ ...lessonForm, position: Number(event.target.value) })} /></label><label>Davomiyligi<input type="number" min="0" max="1440" value={lessonForm.duration_minutes} onChange={(event) => setLessonForm({ ...lessonForm, duration_minutes: Number(event.target.value) })} /></label></div><label>Dars mazmuni<textarea value={lessonForm.content_text} onChange={(event) => setLessonForm({ ...lessonForm, content_text: event.target.value })} /></label><label className={styles.check}><input type="checkbox" checked={lessonForm.is_published} onChange={(event) => setLessonForm({ ...lessonForm, is_published: event.target.checked })} /> Darsni darhol nashr qilish</label><button type="submit"><Plus /> Dars qo‘shish</button></form></> : <div className={styles.empty}><BookOpen weight="duotone" /><h2>Kursni tanlang</h2><p>Dars qo‘shish va nashr holatini boshqarish uchun chap ro‘yxatdan kursni tanlang.</p></div>}</aside></div>
      </section>
    </main>
  );
}
