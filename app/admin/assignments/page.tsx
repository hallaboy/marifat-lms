"use client";

import { API_ORIGIN, AdminAssignmentDetail, apiFetch, Assignment, AssignmentSubmission, AuthUser, Course, readCsrfCookie } from "../../_lib/api";
import { ArrowLeft, BookOpen, CheckCircle, ClipboardText, FileArrowDown, Plus, RocketLaunch } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import styles from "./styles.module.css";

type GradeDraft = { score: string; feedback: string };

function fileUrl(path: string) { return path.startsWith("/") ? `${API_ORIGIN}${path}` : path; }

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<AdminAssignmentDetail | null>(null);
  const [grades, setGrades] = useState<Record<string, GradeDraft>>({});
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ course_id: "", title: "", description: "", due_at: "", max_score: 100, allow_late: false });

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/");
        const [assignmentResponse, courseResponse] = await Promise.all([
          apiFetch("/api/v1/admin/assignments"), apiFetch("/api/v1/admin/courses"),
        ]);
        if (!assignmentResponse.ok || !courseResponse.ok) throw new Error("Uy vazifalarini yuklab bo‘lmadi");
        setAssignments((await assignmentResponse.json()) as Assignment[]);
        setCourses((await courseResponse.json()) as Course[]);
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

  function prepareGrades(submissions: AssignmentSubmission[]) {
    setGrades(Object.fromEntries(submissions.map((item) => [item.id, { score: item.score?.toString() ?? "", feedback: item.feedback ?? "" }])));
  }

  async function chooseAssignment(item: Assignment) {
    setError(""); setMessage("");
    const response = await apiFetch(`/api/v1/admin/assignments/${item.id}`);
    if (!response.ok) return setError("Topshiriq tafsilotlarini yuklab bo‘lmadi");
    const detail = (await response.json()) as AdminAssignmentDetail;
    setSelected(detail); prepareGrades(detail.submissions);
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const payload = { ...form, due_at: form.due_at ? new Date(form.due_at).toISOString() : null };
    const response = await apiFetch("/api/v1/admin/assignments", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(payload) });
    const data = (await response.json().catch(() => ({}))) as Assignment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Uy vazifasini yaratib bo‘lmadi");
    setAssignments((current) => [data, ...current]); setSelected({ ...data, submissions: [] }); setGrades({}); setShowForm(false);
    setForm({ course_id: "", title: "", description: "", due_at: "", max_score: 100, allow_late: false });
    setMessage("Uy vazifasi qoralama sifatida yaratildi.");
  }

  async function changePublish(isPublished: boolean) {
    if (!selected) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/assignments/${selected.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: isPublished }) });
    const data = (await response.json().catch(() => ({}))) as Assignment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Holatni o‘zgartirib bo‘lmadi");
    const updated = { ...selected, ...data }; setSelected(updated);
    setAssignments((current) => current.map((item) => item.id === data.id ? data : item));
    setMessage(isPublished ? "Uy vazifasi talabalarga nashr qilindi." : "Uy vazifasi qoralamaga qaytarildi.");
  }

  async function grade(submission: AssignmentSubmission) {
    if (!selected) return;
    const draft = grades[submission.id];
    if (!draft?.score) return setError("Ballni kiriting.");
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/assignments/submissions/${submission.id}/grade`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ score: Number(draft.score), feedback: draft.feedback || null }) });
    const data = (await response.json().catch(() => ({}))) as AssignmentSubmission & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Javobni baholab bo‘lmadi");
    setSelected({ ...selected, submissions: selected.submissions.map((item) => item.id === data.id ? data : item) });
    setMessage(`${data.student_name}ning javobi baholandi.`);
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header>
      <section className={styles.content}>
        <div className={styles.titleRow}><div><p>AMALIY TOPSHIRIQLAR</p><h1>Uy vazifalari</h1><span>Topshiriq yarating, talaba fayllarini tekshiring va fikr bildiring.</span></div><button onClick={() => setShowForm((current) => !current)}><Plus /> Yangi vazifa</button></div>
        {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}
        {showForm && <form className={styles.createForm} onSubmit={createAssignment}><h2>Yangi uy vazifasi</h2><label>Kurs<select value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })} required><option value="">Kursni tanlang</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>Nomi<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} required /></label><label>Muddat<input type="datetime-local" value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} /></label><label>Maksimal ball<input type="number" min="1" max="1000" value={form.max_score} onChange={(event) => setForm({ ...form, max_score: Number(event.target.value) })} /></label><label className={styles.wide}>Topshiriq tavsifi<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} minLength={10} required /></label><label className={styles.check}><input type="checkbox" checked={form.allow_late} onChange={(event) => setForm({ ...form, allow_late: event.target.checked })} /> Muddatdan keyin yuborishga ruxsat</label><div className={styles.formActions}><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button type="submit"><Plus /> Yaratish</button></div></form>}
        <div className={styles.layout}><section className={styles.list}><h2>Vazifalar <small>{assignments.length}</small></h2>{assignments.map((item) => <button key={item.id} className={selected?.id === item.id ? styles.selected : ""} onClick={() => chooseAssignment(item)}><span><ClipboardText weight="duotone" /></span><div><strong>{item.title}</strong><small>{item.course_title} · {item.submission_count} javob</small></div><b className={item.is_published ? styles.published : styles.draft}>{item.is_published ? "Nashrda" : "Qoralama"}</b></button>)}{assignments.length === 0 && <div className={styles.emptyList}>Hali uy vazifasi yaratilmagan.</div>}</section>
          <aside className={styles.editor}>{selected ? <><div className={styles.assignmentHead}><div><p>TANLANGAN VAZIFA</p><h2>{selected.title}</h2><span>{selected.course_title} · {selected.max_score} ball{selected.due_at ? ` · ${new Date(selected.due_at).toLocaleString("uz-UZ")}` : ""}</span></div><button onClick={() => changePublish(!selected.is_published)}>{selected.is_published ? "Nashrdan olish" : <><RocketLaunch /> Nashr qilish</>}</button></div><p className={styles.description}>{selected.description}</p><section className={styles.submissions}><h3>Talabalar javoblari <small>{selected.submissions.length}</small></h3>{selected.submissions.map((submission) => <article key={submission.id}><header><div className={styles.avatar}>{submission.student_name.split(" ").map((part) => part[0]).slice(0,2).join("")}</div><span><strong>{submission.student_name}</strong><small>{submission.student_email} · {new Date(submission.submitted_at).toLocaleString("uz-UZ")}</small></span><b className={submission.status === "graded" ? styles.graded : styles.waiting}>{submission.status === "graded" ? "Baholangan" : "Kutilmoqda"}</b></header>{submission.submission_text && <p>{submission.submission_text}</p>}{submission.file_url && <a href={fileUrl(submission.file_url)} target="_blank" rel="noopener noreferrer"><FileArrowDown /> {submission.original_filename ?? "Faylni yuklash"}</a>}<div className={styles.grade}><label>Ball<input type="number" min="0" max={selected.max_score} value={grades[submission.id]?.score ?? ""} onChange={(event) => setGrades((current) => ({ ...current, [submission.id]: { score: event.target.value, feedback: current[submission.id]?.feedback ?? "" } }))} /></label><label>Izoh<input value={grades[submission.id]?.feedback ?? ""} onChange={(event) => setGrades((current) => ({ ...current, [submission.id]: { score: current[submission.id]?.score ?? "", feedback: event.target.value } }))} /></label><button onClick={() => grade(submission)}>Baholash</button></div></article>)}{selected.submissions.length === 0 && <div className={styles.noSubmissions}>Talabalar hali javob yubormagan.</div>}</section></> : <div className={styles.empty}><ClipboardText weight="duotone" /><h2>Uy vazifasini tanlang</h2><p>Javoblarni tekshirish uchun chap ro‘yxatdan vazifani tanlang.</p></div>}</aside></div>
      </section>
    </main>
  );
}
