"use client";

import { ArrowLeft, BookOpen, CalendarBlank, ClipboardText, Exam, LinkSimple, UsersThree, VideoCamera, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch, AuthUser, StudentCalendarItem } from "../_lib/api";
import styles from "./styles.module.css";

const typeNames = { live_lesson: "Jonli dars", exam: "Imtihon", meeting: "Uchrashuv", deadline: "Muhim muddat", other: "Tadbir", assignment_due: "Uy vazifasi muddati" };
const fullDate = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
const time = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function StudentCalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<StudentCalendarItem[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "student") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin/calendar" : "/teacher");
        setUser(profile);
        const response = await apiFetch("/api/v1/me/calendar");
        if (!response.ok) throw new Error("Taqvimni yuklab bo‘lmadi");
        setItems((await response.json()) as StudentCalendarItem[]);
        setCurrentTime(Date.now());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const upcoming = useMemo(() => currentTime === null ? [] : items.filter((item) => new Date(item.starts_at).getTime() >= currentTime), [items, currentTime]);
  const past = useMemo(() => currentTime === null ? [] : items.filter((item) => new Date(item.starts_at).getTime() < currentTime).reverse(), [items, currentTime]);

  function icon(item: StudentCalendarItem) {
    if (item.event_type === "live_lesson") return VideoCamera;
    if (item.event_type === "exam") return Exam;
    if (item.event_type === "meeting") return UsersThree;
    if (item.event_type === "assignment_due") return ClipboardText;
    return CalendarBlank;
  }

  function card(item: StudentCalendarItem, isPast = false) {
    const Icon = icon(item);
    return <article className={isPast ? styles.past : ""} key={`${item.source}-${item.id}`}><div className={`${styles.date} ${styles[item.event_type]}`}><strong>{new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit" }).format(new Date(item.starts_at))}</strong><small>{new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", month: "short" }).format(new Date(item.starts_at))}</small></div><span className={styles.icon}><Icon weight="duotone" /></span><div className={styles.info}><p>{typeNames[item.event_type]} · {item.course_title}</p><h3>{item.title}</h3><span>{fullDate(item.starts_at)} · {time(item.starts_at)}{item.ends_at ? `–${time(item.ends_at)}` : ""}</span>{item.description && <small>{item.description}</small>}</div><div className={styles.action}>{item.source === "assignment" ? <Link href={`/assignments/${item.id}`}>Vazifani ochish</Link> : item.meeting_url ? <a href={item.meeting_url} target="_blank" rel="noreferrer"><LinkSimple /> Ulanish</a> : <span>Rejalashtirilgan</span>}</div></article>;
  }

  return <main className={styles.shell}><header><Link href="/" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link><span>{user?.full_name}</span></header><section className={styles.hero}><Link href="/my-courses"><ArrowLeft /> Kurslarimga qaytish</Link><p>SHAXSIY TAQVIM</p><h1>O‘quv jadvalim</h1><span>Jonli darslar, imtihonlar va topshiriq muddatlari bir joyda.</span><CalendarBlank weight="duotone" /></section><section className={styles.content}>{loading && <div className={styles.state}>Taqvim yuklanmoqda…</div>}{error && <div className={`${styles.state} ${styles.error}`}><WarningCircle />{error}</div>}{!loading && !error && <><div className={styles.summary}><article><CalendarBlank /><div><small>Yaqin tadbirlar</small><strong>{upcoming.length}</strong></div></article><article><VideoCamera /><div><small>Jonli darslar</small><strong>{upcoming.filter((item) => item.event_type === "live_lesson").length}</strong></div></article><article><ClipboardText /><div><small>Vazifa muddatlari</small><strong>{upcoming.filter((item) => item.event_type === "assignment_due").length}</strong></div></article></div><section className={styles.timeline}><div className={styles.title}><p>OLDINDA</p><h2>Yaqin tadbirlar</h2></div>{upcoming.map((item) => card(item))}{upcoming.length === 0 && <div className={styles.empty}><CalendarBlank weight="duotone" /><h2>Yaqin tadbir yo‘q</h2><p>Yangi jadval nashr qilinganda shu yerda ko‘rinadi.</p></div>}</section>{past.length > 0 && <section className={`${styles.timeline} ${styles.history}`}><div className={styles.title}><p>TARIX</p><h2>O‘tgan tadbirlar</h2></div>{past.slice(0, 20).map((item) => card(item, true))}</section>}</>}</section></main>;
}
