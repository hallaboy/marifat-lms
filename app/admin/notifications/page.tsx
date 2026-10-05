"use client";

import { ArrowLeft, BellRinging, BookOpen, CheckCircle, Clock, Megaphone, Plus, RocketLaunch, Trash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser, Course, Notification, NotificationAudience, NotificationPriority, readCsrfCookie } from "../../_lib/api";
import priorityStyles from "../../_lib/notificationPriority.module.css";
import styles from "./styles.module.css";

const audienceNames: Record<NotificationAudience, string> = { all: "Barcha foydalanuvchilar", students: "Talabalar", teachers: "O‘qituvchilar", administrators: "Administratorlar" };
const priorityNames: Record<NotificationPriority, string> = { info: "Oddiy", important: "Muhim", urgent: "Shoshilinch" };
const emptyForm = { title: "", message: "", priority: "info" as NotificationPriority, audience: "all" as NotificationAudience, course_id: "", action_url: "", expires_at: "" };
const formatDate = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<Notification[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await apiFetch("/api/v1/admin/notifications");
    if (!response.ok) throw new Error("Bildirishnomalarni yuklab bo‘lmadi");
    setItems((await response.json()) as Notification[]);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/notifications");
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

  async function createNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/notifications", {
      method: "POST",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({ ...form, course_id: form.course_id || null, action_url: form.action_url || null, expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null }),
    });
    const data = (await response.json().catch(() => ({}))) as Notification & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Bildirishnomani yaratib bo‘lmadi");
    setForm(emptyForm); setShowForm(false); setMessage("Bildirishnoma qoralama sifatida yaratildi.");
    await refresh();
  }

  async function togglePublish(item: Notification) {
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/notifications/${item.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: !item.is_published }) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Nashr holatini o‘zgartirib bo‘lmadi");
    setMessage(item.is_published ? "Bildirishnoma nashrdan olindi." : "Bildirishnoma foydalanuvchilarga nashr qilindi.");
    await refresh();
  }

  async function remove(item: Notification) {
    if (!window.confirm(`“${item.title}” bildirishnomasini o‘chirasizmi?`)) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/notifications/${item.id}`, { method: "DELETE", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Bildirishnomani o‘chirib bo‘lmadi");
    setMessage("Bildirishnoma o‘chirildi."); await refresh();
  }

  return <main className={styles.shell}>
    <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header>
    <section className={styles.content}>
      <div className={styles.heading}><div><p>XABARLAR MARKAZI</p><h1>Bildirishnomalar</h1><span>Auditoriya yoki kurs bo‘yicha xavfsiz e’lonlar yuboring.</span></div><button onClick={() => setShowForm((value) => !value)}><Plus /> Yangi bildirishnoma</button></div>
      {error && <div className={styles.error}><WarningCircle />{error}</div>}
      {message && <div className={styles.success}><CheckCircle />{message}</div>}
      {showForm && <form className={styles.form} onSubmit={createNotification}>
        <h2>Yangi e’lon</h2>
        <label>Sarlavha<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} maxLength={180} required /></label>
        <label>Ustuvorlik<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as NotificationPriority })}>{Object.entries(priorityNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Auditoriya<select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value as NotificationAudience })}>{Object.entries(audienceNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Kurs (ixtiyoriy)<select value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })}><option value="">Barcha kurslar</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label className={styles.wide}>Xabar<textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} minLength={3} maxLength={5000} required /></label>
        <label>Platforma ichidagi havola<input value={form.action_url} onChange={(event) => setForm({ ...form, action_url: event.target.value })} placeholder="/calendar" pattern="/[^/].*" /></label>
        <label>Amal qilish muddati<input type="datetime-local" value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} /></label>
        <div className={styles.formActions}><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button type="submit"><BellRinging /> Saqlash</button></div>
      </form>}
      <section className={styles.board}>
        <div className={styles.boardHead}><div><Megaphone /><h2>Barcha e’lonlar</h2></div><b>{items.length}</b></div>
        {loading && <div className={styles.empty}>Bildirishnomalar yuklanmoqda…</div>}
        {!loading && items.map((item) => <article key={item.id}>
          <span className={`${styles.noticeIcon} ${priorityStyles[item.priority]}`}><BellRinging weight="duotone" /></span>
          <div className={`${styles.info} ${priorityStyles.reset}`}><p>{priorityNames[item.priority]} · {audienceNames[item.audience]}{item.course_title ? ` · ${item.course_title}` : ""}</p><h3>{item.title}</h3><span>{item.message}</span>{item.expires_at && <small><Clock /> {formatDate(item.expires_at)} gacha</small>}</div>
          <b className={item.is_published ? styles.published : styles.draft}>{item.is_published ? "Nashrda" : "Qoralama"}</b>
          <div className={styles.actions}><button onClick={() => void togglePublish(item)}>{item.is_published ? "Nashrdan olish" : <><RocketLaunch /> Nashr qilish</>}</button><button onClick={() => void remove(item)} aria-label="Bildirishnomani o‘chirish"><Trash /></button></div>
        </article>)}
        {!loading && items.length === 0 && <div className={styles.empty}><BellRinging weight="duotone" /><h2>Hali bildirishnoma yo‘q</h2><p>Birinchi e’lonni qoralama sifatida yarating.</p></div>}
      </section>
    </section>
  </main>;
}
