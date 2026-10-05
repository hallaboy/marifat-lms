"use client";

import { ArrowLeft, CaretDown, ChatCircleDots, CheckCircle, Clock, Headset, MagnifyingGlass, PaperPlaneTilt, Plus, Question, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiFetch, AuthUser, HelpFaq, readCsrfCookie, SupportTicket, SupportTicketPriority } from "../_lib/api";
import styles from "./styles.module.css";

const statusNames = { open: "Yangi", in_progress: "Ko‘rib chiqilmoqda", resolved: "Hal qilindi", closed: "Yopildi" };
const priorityNames = { low: "Past", normal: "Oddiy", high: "Muhim", urgent: "Shoshilinch" };
const categories = ["Texnik muammo", "Kurs va darslar", "To‘lovlar", "Hisob va kirish", "Boshqa"];
const emptyTicket = { category: categories[0], subject: "", message: "", priority: "normal" as Exclude<SupportTicketPriority, "urgent"> };
const dateTime = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function HelpPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [faqs, setFaqs] = useState<HelpFaq[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [ticketForm, setTicketForm] = useState(emptyTicket);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refreshTickets(preferredId?: string) {
    const response = await apiFetch("/api/v1/me/support-tickets");
    if (!response.ok) throw new Error("Murojaatlarni yuklab bo‘lmadi");
    const data = (await response.json()) as SupportTicket[];
    setTickets(data);
    const targetId = preferredId ?? selectedId;
    if (targetId && data.some((item) => item.id === targetId)) setSelectedId(targetId);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        setUser((await profileResponse.json()) as AuthUser);
        const [faqResponse, ticketResponse] = await Promise.all([apiFetch("/api/v1/help/faqs"), apiFetch("/api/v1/me/support-tickets")]);
        if (!faqResponse.ok || !ticketResponse.ok) throw new Error("Yordam markazini yuklab bo‘lmadi");
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

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/me/support-tickets", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(ticketForm) });
    const data = (await response.json().catch(() => ({}))) as SupportTicket & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Murojaatni yuborib bo‘lmadi");
    setTicketForm(emptyTicket); setShowForm(false); setMessage("Murojaatingiz qabul qilindi.");
    await refreshTickets(data.id);
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const selected = tickets.find((item) => item.id === selectedId); if (!selected) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/me/support-tickets/${selected.id}/messages`, { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ message: reply }) });
    const data = (await response.json().catch(() => ({}))) as SupportTicket & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Javobni yuborib bo‘lmadi");
    setReply(""); setMessage("Javob yuborildi."); await refreshTickets(selected.id);
  }

  const filteredFaqs = useMemo(() => faqs.filter((item) => `${item.category} ${item.question} ${item.answer}`.toLocaleLowerCase("uz").includes(query.toLocaleLowerCase("uz"))), [faqs, query]);
  const selected = tickets.find((item) => item.id === selectedId) ?? null;
  const backHref = user?.role === "admin" || user?.role === "super_admin" ? "/admin" : user?.role === "student" ? "/" : "/teacher";

  return <main className={styles.shell}>
    <header><Link href={backHref}><ArrowLeft /> Kabinetga qaytish</Link><span><Headset weight="fill" />Yordam markazi</span></header>
    <section className={styles.hero}><div><p>MA’RIFAT YORDAM MARKAZI</p><h1>Sizga qanday yordam beramiz?</h1><span>Yo‘riqnomalarni qidiring yoki texnik yordamga murojaat yuboring.</span></div><label><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Savol yoki mavzuni qidiring..." /></label></section>
    <section className={styles.content}>
      {error && <div className={styles.error}><WarningCircle />{error}</div>}
      {message && <div className={styles.success}><CheckCircle />{message}</div>}
      {loading ? <div className={styles.state}>Yordam markazi yuklanmoqda…</div> : <>
        <section className={styles.faqSection}><div className={styles.title}><div><p>KO‘P SO‘RALADIGAN SAVOLLAR</p><h2>Tezkor javoblar</h2></div><b>{filteredFaqs.length}</b></div><div className={styles.faqs}>{filteredFaqs.map((faq) => <article key={faq.id} className={openFaq === faq.id ? styles.open : ""}><button onClick={() => setOpenFaq((current) => current === faq.id ? null : faq.id)}><span><small>{faq.category}</small><strong>{faq.question}</strong></span><CaretDown /></button>{openFaq === faq.id && <p>{faq.answer}</p>}</article>)}{filteredFaqs.length === 0 && <div className={styles.empty}><Question weight="duotone" /><h3>Javob topilmadi</h3><p>Texnik yordamga murojaat yuborishingiz mumkin.</p></div>}</div></section>
        <section className={styles.supportSection}><div className={styles.title}><div><p>TEXNIK YORDAM</p><h2>Murojaatlarim</h2></div><button onClick={() => setShowForm((value) => !value)}><Plus /> Yangi murojaat</button></div>
          {showForm && <form className={styles.ticketForm} onSubmit={createTicket}><label>Yo‘nalish<select value={ticketForm.category} onChange={(event) => setTicketForm({ ...ticketForm, category: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Muhimlik<select value={ticketForm.priority} onChange={(event) => setTicketForm({ ...ticketForm, priority: event.target.value as typeof ticketForm.priority })}><option value="low">Past</option><option value="normal">Oddiy</option><option value="high">Muhim</option></select></label><label className={styles.wide}>Mavzu<input value={ticketForm.subject} onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })} minLength={5} required /></label><label className={styles.wide}>Muammoni batafsil yozing<textarea value={ticketForm.message} onChange={(event) => setTicketForm({ ...ticketForm, message: event.target.value })} minLength={10} required /></label><div className={styles.actions}><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button type="submit"><PaperPlaneTilt /> Yuborish</button></div></form>}
          <div className={styles.ticketLayout}><aside className={styles.ticketList}>{tickets.map((ticket) => <button key={ticket.id} className={selectedId === ticket.id ? styles.selected : ""} onClick={() => setSelectedId(ticket.id)}><span className={`${styles.ticketIcon} ${styles[ticket.status]}`}><ChatCircleDots /></span><span><strong>{ticket.subject}</strong><small>{ticket.category} · {dateTime(ticket.updated_at)}</small></span><em className={styles[ticket.status]}>{statusNames[ticket.status]}</em></button>)}{tickets.length === 0 && <div className={styles.empty}><Headset weight="duotone" /><h3>Murojaat yo‘q</h3><p>Yordam kerak bo‘lsa yangi murojaat yuboring.</p></div>}</aside><section className={styles.conversation}>{selected ? <><header><div><small>{selected.category} · {priorityNames[selected.priority]}</small><h3>{selected.subject}</h3></div><b className={styles[selected.status]}>{statusNames[selected.status]}</b></header><div className={styles.messages}>{selected.messages.map((item) => <article className={item.is_staff ? styles.staff : styles.mine} key={item.id}><strong>{item.is_staff ? "Yordam xizmati" : item.author_name}</strong><p>{item.message}</p><small><Clock /> {dateTime(item.created_at)}</small></article>)}</div>{selected.status !== "closed" && <form className={styles.reply} onSubmit={sendReply}><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Qo‘shimcha ma’lumot yoki javob yozing..." minLength={2} required /><button><PaperPlaneTilt /> Yuborish</button></form>}</> : <div className={styles.empty}><ChatCircleDots weight="duotone" /><h3>Murojaatni tanlang</h3><p>Yozishmani ko‘rish uchun chap tomondagi murojaatni oching.</p></div>}</section></div>
        </section>
      </>}
    </section>
  </main>;
}
