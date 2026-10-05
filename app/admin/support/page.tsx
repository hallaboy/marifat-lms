"use client";

import { ArrowLeft, BookOpen, CheckCircle, ChatCircleDots, Clock, Headset, PaperPlaneTilt, Plus, RocketLaunch, Trash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser, HelpFaq, readCsrfCookie, SupportTicket, SupportTicketPriority, SupportTicketStatus } from "../../_lib/api";
import styles from "./styles.module.css";

const statusNames = { open: "Yangi", in_progress: "Jarayonda", resolved: "Hal qilindi", closed: "Yopildi" };
const priorityNames = { low: "Past", normal: "Oddiy", high: "Muhim", urgent: "Shoshilinch" };
const emptyFaq = { category: "", question: "", answer: "", display_order: 1 };
const dateTime = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function AdminSupportPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [faqForm, setFaqForm] = useState(emptyFaq);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | SupportTicketStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh(preferredId?: string) {
    const [faqResponse, ticketResponse] = await Promise.all([apiFetch("/api/v1/admin/help/faqs"), apiFetch("/api/v1/admin/support-tickets")]);
    if (!faqResponse.ok || !ticketResponse.ok) throw new Error("Yordam markazi ma’lumotlarini yuklab bo‘lmadi");
    const faqData = (await faqResponse.json()) as HelpFaq[];
    const ticketData = (await ticketResponse.json()) as SupportTicket[];
    setFaqs(faqData); setTickets(ticketData);
    const targetId = preferredId ?? selectedId;
    if (targetId && ticketData.some((item) => item.id === targetId)) setSelectedId(targetId);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/help");
        const [faqResponse, ticketResponse] = await Promise.all([apiFetch("/api/v1/admin/help/faqs"), apiFetch("/api/v1/admin/support-tickets")]);
        if (!faqResponse.ok || !ticketResponse.ok) throw new Error("Yordam markazi ma’lumotlarini yuklab bo‘lmadi");
        setFaqs((await faqResponse.json()) as HelpFaq[]);
        setTickets((await ticketResponse.json()) as SupportTicket[]);
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

  async function createFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/help/faqs", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(faqForm) });
    const data = (await response.json().catch(() => ({}))) as HelpFaq & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "FAQ yaratib bo‘lmadi");
    setFaqForm(emptyFaq); setShowFaqForm(false); setMessage("FAQ qoralama sifatida yaratildi."); await refresh();
  }

  async function toggleFaq(item: HelpFaq) {
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/help/faqs/${item.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: !item.is_published }) });
    if (!response.ok) return setError("FAQ nashr holatini o‘zgartirib bo‘lmadi");
    setMessage(item.is_published ? "FAQ nashrdan olindi." : "FAQ yordam markazida nashr qilindi."); await refresh();
  }

  async function removeFaq(item: HelpFaq) {
    if (!window.confirm(`“${item.question}” savolini o‘chirasizmi?`)) return;
    const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/help/faqs/${item.id}`, { method: "DELETE", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("FAQ o‘chirilmadi");
    setMessage("FAQ o‘chirildi."); await refresh();
  }

  async function updateTicket(status: SupportTicketStatus, priority: SupportTicketPriority) {
    const selected = tickets.find((item) => item.id === selectedId); if (!selected) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/support-tickets/${selected.id}`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ status, priority }) });
    const data = (await response.json().catch(() => ({}))) as SupportTicket & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Murojaat holatini yangilab bo‘lmadi");
    setMessage("Murojaat holati yangilandi."); await refresh(selected.id);
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const selected = tickets.find((item) => item.id === selectedId); if (!selected) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/support-tickets/${selected.id}/messages`, { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ message: reply }) });
    const data = (await response.json().catch(() => ({}))) as SupportTicket & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Javob yuborilmadi");
    setReply(""); setMessage("Javob foydalanuvchiga yuborildi."); await refresh(selected.id);
  }

  const selected = tickets.find((item) => item.id === selectedId) ?? null;
  const visibleTickets = filter === "all" ? tickets : tickets.filter((item) => item.status === filter);

  return <main className={styles.shell}>
    <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header>
    <section className={styles.content}>
      <div className={styles.heading}><div><p>QO‘LLAB-QUVVATLASH</p><h1>Yordam markazi</h1><span>FAQ va foydalanuvchi murojaatlarini yagona paneldan boshqaring.</span></div><button onClick={() => setShowFaqForm((value) => !value)}><Plus /> Yangi FAQ</button></div>
      {error && <div className={styles.error}><WarningCircle />{error}</div>}
      {message && <div className={styles.success}><CheckCircle />{message}</div>}
      {showFaqForm && <form className={styles.faqForm} onSubmit={createFaq}><h2>Yangi savol-javob</h2><label>Kategoriya<input value={faqForm.category} onChange={(event) => setFaqForm({ ...faqForm, category: event.target.value })} minLength={2} required /></label><label>Tartib<input type="number" min="1" value={faqForm.display_order} onChange={(event) => setFaqForm({ ...faqForm, display_order: Number(event.target.value) })} required /></label><label className={styles.wide}>Savol<input value={faqForm.question} onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })} minLength={5} required /></label><label className={styles.wide}>Javob<textarea value={faqForm.answer} onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })} minLength={5} required /></label><div className={styles.formActions}><button type="button" onClick={() => setShowFaqForm(false)}>Bekor qilish</button><button><Headset /> Saqlash</button></div></form>}
      <section className={styles.faqBoard}><div className={styles.boardHead}><div><Headset /><h2>FAQ boshqaruvi</h2></div><b>{faqs.length}</b></div>{faqs.map((item) => <article key={item.id}><div><small>{item.category} · #{item.display_order}</small><h3>{item.question}</h3><p>{item.answer}</p></div><b className={item.is_published ? styles.published : styles.draft}>{item.is_published ? "Nashrda" : "Qoralama"}</b><button onClick={() => void toggleFaq(item)}>{item.is_published ? "Yopish" : <><RocketLaunch /> Nashr</>}</button><button onClick={() => void removeFaq(item)} aria-label="FAQni o‘chirish"><Trash /></button></article>)}{!loading && faqs.length === 0 && <div className={styles.empty}>Hali FAQ yaratilmagan.</div>}</section>
      <section className={styles.ticketBoard}><div className={styles.ticketHead}><div><p>MUROJAATLAR</p><h2>Texnik yordam navbati</h2></div><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Barcha holatlar</option>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className={styles.ticketLayout}><aside>{visibleTickets.map((ticket) => <button key={ticket.id} className={selectedId === ticket.id ? styles.selected : ""} onClick={() => setSelectedId(ticket.id)}><span className={`${styles.ticketIcon} ${styles[ticket.status]}`}><ChatCircleDots /></span><span><strong>{ticket.subject}</strong><small>{ticket.user_name} · {dateTime(ticket.updated_at)}</small></span><em className={styles[ticket.priority]}>{priorityNames[ticket.priority]}</em></button>)}{!loading && visibleTickets.length === 0 && <div className={styles.empty}>Mos murojaat yo‘q.</div>}</aside><section className={styles.conversation}>{selected ? <><header><div><small>{selected.category}</small><h3>{selected.subject}</h3><p>{selected.user_name} · {selected.user_email}</p></div><div><select value={selected.priority} onChange={(event) => void updateTicket(selected.status, event.target.value as SupportTicketPriority)}>{Object.entries(priorityNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={selected.status} onChange={(event) => void updateTicket(event.target.value as SupportTicketStatus, selected.priority)}>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></header><div className={styles.messages}>{selected.messages.map((item) => <article className={item.is_staff ? styles.staff : styles.user} key={item.id}><strong>{item.is_staff ? "Administrator" : item.author_name}</strong><p>{item.message}</p><small><Clock /> {dateTime(item.created_at)}</small></article>)}</div>{selected.status !== "closed" && <form className={styles.reply} onSubmit={sendReply}><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Foydalanuvchiga javob yozing..." minLength={2} required /><button><PaperPlaneTilt /> Javob yuborish</button></form>}</> : <div className={styles.empty}><ChatCircleDots weight="duotone" /><h3>Murojaatni tanlang</h3><p>Yozishma va boshqaruv elementlari shu yerda ochiladi.</p></div>}</section></div></section>
    </section>
  </main>;
}
