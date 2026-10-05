"use client";

import { ArrowLeft, Bank, BookOpen, CheckCircle, CreditCard, Hourglass, Receipt, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch, AuthUser, Payment, PaymentMethod, PaymentProviders, readCsrfCookie } from "../_lib/api";
import styles from "./styles.module.css";
import checkoutStyles from "./checkout.module.css";

const statusNames = { pending: "To‘lov kutilmoqda", paid: "To‘langan", cancelled: "Bekor qilingan", refunded: "Qaytarilgan" };
const methodNames: Record<PaymentMethod, string> = { cash: "Naqd", bank_transfer: "Bank o‘tkazmasi", card: "Karta", click: "Click", payme: "Payme", uzum: "Uzum", other: "Boshqa" };
const money = (value: number) => `${value.toLocaleString("uz-UZ")} so‘m`;

export default function StudentPaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [providers, setProviders] = useState<PaymentProviders>({ click: false, payme: false, uzum: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "student") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin/payments" : "/teacher");
        setUser(profile);
        const [paymentResponse, providerResponse] = await Promise.all([apiFetch("/api/v1/me/payments"), apiFetch("/api/v1/me/payments/providers")]);
        if (!paymentResponse.ok || !providerResponse.ok) throw new Error("To‘lovlaringizni yuklab bo‘lmadi");
        setPayments((await paymentResponse.json()) as Payment[]);
        setProviders((await providerResponse.json()) as PaymentProviders);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const totals = useMemo(() => ({
    paid: payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount_uzs, 0),
    pending: payments.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount_uzs, 0),
  }), [payments]);

  async function checkout(payment: Payment, provider: "click" | "payme") {
    const token = readCsrfCookie();
    if (!token) return setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    setError("");
    const response = await apiFetch(`/api/v1/me/payments/${payment.id}/checkout/${provider}`, { method: "POST", headers: { "X-CSRF-Token": token } });
    const data = (await response.json().catch(() => ({}))) as { checkout_url?: string; detail?: string };
    if (!response.ok || !data.checkout_url) return setError(data.detail ?? "To‘lov sahifasini ochib bo‘lmadi");
    window.location.assign(data.checkout_url);
  }

  return <main className={styles.shell}>
    <header><Link href="/" className={styles.brand}><BookOpen weight="fill" />SiteLearning</Link><span>{user?.full_name}</span></header>
    <section className={styles.hero}><Link href="/my-courses"><ArrowLeft /> Kurslarimga qaytish</Link><p>MOLIYAVIY KABINET</p><h1>Mening to‘lovlarim</h1><span>Kurslar bo‘yicha hisob va to‘lov tarixingiz.</span><CreditCard weight="duotone" /></section>
    <section className={styles.content}>
      {loading && <div className={styles.state}>To‘lovlar yuklanmoqda…</div>}
      {error && <div className={`${styles.state} ${styles.error}`}><WarningCircle />{error}</div>}
      {!loading && !error && <>
        <div className={styles.stats}><article><CheckCircle /><div><small>Jami to‘langan</small><strong>{money(totals.paid)}</strong></div></article><article><Hourglass /><div><small>Kutilayotgan summa</small><strong>{money(totals.pending)}</strong></div></article><article><Receipt /><div><small>Hisoblar</small><strong>{payments.length} ta</strong></div></article></div>
        <section className={styles.list}><div className={styles.listTitle}><div><p>TO‘LOV TARIXI</p><h2>Hisoblar</h2></div><Bank /></div>
          {payments.map((payment) => <article key={payment.id}><span className={styles[payment.status]}>{payment.status === "paid" ? <CheckCircle weight="fill" /> : <CreditCard weight="duotone" />}</span><div><h3>{payment.course_title}</h3><p>Hisob sanasi: {new Date(payment.created_at).toLocaleDateString("uz-UZ")}{payment.due_at ? ` · Muddat: ${new Date(payment.due_at).toLocaleDateString("uz-UZ")}` : ""}</p>{payment.payment_method && <small>{methodNames[payment.payment_method]}{payment.provider_reference ? ` · ${payment.provider_reference}` : ""}</small>}{payment.note && <small>{payment.note}</small>}{payment.status === "pending" && <div className={checkoutStyles.checkout}>{providers.click && <button onClick={() => void checkout(payment, "click")}>Click orqali to‘lash</button>}{providers.payme && <button onClick={() => void checkout(payment, "payme")}>Payme orqali to‘lash</button>}</div>}</div><strong>{money(payment.amount_uzs)}</strong><em className={styles[payment.status]}>{statusNames[payment.status]}</em></article>)}
          {payments.length === 0 && <div className={styles.empty}><Receipt weight="duotone" /><h2>To‘lov hisobi mavjud emas</h2><p>Pullik kursga biriktirilganingizda hisob shu yerda ko‘rinadi.</p></div>}
        </section>
        {!providers.click && !providers.payme && <aside className={styles.notice}><WarningCircle /><div><b>Onlayn provayderlar sozlanmoqda</b><span>Click va Payme adapterlari tayyor. Merchant kalitlari server secret storage’iga kiritilgach to‘lov tugmalari avtomatik faollashadi. Uzum ulanishi hamkorlik rekvizitlari olingach yoqiladi.</span></div></aside>}
      </>}
    </section>
  </main>;
}
