"use client";

import { ArrowLeft, BookOpen, CalendarBlank, CheckCircle, Exam, LinkSimple, Plus, RocketLaunch, Trash, UsersThree, VideoCamera, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser, CalendarEvent, CalendarEventType, Course, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const typeNames: Record<CalendarEventType, string> = { live_lesson: "Jonli dars", exam: "Imtihon", meeting: "Uchrashuv", deadline: "Muhim muddat", other: "Boshqa" };
const emptyForm = { course_id: "", title: "", description: "", event_type: "live_lesson" as CalendarEventType, starts_at: "", ends_at: "", meeting_url: "" };
const dateTime = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function AdminCalendarPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await apiFetch("/api/v1/admin/calendar-events");
    if (!response.ok) throw new Error("Taqvim tadbirlarini yuklab bo‘lmadi");
    setEvents((await response.json()) as CalendarEvent[]);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/");
        const courseResponse = await apiFetch("/api/v1/admin/courses");
        if (!courseResponse.ok) throw new Error("Kurslarni yuklab bo‘lmadi");
        setCourses((await courseResponse.json()) as Course[]);
        await refresh();
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

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/calendar-events", {
      method: "POST",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({ ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null, meeting_url: form.meeting_url || null }),
    });
    const data = (await response.json().catch(() => ({}))) as CalendarEvent & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Tadbirni yaratib bo‘lmadi");
    setForm(emptyForm); setShowForm(false); setMessage("Tadbir qoralama sifatida yaratildi.");
    await refresh();
  }

  async function publish(item: CalendarEvent) {
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/calendar-events/${item.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: !item.is_published }) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Nashr holatini o‘zgartirib bo‘lmadi");
    setMessage(item.is_published ? "Tadbir nashrdan olindi." : "Tadbir talabalar taqvimida nashr qilindi.");
    await refresh();
  }

  async function remove(item: CalendarEvent) {
    if (!window.confirm(`“${item.title}” tadbirini o‘chirasizmi?`)) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/calendar-events/${item.id}`, { method: "DELETE", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Tadbirni o‘chirib bo‘lmadi");
    setMessage("Tadbir o‘chirildi."); await refresh();
  }

  return <main className={styles.shell}><header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header><section className={styles.content}><div className={styles.heading}><div><p>O‘QUV JADVALI</p><h1>Taqvim boshqaruvi</h1><span>Jonli dars, imtihon va uchrashuvlarni kurs taqvimiga joylang.</span></div><button onClick={() => setShowForm((value) => !value)}><Plus /> Yangi tadbir</button></div>{error && <div className={styles.error}><WarningCircle />{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}{showForm && <form className={styles.form} onSubmit={createEvent}><h2>Yangi tadbir</h2><label>Kurs<select value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })} required><option value="">Kursni tanlang</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>Tadbir turi<select value={form.event_type} onChange={(event) => setForm({ ...form, event_type: event.target.value as CalendarEventType })}>{Object.entries(typeNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className={styles.wide}>Tadbir nomi<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} required /></label><label>Boshlanish vaqti<input type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} required /></label><label>Tugash vaqti<input type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /></label><label className={styles.wide}>HTTPS uchrashuv havolasi<input type="url" value={form.meeting_url} onChange={(event) => setForm({ ...form, meeting_url: event.target.value })} placeholder="https://..." /></label><label className={styles.wide}>Tavsif<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className={styles.formActions}><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button type="submit"><CalendarBlank /> Saqlash</button></div></form>}<section className={styles.board}><div className={styles.boardHead}><div><CalendarBlank /><h2>Rejalashtirilgan tadbirlar</h2></div><b>{events.length}</b></div>{loading && <div className={styles.empty}>Taqvim yuklanmoqda…</div>}{!loading && events.map((item) => { const Icon = item.event_type === "live_lesson" ? VideoCamera : item.event_type === "exam" ? Exam : item.event_type === "meeting" ? UsersThree : CalendarBlank; return <article key={item.id}><div className={`${styles.icon} ${styles[item.event_type]}`}><Icon weight="duotone" /></div><div className={styles.info}><span>{typeNames[item.event_type]} · {item.course_title}</span><h3>{item.title}</h3><p>{dateTime(item.starts_at)}{item.ends_at ? ` — ${dateTime(item.ends_at)}` : ""}</p>{item.description && <small>{item.description}</small>}</div><div className={styles.meta}>{item.meeting_url && <a href={item.meeting_url} target="_blank" rel="noreferrer"><LinkSimple /> Havola</a>}<b className={item.is_published ? styles.published : styles.draft}>{item.is_published ? "Nashrda" : "Qoralama"}</b></div><div className={styles.actions}><button onClick={() => void publish(item)}>{item.is_published ? "Nashrdan olish" : <><RocketLaunch /> Nashr qilish</>}</button><button onClick={() => void remove(item)} aria-label="Tadbirni o‘chirish"><Trash /></button></div></article>})}{!loading && events.length === 0 && <div className={styles.empty}><CalendarBlank weight="duotone" /><h2>Hali tadbir yaratilmagan</h2><p>Yangi tadbir yaratib kurs taqvimini shakllantiring.</p></div>}</section></section></main>;
}
