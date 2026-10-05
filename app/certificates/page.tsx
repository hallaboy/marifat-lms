"use client";

import { ArrowLeft, BookOpen, CheckCircle, Medal, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, Certificate, readCsrfCookie } from "../_lib/api";
import styles from "./styles.module.css";

export default function CertificatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { async function load() { try { const profileResponse = await apiFetch("/api/v1/auth/me"); if (profileResponse.status === 401) return router.replace("/login"); const profile = (await profileResponse.json()) as AuthUser; if (profile.role !== "student") return router.replace(profile.role === "teacher" ? "/teacher" : "/admin"); setUser(profile); const token = readCsrfCookie(); if (!token) return router.replace("/login"); const response = await apiFetch("/api/v1/me/certificates/sync", { method: "POST", headers: { "X-CSRF-Token": token } }); const data = (await response.json().catch(() => ([]))) as Certificate[] & { detail?: string }; if (!response.ok) throw new Error(data.detail ?? "Sertifikatlarni yuklab bo‘lmadi"); setItems(data); } catch (cause) { setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"); } finally { setLoading(false); } } void load(); }, [router]);
  return <main className={styles.shell}><header><Link href="/" className={styles.brand}><BookOpen weight="fill" />SiteLearning</Link><span>{user?.full_name}</span></header><section className={styles.hero}><Link href="/my-courses"><ArrowLeft /> Kurslarimga qaytish</Link><p>YUTUQLARIM</p><h1>Sertifikatlarim</h1><span>Yakunlangan kurslar uchun tekshiriladigan rasmiy sertifikatlar.</span><Medal weight="duotone" /></section>{loading && <div className={styles.state}>Sertifikatlar tekshirilmoqda…</div>}{error && <div className={`${styles.state} ${styles.error}`}>{error}</div>}{!loading && !error && <section className={styles.grid}>{items.map((item) => <article key={item.id}><div className={styles.seal}><Medal weight="duotone" /></div><small>KURS SERTIFIKATI</small><h2>{item.course_title}</h2><p>{item.student_name}</p><div><CheckCircle /> {new Date(item.completed_at).toLocaleDateString("uz-UZ")} kuni yakunlangan</div><code>{item.verification_code}</code><Link href={`/certificates/${item.verification_code}`}><ShieldCheck /> Sertifikatni ochish</Link></article>)}{items.length === 0 && <div className={styles.empty}><Medal weight="duotone" /><h2>Hali sertifikat yo‘q</h2><p>Kursning barcha darslarini yakunlaganingizdan keyin sertifikat avtomatik beriladi.</p></div>}</section>}</main>;
}
