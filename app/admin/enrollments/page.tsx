"use client";

import { ArrowLeft, BookOpen, CheckCircle, PauseCircle, PlayCircle, UserPlus, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser, Course, Enrollment, EnrollmentStatus, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const statusName = { active: "Faol", completed: "Tugallangan", suspended: "To‘xtatilgan" };

export default function AdminEnrollmentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [form, setForm] = useState({ student_id: "", course_id: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/");
        const [usersResponse, coursesResponse, enrollmentsResponse] = await Promise.all([
          apiFetch("/api/v1/admin/users"), apiFetch("/api/v1/admin/courses"), apiFetch("/api/v1/admin/enrollments"),
        ]);
        if (!usersResponse.ok || !coursesResponse.ok || !enrollmentsResponse.ok) throw new Error("Biriktirish ma’lumotlarini yuklab bo‘lmadi");
        const users = (await usersResponse.json()) as AuthUser[];
        setStudents(users.filter((user) => user.role === "student" && user.is_active));
        setCourses((await coursesResponse.json()) as Course[]);
        setEnrollments((await enrollmentsResponse.json()) as Enrollment[]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function createEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/enrollments", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(form) });
    const data = (await response.json().catch(() => ({}))) as Enrollment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "O‘quvchini kursga biriktirib bo‘lmadi");
    setEnrollments((current) => [data, ...current]); setForm({ student_id: "", course_id: "" });
    setMessage("O‘quvchi kursga muvaffaqiyatli biriktirildi.");
  }

  async function changeStatus(enrollment: Enrollment, status: EnrollmentStatus) {
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/enrollments/${enrollment.id}/status`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ status }) });
    const data = (await response.json().catch(() => ({}))) as Enrollment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Holatni o‘zgartirib bo‘lmadi");
    setEnrollments((current) => current.map((item) => item.id === data.id ? data : item));
    setMessage("Biriktirish holati yangilandi.");
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />ma&apos;rifat</span></header>
      <section className={styles.content}>
        <div className={styles.heading}><p>O‘QUV JARAYONI</p><h1>Kursga biriktirish</h1><span>Talabalarni kurslarga ulang va o‘zlashtirish holatini kuzating.</span></div>
        {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}
        <form className={styles.form} onSubmit={createEnrollment}>
          <div><UserPlus weight="duotone" /><span><h2>Yangi biriktirish</h2><p>Faol talaba va kerakli kursni tanlang.</p></span></div>
          <label>Talaba<select value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })} required><option value="">Talabani tanlang</option>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name} — {student.email}</option>)}</select></label>
          <label>Kurs<select value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })} required><option value="">Kursni tanlang</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.status})</option>)}</select></label>
          <button type="submit"><UserPlus /> Biriktirish</button>
        </form>
        <section className={styles.list}><div className={styles.listHead}><span><Users /><h2>Biriktirilgan talabalar</h2></span><b>{enrollments.length}</b></div>
          {loading && <div className={styles.empty}>Ma’lumotlar yuklanmoqda…</div>}
          {!loading && enrollments.map((enrollment) => <article key={enrollment.id}><div className={styles.avatar}>{enrollment.student_name.split(" ").map((part) => part[0]).slice(0,2).join("")}</div><div className={styles.person}><strong>{enrollment.student_name}</strong><small>{enrollment.student_email}</small></div><div className={styles.course}><strong>{enrollment.course_title}</strong><small>{new Date(enrollment.enrolled_at).toLocaleDateString("uz-UZ")}</small></div><div className={styles.progress}><span><i style={{ width: `${enrollment.progress_percent}%` }} /></span><b>{enrollment.progress_percent}%</b></div><span className={`${styles.badge} ${styles[enrollment.status]}`}>{statusName[enrollment.status]}</span><div className={styles.actions}>{enrollment.status === "suspended" ? <button onClick={() => changeStatus(enrollment, "active")} title="Faollashtirish"><PlayCircle /></button> : <button onClick={() => changeStatus(enrollment, "suspended")} title="Vaqtincha to‘xtatish"><PauseCircle /></button>}</div></article>)}
          {!loading && enrollments.length === 0 && <div className={styles.empty}>Hali hech kim kursga biriktirilmagan.</div>}
        </section>
      </section>
    </main>
  );
}
