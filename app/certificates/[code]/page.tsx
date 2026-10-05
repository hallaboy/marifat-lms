"use client";

import { CheckCircle, Medal, Printer, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, Certificate } from "../../_lib/api";
import styles from "./styles.module.css";

export default function CertificatePage() {
  const params = useParams<{ code: string }>();
  const [item, setItem] = useState<Certificate | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch(`/api/v1/certificates/${encodeURIComponent(params.code)}`).then(async (response) => { const data = (await response.json().catch(() => ({}))) as Certificate & { detail?: string }; if (!response.ok) throw new Error(data.detail ?? "Sertifikat topilmadi"); setItem(data); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Sertifikatni tekshirib bo‘lmadi")); }, [params.code]);
  if (error) return <main className={styles.state}><WarningCircle /><h1>Sertifikat tasdiqlanmadi</h1><p>{error}</p><Link href="/">SiteLearning LMS</Link></main>;
  if (!item) return <main className={styles.state}><Medal /><p>Sertifikat tekshirilmoqda…</p></main>;
  return <main className={styles.page}><section className={`${styles.certificate} ${!item.is_valid ? styles.revoked : ""}`}><div className={styles.border}><header><span><Medal weight="duotone" /></span><div><b>SiteLearning</b><small>LEARNING MANAGEMENT SYSTEM</small></div><ShieldCheck /></header><p className={styles.eyebrow}>KURSNI MUVAFFAQIYATLI YAKUNLAGANLIK HAQIDA</p><h1>SERTIFIKAT</h1><p className={styles.presented}>Ushbu sertifikat</p><h2>{item.student_name}</h2><p className={styles.text}>“<strong>{item.course_title}</strong>” kursini to‘liq yakunlagani uchun berildi.</p><div className={styles.meta}><span><small>Yakunlangan sana</small><b>{new Date(item.completed_at).toLocaleDateString("uz-UZ")}</b></span><span><small>Berilgan sana</small><b>{new Date(item.issued_at).toLocaleDateString("uz-UZ")}</b></span></div><footer><div><CheckCircle weight="fill" /><span><b>{item.is_valid ? "Sertifikat haqiqiy" : "Sertifikat bekor qilingan"}</b><small>{item.revoke_reason ?? "SiteLearning LMS tomonidan tasdiqlangan"}</small></span></div><code>{item.verification_code}</code></footer></div></section><div className={styles.actions}><Link href="/">SiteLearning LMS</Link><button onClick={() => window.print()}><Printer /> PDF / Chop etish</button></div></main>;
}
