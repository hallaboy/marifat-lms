"use client";

import { ArrowLeft, Bank, BookOpen, CheckCircle, CreditCard, Money, Receipt, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiFetch, AuthUser, Enrollment, Payment, PaymentMethod, PaymentSummary, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const statusNames = { pending: "Kutilmoqda", paid: "To‘langan", cancelled: "Bekor qilingan", refunded: "Qaytarilgan" };
const methodNames: Record<PaymentMethod, string> = { cash: "Naqd", bank_transfer: "Bank o‘tkazmasi", card: "Karta", click: "Click", payme: "Payme", uzum: "Uzum", other: "Boshqa" };
const money = (value: number) => `${value.toLocaleString("uz-UZ")} so‘m`;

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ enrollment_id: "", amount_uzs: 0, due_at: "", note: "" });
  const [confirmForm, setConfirmForm] = useState<{ payment_method: PaymentMethod; provider_reference: string; note: string }>({ payment_method: "bank_transfer", provider_reference: "", note: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    const [paymentResponse, summaryResponse] = await Promise.all([
      apiFetch("/api/v1/admin/payments"),
      apiFetch("/api/v1/admin/payments/summary"),
    ]);
    if (!paymentResponse.ok || !summaryResponse.ok) throw new Error("To‘lov ma’lumotlarini yuklab bo‘lmadi");
    const nextPayments = (await paymentResponse.json()) as Payment[];
    setPayments(nextPayments);
    setSummary((await summaryResponse.json()) as PaymentSummary);
    setSelected((current) => current ? nextPayments.find((item) => item.id === current.id) ?? null : null);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/");
        const enrollmentResponse = await apiFetch("/api/v1/admin/enrollments");
        if (!enrollmentResponse.ok) throw new Error("Biriktirishlarni yuklab bo‘lmadi");
        setEnrollments((await enrollmentResponse.json()) as Enrollment[]);
        await refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const availableEnrollments = useMemo(() => {
    const invoiced = new Set(payments.map((item) => item.enrollment_id));
    return enrollments.filter((item) => !invoiced.has(item.id));
  }, [enrollments, payments]);

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/payments", {
      method: "POST",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({ ...invoiceForm, due_at: invoiceForm.due_at ? new Date(`${invoiceForm.due_at}T23:59:59`).toISOString() : null }),
    });
    const data = (await response.json().catch(() => ({}))) as Payment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Hisobni yaratib bo‘lmadi");
    setInvoiceForm({ enrollment_id: "", amount_uzs: 0, due_at: "", note: "" });
    setShowInvoiceForm(false); setSelected(data); setMessage("Yangi to‘lov hisobi yaratildi.");
    await refresh();
  }

  async function setStatus(payment: Payment, status: Payment["status"]) {
    if ((status === "cancelled" || status === "refunded") && !window.confirm(`Hisobni “${statusNames[status]}” holatiga o‘tkazasizmi?`)) return;
    setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const payload = status === "paid" ? { status, ...confirmForm, provider_reference: confirmForm.provider_reference || null } : { status };
    const response = await apiFetch(`/api/v1/admin/payments/${payment.id}/status`, {
      method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as Payment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "To‘lov holatini yangilab bo‘lmadi");
    setConfirmForm({ payment_method: "bank_transfer", provider_reference: "", note: "" });
    setSelected(data); setMessage(status === "paid" ? "To‘lov tasdiqlandi." : "To‘lov holati yangilandi.");
    await refresh();
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />SiteLearning</span></header>
      <section className={styles.content}>
        <div className={styles.heading}><div><p>MOLIYAVIY HISOB</p><h1>To‘lovlar boshqaruvi</h1><span>Hisoblar, tushumlar va to‘lov holatlarini nazorat qiling.</span></div><button onClick={() => setShowInvoiceForm((value) => !value)}><Receipt /> Yangi hisob</button></div>
        {error && <div className={styles.error}><WarningCircle />{error}</div>}
        {message && <div className={styles.success}><CheckCircle />{message}</div>}

        <section className={styles.stats}>
          <article><span><Receipt /></span><div><small>Jami hisob</small><strong>{money(summary?.total_invoiced_uzs ?? 0)}</strong></div></article>
          <article><span><CheckCircle /></span><div><small>To‘langan</small><strong>{money(summary?.paid_uzs ?? 0)}</strong><p>{summary?.paid_count ?? 0} ta hisob</p></div></article>
          <article><span><Money /></span><div><small>Kutilmoqda</small><strong>{money(summary?.pending_uzs ?? 0)}</strong><p>{summary?.pending_count ?? 0} ta hisob</p></div></article>
          <article><span><Bank /></span><div><small>Qaytarilgan</small><strong>{money(summary?.refunded_uzs ?? 0)}</strong></div></article>
        </section>

        {showInvoiceForm && <form className={styles.invoiceForm} onSubmit={createInvoice}><h2>Qo‘lda hisob yaratish</h2><label>Biriktirish<select value={invoiceForm.enrollment_id} onChange={(event) => setInvoiceForm({ ...invoiceForm, enrollment_id: event.target.value })} required><option value="">Talaba va kursni tanlang</option>{availableEnrollments.map((item) => <option key={item.id} value={item.id}>{item.student_name} — {item.course_title}</option>)}</select></label><label>Summa (so‘m)<input type="number" min="1000" max="2000000000" step="1000" value={invoiceForm.amount_uzs || ""} onChange={(event) => setInvoiceForm({ ...invoiceForm, amount_uzs: Number(event.target.value) })} required /></label><label>Muddat<input type="date" value={invoiceForm.due_at} onChange={(event) => setInvoiceForm({ ...invoiceForm, due_at: event.target.value })} /></label><label className={styles.wide}>Izoh<textarea value={invoiceForm.note} onChange={(event) => setInvoiceForm({ ...invoiceForm, note: event.target.value })} /></label><div className={styles.formActions}><button type="button" onClick={() => setShowInvoiceForm(false)}>Bekor qilish</button><button type="submit"><Receipt /> Hisob yaratish</button></div></form>}

        <div className={styles.layout}>
          <section className={styles.list}><div className={styles.listHead}><h2>To‘lov hisoblari</h2><b>{payments.length}</b></div>{loading && <div className={styles.empty}>Yuklanmoqda…</div>}{!loading && payments.map((payment) => <button key={payment.id} className={selected?.id === payment.id ? styles.selected : ""} onClick={() => setSelected(payment)}><span><CreditCard weight="duotone" /></span><div><strong>{payment.student_name}</strong><small>{payment.course_title}</small></div><b>{money(payment.amount_uzs)}</b><em className={styles[payment.status]}>{statusNames[payment.status]}</em></button>)}{!loading && payments.length === 0 && <div className={styles.empty}>Hali to‘lov hisobi yo‘q.</div>}</section>
          <aside className={styles.editor}>{selected ? <><div className={styles.paymentHead}><div><p>HISOB TAFSILOTI</p><h2>{selected.student_name}</h2><span>{selected.student_email}</span></div><b className={styles[selected.status]}>{statusNames[selected.status]}</b></div><dl><div><dt>Kurs</dt><dd>{selected.course_title}</dd></div><div><dt>Summa</dt><dd>{money(selected.amount_uzs)}</dd></div><div><dt>Yaratilgan</dt><dd>{new Date(selected.created_at).toLocaleDateString("uz-UZ")}</dd></div><div><dt>Muddat</dt><dd>{selected.due_at ? new Date(selected.due_at).toLocaleDateString("uz-UZ") : "Belgilanmagan"}</dd></div><div><dt>To‘lov usuli</dt><dd>{selected.payment_method ? methodNames[selected.payment_method] : "—"}</dd></div><div><dt>Operatsiya raqami</dt><dd>{selected.provider_reference ?? "—"}</dd></div></dl>{selected.note && <div className={styles.note}>{selected.note}</div>}{selected.status === "pending" && <form className={styles.confirmForm} onSubmit={(event) => { event.preventDefault(); void setStatus(selected, "paid"); }}><h3>To‘lovni tasdiqlash</h3><label>To‘lov usuli<select value={confirmForm.payment_method} onChange={(event) => setConfirmForm({ ...confirmForm, payment_method: event.target.value as PaymentMethod })}>{Object.entries(methodNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Operatsiya raqami<input value={confirmForm.provider_reference} onChange={(event) => setConfirmForm({ ...confirmForm, provider_reference: event.target.value.replace(/[^A-Za-z0-9._:/-]/g, "") })} placeholder="Ixtiyoriy" /></label><label>Izoh<textarea value={confirmForm.note} onChange={(event) => setConfirmForm({ ...confirmForm, note: event.target.value })} /></label><button type="submit"><CheckCircle /> To‘landi deb belgilash</button><button type="button" className={styles.cancelButton} onClick={() => void setStatus(selected, "cancelled")}>Hisobni bekor qilish</button></form>}{selected.status === "paid" && <button className={styles.refundButton} onClick={() => void setStatus(selected, "refunded")}>To‘lov qaytarildi deb belgilash</button>}</> : <div className={styles.emptyEditor}><CreditCard weight="duotone" /><h2>Hisobni tanlang</h2><p>Tafsilotlarni ko‘rish va to‘lovni tasdiqlash uchun hisobni tanlang.</p></div>}</aside>
        </div>
      </section>
    </main>
  );
}
