"use client";

import { ArrowLeft, BookOpen, Plus, ShieldCheck, UserCircle, UserMinus, UserPlus } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser, readCsrfCookie } from "../_lib/api";
import styles from "./styles.module.css";

const roleNames: Record<AuthUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  teacher: "O‘qituvchi",
  student: "Talaba",
};

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "student" });

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (!profileResponse.ok) {
          router.replace("/login");
          return;
        }
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "super_admin" && profile.role !== "admin") {
          router.replace("/");
          return;
        }
        setCurrentUser(profile);
        const usersResponse = await apiFetch("/api/v1/admin/users");
        if (!usersResponse.ok) throw new Error("Foydalanuvchilarni yuklab bo‘lmadi");
        setUsers((await usersResponse.json()) as AuthUser[]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const csrf = readCsrfCookie();
    if (!csrf) return setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    const response = await apiFetch("/api/v1/admin/users", {
      method: "POST",
      headers: { "X-CSRF-Token": csrf },
      body: JSON.stringify(form),
    });
    const data = (await response.json().catch(() => ({}))) as AuthUser & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Foydalanuvchini yaratib bo‘lmadi");
    setUsers((current) => [data, ...current]);
    setForm({ full_name: "", email: "", password: "", role: "student" });
    setShowForm(false);
    setMessage("Foydalanuvchi muvaffaqiyatli yaratildi.");
  }

  async function toggleStatus(user: AuthUser) {
    setError("");
    setMessage("");
    const csrf = readCsrfCookie();
    if (!csrf) return setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    const response = await apiFetch(`/api/v1/admin/users/${user.id}/status`, {
      method: "PATCH",
      headers: { "X-CSRF-Token": csrf },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    const data = (await response.json().catch(() => ({}))) as AuthUser & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Hisob holatini o‘zgartirib bo‘lmadi");
    setUsers((current) => current.map((item) => item.id === data.id ? data : item));
    setMessage(data.is_active ? "Hisob faollashtirildi." : "Hisob bloklandi va sessiyalari bekor qilindi.");
  }

  if (loading) return <main className={styles.loading}>Foydalanuvchilar yuklanmoqda…</main>;

  return (
    <main className={styles.shell}>
      <header>
        <Link href="/admin" className={styles.back}><ArrowLeft /> Admin panel</Link>
        <Link href="/" className={styles.brand}><BookOpen weight="fill" />SiteLearning</Link>
      </header>
      <section className={styles.content}>
        <div className={styles.titleRow}>
          <div><p>BOSHQARUV</p><h1>Foydalanuvchilar</h1><span>Rollar va hisoblar faolligini boshqaring.</span></div>
          <button onClick={() => setShowForm((current) => !current)}><Plus weight="bold" /> Yangi foydalanuvchi</button>
        </div>

        {showForm && (
          <form className={styles.form} onSubmit={createUser}>
            <h2>Yangi hisob yaratish</h2>
            <label>To‘liq ism<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} minLength={2} maxLength={160} required /></label>
            <label>Elektron pochta<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
            <label>Vaqtinchalik parol<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={12} maxLength={128} required /><small>Kamida 12 belgi: katta-kichik harf, raqam va maxsus belgi.</small></label>
            <label>Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="student">Talaba</option><option value="teacher">O‘qituvchi</option>{currentUser?.role === "super_admin" && <option value="admin">Administrator</option>}</select></label>
            <div><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button type="submit"><UserPlus /> Hisob yaratish</button></div>
          </form>
        )}

        {error && <div className={styles.error} role="alert">{error}</div>}
        {message && <div className={styles.success}>{message}</div>}

        <section className={styles.tableCard}>
          <div className={styles.tableHead}><span>Foydalanuvchi</span><span>Rol</span><span>Holat</span><span>Amal</span></div>
          {users.map((user) => {
            const protectedUser = user.id === currentUser?.id || user.role === "super_admin" || (user.role === "admin" && currentUser?.role !== "super_admin");
            return (
              <article key={user.id}>
                <div className={styles.identity}><span><UserCircle weight="duotone" /></span><div><strong>{user.full_name}</strong><small>{user.email}</small></div></div>
                <div className={styles.role}><ShieldCheck />{roleNames[user.role]}</div>
                <div><b className={user.is_active ? styles.active : styles.inactive}>{user.is_active ? "Faol" : "Bloklangan"}</b></div>
                <div><button disabled={protectedUser} className={user.is_active ? styles.block : styles.activate} onClick={() => toggleStatus(user)}>{user.is_active ? <><UserMinus /> Bloklash</> : <><UserPlus /> Faollashtirish</>}</button></div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
