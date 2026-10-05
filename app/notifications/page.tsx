"use client";

import { ArrowLeft, BellRinging, BookOpen, Check, Clock, Info, SealWarning, Warning, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch, AuthUser, Notification, NotificationFeed, readCsrfCookie } from "../_lib/api";
import priorityStyles from "../_lib/notificationPriority.module.css";
import styles from "./styles.module.css";

const priorityNames = { info: "Ma’lumot", important: "Muhim", urgent: "Shoshilinch" };
const formatDate = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [feed, setFeed] = useState<NotificationFeed>({ unread_count: 0, items: [] });
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        setUser((await profileResponse.json()) as AuthUser);
        const response = await apiFetch("/api/v1/notifications");
        if (!response.ok) throw new Error("Bildirishnomalarni yuklab bo‘lmadi");
        setFeed((await response.json()) as NotificationFeed);
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

  async function markRead(item: Notification) {
    if (item.is_read) return;
    const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/notifications/${item.id}/read`, { method: "POST", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Bildirishnomani o‘qildi deb belgilab bo‘lmadi");
    setFeed((current) => ({ unread_count: Math.max(0, current.unread_count - 1), items: current.items.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry) }));
  }

  async function markAllRead() {
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/notifications/read-all", { method: "POST", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Barcha bildirishnomalarni belgilab bo‘lmadi");
    setFeed((current) => ({ unread_count: 0, items: current.items.map((item) => ({ ...item, is_read: true })) }));
  }

  const items = useMemo(() => onlyUnread ? feed.items.filter((item) => !item.is_read) : feed.items, [feed.items, onlyUnread]);
  const backHref = user?.role === "admin" || user?.role === "super_admin" ? "/admin" : user?.role === "student" ? "/my-courses" : "/teacher";

  function icon(item: Notification) {
    if (item.priority === "urgent") return SealWarning;
    if (item.priority === "important") return Warning;
    return Info;
  }

  return <main className={styles.shell}>
    <header><Link href="/" className={styles.brand}><BookOpen weight="fill" />SiteLearning</Link><span>{user?.full_name}</span></header>
    <section className={styles.hero}><Link href={backHref}><ArrowLeft /> Kabinetga qaytish</Link><p>XABARLAR MARKAZI</p><h1>Bildirishnomalar</h1><span>Muhim e’lonlar, kurs yangiliklari va eslatmalar.</span><BellRinging weight="duotone" /></section>
    <section className={styles.content}>
      <div className={styles.toolbar}><div><button className={!onlyUnread ? styles.active : ""} onClick={() => setOnlyUnread(false)}>Barchasi <b>{feed.items.length}</b></button><button className={onlyUnread ? styles.active : ""} onClick={() => setOnlyUnread(true)}>O‘qilmagan <b>{feed.unread_count}</b></button></div>{feed.unread_count > 0 && <button onClick={() => void markAllRead()}><Check /> Barchasini o‘qildi deb belgilash</button>}</div>
      {loading && <div className={styles.state}>Bildirishnomalar yuklanmoqda…</div>}
      {error && <div className={`${styles.state} ${styles.error}`}><WarningCircle />{error}</div>}
      {!loading && !error && <section className={styles.list}>{items.map((item) => { const Icon = icon(item); return <article className={!item.is_read ? styles.unread : ""} key={item.id}>
        <span className={`${styles.icon} ${priorityStyles[item.priority]}`}><Icon weight="duotone" /></span>
        <div className={`${styles.info} ${priorityStyles.reset}`}><div><b>{priorityNames[item.priority]}</b>{item.course_title && <em>{item.course_title}</em>}{!item.is_read && <i>Yangi</i>}</div><h2>{item.title}</h2><p>{item.message}</p><small><Clock /> {formatDate(item.published_at ?? item.created_at)}</small>{item.action_url && <Link href={item.action_url} onClick={() => void markRead(item)}>Batafsil ko‘rish →</Link>}</div>
        {!item.is_read && <button onClick={() => void markRead(item)}><Check /> O‘qildi</button>}
      </article>})}{items.length === 0 && <div className={styles.empty}><BellRinging weight="duotone" /><h2>{onlyUnread ? "O‘qilmagan xabar yo‘q" : "Hali bildirishnoma yo‘q"}</h2><p>Yangi xabar nashr qilinganda shu yerda ko‘rinadi.</p></div>}</section>}
    </section>
  </main>;
}
