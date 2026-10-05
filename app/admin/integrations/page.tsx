"use client";

import { ArrowClockwise, ArrowLeft, BookOpen, CheckCircle, CloudArrowUp, PaperPlaneTilt, PlugsConnected, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, IntegrationAdmin, IntegrationDelivery, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const names: Record<IntegrationDelivery["status"], string> = { pending: "Navbatda", processing: "Yuborilmoqda", delivered: "Yetkazildi", failed: "Qayta urinish", dead: "To‘xtatildi" };

export default function AdminIntegrationsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<IntegrationAdmin | null>(null);
  const [items, setItems] = useState<IntegrationDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    const [summaryResponse, deliveriesResponse] = await Promise.all([apiFetch("/api/v1/admin/integrations"), apiFetch("/api/v1/admin/integrations/deliveries")]);
    if (!summaryResponse.ok || !deliveriesResponse.ok) throw new Error("Integratsiya holatini yuklab bo‘lmadi");
    setSummary((await summaryResponse.json()) as IntegrationAdmin);
    setItems((await deliveriesResponse.json()) as IntegrationDelivery[]);
  }

  useEffect(() => { async function load() { try { const profileResponse = await apiFetch("/api/v1/auth/me"); if (profileResponse.status === 401) return router.replace("/login"); const profile = (await profileResponse.json()) as AuthUser; if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/"); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"); } finally { setLoading(false); } } void load(); }, [router]);

  function csrf() { const token = readCsrfCookie(); if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring."); return token; }

  async function processQueue() {
    const token = csrf(); if (!token) return; setError(""); setMessage("");
    const response = await apiFetch("/api/v1/admin/integrations/deliveries/process", { method: "POST", headers: { "X-CSRF-Token": token } });
    const data = (await response.json().catch(() => ({}))) as { delivered?: number; detail?: string };
    if (!response.ok) return setError(data.detail ?? "Navbatni qayta ishlab bo‘lmadi");
    setMessage(`${data.delivered ?? 0} ta yetkazma yuborildi.`); await refresh();
  }

  async function retry(item: IntegrationDelivery) {
    const token = csrf(); if (!token) return; setError("");
    const response = await apiFetch(`/api/v1/admin/integrations/deliveries/${item.id}/retry`, { method: "POST", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Yetkazmani qayta navbatga qo‘yib bo‘lmadi");
    setMessage("Yetkazma qayta navbatga qo‘yildi."); await refresh();
  }

  return <main className={styles.shell}><header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />ma&apos;rifat</span></header><section className={styles.content}><div className={styles.heading}><div><p>YETKAZIB BERISH KANALLARI</p><h1>Integratsiyalar</h1><span>Telegram va CRM outbox holatini xavfsiz kuzating.</span></div><button onClick={() => void processQueue()}><ArrowClockwise /> Navbatni ishlash</button></div>{error && <div className={styles.error}><WarningCircle />{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}{loading ? <div className={styles.state}>Holat yuklanmoqda…</div> : summary && <><section className={styles.providers}><article className={summary.telegram_enabled ? styles.enabled : styles.disabled}><PaperPlaneTilt weight="fill" /><div><small>TELEGRAM</small><h2>{summary.telegram_enabled ? "Faol" : "Sozlanmagan"}</h2><p>{summary.telegram_enabled ? `@${summary.telegram_bot_username ?? "bot"} · ${summary.linked_telegram_accounts} bog‘langan hisob` : "Token, bot username va webhook siri secret storage’da beriladi."}</p></div></article><article className={summary.crm_enabled ? styles.enabled : styles.disabled}><CloudArrowUp weight="duotone" /><div><small>CRM WEBHOOK</small><h2>{summary.crm_enabled ? "Faol" : "Sozlanmagan"}</h2><p>{summary.crm_enabled ? "HMAC-SHA256 imzoli hodisalar yuboriladi." : "HTTPS webhook manzili va HMAC siri serverda sozlanadi."}</p></div></article></section><section className={styles.stats}><article><small>Navbatda</small><b>{summary.pending_deliveries}</b></article><article><small>Qayta urinish</small><b>{summary.failed_deliveries}</b></article><article><small>Yetkazilgan</small><b>{summary.delivered_deliveries}</b></article><article><small>To‘xtatilgan</small><b>{summary.dead_deliveries}</b></article></section><section className={styles.board}><div className={styles.boardHead}><div><PlugsConnected /><h2>Yetkazmalar jurnali</h2></div><b>{items.length}</b></div>{items.map((item) => <article key={item.id}><span className={item.channel === "telegram" ? styles.telegram : styles.crm}>{item.channel === "telegram" ? <PaperPlaneTilt weight="fill" /> : <CloudArrowUp />}</span><div><small>{item.event_type} · {item.destination}</small><h3>{item.channel === "telegram" ? "Telegram" : "CRM webhook"}</h3><p>{new Date(item.created_at).toLocaleString("uz-UZ")} · {item.attempts} urinish{item.last_error ? ` · ${item.last_error}` : ""}</p></div><b className={styles[item.status]}>{names[item.status]}</b>{(item.status === "failed" || item.status === "dead") && <button onClick={() => void retry(item)}><ArrowClockwise /> Qayta urinish</button>}</article>)}{items.length === 0 && <div className={styles.empty}><PlugsConnected weight="duotone" /><h2>Yetkazmalar hali yo‘q</h2><p>Bildirishnoma nashr qilinganda faol kanallar uchun outbox yozuvi yaratiladi.</p></div>}</section></>}</section></main>;
}
