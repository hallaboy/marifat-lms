"use client";

import { ArrowLeft, BellRinging, BookOpen, CheckCircle, Copy, LinkSimple, PaperPlaneTilt, PlugsConnected, Trash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AuthUser, FirebaseIntegration, readCsrfCookie, TelegramIntegration, TelegramLink } from "../_lib/api";
import { firebaseClientConfigured, getCurrentFirebaseInstallationId, registerFirebaseInstallation, unregisterFirebaseInstallation } from "../_lib/firebase";
import pushStyles from "./push.module.css";
import styles from "./styles.module.css";

export default function IntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [telegram, setTelegram] = useState<TelegramIntegration | null>(null);
  const [firebase, setFirebase] = useState<FirebaseIntegration | null>(null);
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentBrowserPush, setCurrentBrowserPush] = useState(false);

  async function refresh() {
    const [response, firebaseResponse] = await Promise.all([apiFetch("/api/v1/me/integrations/telegram"), apiFetch("/api/v1/me/integrations/firebase")]);
    if (!response.ok || !firebaseResponse.ok) throw new Error("Integratsiya holatini yuklab bo‘lmadi");
    setTelegram((await response.json()) as TelegramIntegration);
    setFirebase((await firebaseResponse.json()) as FirebaseIntegration);
  }

  useEffect(() => { async function load() { try { const profileResponse = await apiFetch("/api/v1/auth/me"); if (profileResponse.status === 401) return router.replace("/login"); const profile = (await profileResponse.json()) as AuthUser; setUser(profile); setCurrentBrowserPush(Boolean(getCurrentFirebaseInstallationId())); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"); } finally { setLoading(false); } } void load(); }, [router]);

  function csrf() { const token = readCsrfCookie(); if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring."); return token; }

  async function createLink() {
    const token = csrf(); if (!token) return; setError(""); setMessage("");
    const response = await apiFetch("/api/v1/me/integrations/telegram/link", { method: "POST", headers: { "X-CSRF-Token": token } });
    const data = (await response.json().catch(() => ({}))) as TelegramLink & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Bog‘lash kodini yaratib bo‘lmadi");
    setLink(data); setMessage("Bir martalik kod 15 daqiqa amal qiladi.");
  }

  async function unlink() {
    if (!window.confirm("Telegram hisobini uzasizmi?")) return;
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/me/integrations/telegram", { method: "DELETE", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Telegram hisobini uzib bo‘lmadi");
    setLink(null); setMessage("Telegram hisobi uzildi."); await refresh();
  }

  async function copyCommand() { if (!link) return; await navigator.clipboard.writeText(link.command); setMessage("Buyruq nusxalandi."); }

  async function enablePush() {
    const token = csrf(); if (!token) return; setError(""); setMessage("");
    try {
      const installationId = await registerFirebaseInstallation();
      const response = await apiFetch("/api/v1/me/integrations/firebase", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ installation_id: installationId, device_label: navigator.userAgent.slice(0, 120) }) });
      const data = (await response.json().catch(() => ({}))) as FirebaseIntegration & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Qurilmani ro‘yxatdan o‘tkazib bo‘lmadi");
      setFirebase(data); setCurrentBrowserPush(true); setMessage("Brauzer push bildirishnomalari yoqildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Firebase bilan aloqa uzildi"); }
  }

  async function disablePush() {
    const token = csrf(); if (!token) return;
    const installationId = getCurrentFirebaseInstallationId();
    if (!installationId) return setError("Ushbu brauzerning Firebase identifikatori topilmadi");
    setError(""); setMessage("");
    try {
      const response = await apiFetch(`/api/v1/me/integrations/firebase/${encodeURIComponent(installationId)}`, { method: "DELETE", headers: { "X-CSRF-Token": token } });
      if (!response.ok) throw new Error("Push ro‘yxatini o‘chirib bo‘lmadi");
      await unregisterFirebaseInstallation();
      setCurrentBrowserPush(false); await refresh(); setMessage("Ushbu brauzer uchun push o‘chirildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Firebase bilan aloqa uzildi"); }
  }

  const back = user?.role === "teacher" ? "/teacher" : user?.role === "student" ? "/" : "/admin";
  return <main className={styles.shell}><header><Link href={back}><ArrowLeft /> Kabinetga qaytish</Link><span><BookOpen weight="fill" />SiteLearning</span></header><section className={styles.content}><div className={styles.heading}><div><p>TASHQI XIZMATLAR</p><h1>Integratsiyalar</h1><span>Xabarlarni Telegram va brauzer push orqali xavfsiz qabul qiling.</span></div><PlugsConnected weight="duotone" /></div>{error && <div className={styles.error}><WarningCircle />{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}{loading ? <div className={styles.state}>Holat yuklanmoqda…</div> : <><article className={styles.card}><div className={styles.telegram}><PaperPlaneTilt weight="fill" /></div><div className={styles.info}><small>TELEGRAM BOT</small><h2>{telegram?.linked ? "Hisob bog‘langan" : "Telegram’ni bog‘lash"}</h2><p>{telegram?.linked ? `Bog‘langan sana: ${new Date(telegram.linked_at ?? "").toLocaleString("uz-UZ")}` : telegram?.enabled ? "Botni ochib bir martalik buyruqni yuboring." : "Administrator bot tokeni va webhook sirini hali sozlamagan."}</p></div>{telegram?.linked ? <button className={styles.danger} onClick={() => void unlink()}><Trash /> Uzish</button> : <button disabled={!telegram?.enabled} onClick={() => void createLink()}><LinkSimple /> Kod yaratish</button>}</article><article className={styles.card}><div className={pushStyles.firebase}><BellRinging weight="fill" /></div><div className={styles.info}><small>BRAUZER PUSH · FIREBASE</small><h2>{firebase?.installation_count ? "Push bildirishnomalari faol" : "Push bildirishnomalarini yoqish"}</h2><p>{firebase?.enabled && firebaseClientConfigured ? `${firebase.installation_count} ta qurilma ro‘yxatdan o‘tgan.` : "Firebase loyiha va VAPID konfiguratsiyasi hali sozlanmagan."}</p></div>{currentBrowserPush ? <button className={styles.danger} onClick={() => void disablePush()}><Trash /> O‘chirish</button> : <button disabled={!firebase?.enabled || !firebaseClientConfigured} onClick={() => void enablePush()}><BellRinging /> Yoqish</button>}</article></>}{link && <section className={styles.linkBox}><h2>Telegram botga yuboring</h2><code>{link.command}</code><div><button onClick={() => void copyCommand()}><Copy /> Nusxalash</button>{link.deep_link && <a href={link.deep_link} target="_blank" rel="noreferrer"><PaperPlaneTilt /> Botni ochish</a>}<button onClick={() => void refresh()}><CheckCircle /> Holatni tekshirish</button></div><p>Kodni hech kimga bermang. U bir marta ishlatiladi va {new Date(link.expires_at).toLocaleTimeString("uz-UZ")} gacha amal qiladi.</p></section>}</section></main>;
}
