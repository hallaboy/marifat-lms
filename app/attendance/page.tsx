"use client";

import { ArrowLeft, BookOpen, CalendarCheck, CheckCircle, Clock, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, StudentAttendance } from "../_lib/api";
import styles from "./styles.module.css";

const statusNames = { present: "Qatnashdi", absent: "Qatnashmadi", late: "Kechikdi", excused: "Sababli" };

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<StudentAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { async function load() { try { const profileResponse = await apiFetch("/api/v1/auth/me"); if (profileResponse.status === 401) return router.replace("/login"); const profile = (await profileResponse.json()) as AuthUser; if (profile.role !== "student") return router.replace(profile.role === "teacher" ? "/teacher" : "/admin"); setUser(profile); const response = await apiFetch("/api/v1/me/attendance"); if (!response.ok) throw new Error("Davomatni yuklab bo‘lmadi"); setData((await response.json()) as StudentAttendance); } catch (cause) { setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"); } finally { setLoading(false); } } void load(); }, [router]);
  return <main className={styles.shell}><header><Link href="/" className={styles.brand}><BookOpen weight="fill" />SiteLearning</Link><span>{user?.full_name}</span></header><section className={styles.hero}><Link href="/my-courses"><ArrowLeft /> Kurslarimga qaytish</Link><p>QATNASHUV TARIXI</p><h1>Mening davomatim</h1><span>Darslarda qatnashish holatingiz va umumiy ko‘rsatkich.</span><CalendarCheck weight="duotone" /></section>{loading && <div className={styles.state}>Davomat yuklanmoqda…</div>}{error && <div className={`${styles.state} ${styles.error}`}>{error}</div>}{data && <section className={styles.content}><div className={styles.stats}><article><CalendarCheck /><div><small>Davomat ko‘rsatkichi</small><strong>{data.summary.attendance_percent}%</strong></div></article><article><CheckCircle /><div><small>Qatnashgan</small><strong>{data.summary.present}</strong></div></article><article><Clock /><div><small>Kechikkan</small><strong>{data.summary.late}</strong></div></article><article><XCircle /><div><small>Qatnashmagan</small><strong>{data.summary.absent}</strong></div></article></div><section className={styles.list}><h2>Darslar bo‘yicha davomat</h2>{data.records.map((record) => <article key={record.id}><span className={styles[record.status]}>{record.status === "present" ? <CheckCircle /> : record.status === "late" ? <Clock /> : <XCircle />}</span><div><h3>{record.lesson_title}</h3><p>{new Date(record.marked_at).toLocaleString("uz-UZ")}</p>{record.note && <small>{record.note}</small>}</div><b className={styles[record.status]}>{statusNames[record.status]}</b></article>)}{data.records.length === 0 && <div className={styles.empty}><CalendarCheck weight="duotone" /><h3>Davomat hali belgilanmagan</h3><p>O‘qituvchi davomatni belgilagach, natija shu yerda ko‘rinadi.</p></div>}</section></section>}</main>;
}
