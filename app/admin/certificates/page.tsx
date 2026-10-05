"use client";

import { ArrowLeft, BookOpen, CheckCircle, Medal, Prohibit, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch, AuthUser, Certificate, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const formatDate = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "long", year: "numeric" }).format(new Date(value));

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function refresh() {
    const response = await apiFetch("/api/v1/admin/certificates");
    const data = (await response.json().catch(() => ([]))) as Certificate[] & { detail?: string };
    if (!response.ok) throw new Error(data.detail ?? "Sertifikatlarni yuklab bo‘lmadi");
    setItems(data);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/");
        await refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("uz-UZ");
    if (!needle) return items;
    return items.filter((item) => `${item.student_name} ${item.course_title} ${item.verification_code}`.toLocaleLowerCase("uz-UZ").includes(needle));
  }, [items, query]);

  async function toggle(item: Certificate) {
    const reason = item.is_valid ? window.prompt("Sertifikatni bekor qilish sababini kiriting:") : null;
    if (item.is_valid && !reason?.trim()) return;
    if (!item.is_valid && !window.confirm("Sertifikatni qayta amaldagi holatga keltirasizmi?")) return;
    const token = readCsrfCookie();
    if (!token) return setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    setError(""); setMessage("");
    const response = await apiFetch(`/api/v1/admin/certificates/${item.id}/revoke`, {
      method: "PATCH",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({ revoke: item.is_valid, reason: item.is_valid ? reason?.trim() : null }),
    });
    const data = (await response.json().catch(() => ({}))) as Certificate & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Sertifikat holatini o‘zgartirib bo‘lmadi");
    setMessage(item.is_valid ? "Sertifikat bekor qilindi." : "Sertifikat qayta faollashtirildi.");
    await refresh();
  }

  return <main className={styles.shell}>
    <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header>
    <section className={styles.content}>
      <div className={styles.heading}><div><p>SERTIFIKATLAR REESTRI</p><h1>Sertifikatlar</h1><span>Berilgan sertifikatlarni tekshiring va zarur bo‘lsa bekor qiling.</span></div><Medal weight="duotone" /></div>
      {error && <div className={styles.error}><WarningCircle />{error}</div>}
      {message && <div className={styles.success}><CheckCircle />{message}</div>}
      <div className={styles.toolbar}><input type="search" placeholder="Talaba, kurs yoki kod bo‘yicha qidirish…" value={query} onChange={(event) => setQuery(event.target.value)} /><b>{filtered.length} ta</b></div>
      <section className={styles.board}>
        {loading && <div className={styles.empty}>Sertifikatlar yuklanmoqda…</div>}
        {!loading && filtered.map((item) => <article key={item.id}>
          <span className={item.is_valid ? styles.validIcon : styles.revokedIcon}><Medal weight="duotone" /></span>
          <div className={styles.info}><small>{item.course_title}</small><h2>{item.student_name}</h2><p>{formatDate(item.issued_at)} · <code>{item.verification_code}</code></p>{item.revoke_reason && <em>{item.revoke_reason}</em>}</div>
          <b className={item.is_valid ? styles.valid : styles.revoked}>{item.is_valid ? "Amalda" : "Bekor qilingan"}</b>
          <div className={styles.actions}><Link href={`/certificates/${item.verification_code}`} target="_blank"><ShieldCheck /> Tekshirish</Link><button onClick={() => void toggle(item)}><Prohibit />{item.is_valid ? "Bekor qilish" : "Faollashtirish"}</button></div>
        </article>)}
        {!loading && filtered.length === 0 && <div className={styles.empty}><Medal weight="duotone" /><h2>Sertifikat topilmadi</h2><p>Yakunlangan kurslar uchun sertifikat avtomatik yaratiladi.</p></div>}
      </section>
    </section>
  </main>;
}
