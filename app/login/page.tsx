"use client";

import { BookOpen, Eye, EyeSlash, LockKey, SignIn } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { apiFetch, AuthUser } from "../_lib/api";
import styles from "./styles.module.css";

function homeFor(user: AuthUser) {
  if (user.role === "super_admin" || user.role === "admin") return "/admin";
  if (user.role === "student") return "/my-courses";
  return "/teacher";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/api/v1/auth/me")
      .then(async (response) => {
        if (!response.ok) return;
        const user = (await response.json()) as AuthUser;
        router.replace(homeFor(user));
      })
      .catch(() => undefined);
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { detail?: string };
        setError(data.detail ?? "Kirish amalga oshmadi");
        return;
      }
      const data = (await response.json()) as { user: AuthUser };
      router.replace(homeFor(data.user));
    } catch {
      setError("Server bilan bog‘lanib bo‘lmadi. Lokal LMS serverini tekshiring.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.brandPanel}>
        <Link href="/" className={styles.brand}><span><BookOpen weight="fill" /></span>ma&apos;rifat</Link>
        <div>
          <p className={styles.eyebrow}>XAVFSIZ BOSHQARUV</p>
          <h1>Ta&apos;lim jarayonini bir joydan boshqaring.</h1>
          <p>Kurslar, o‘qituvchilar, talabalar va natijalar uchun yagona LMS muhiti.</p>
        </div>
        <small>Ma&apos;rifat LMS • Himoyalangan sessiya</small>
      </section>

      <section className={styles.formPanel}>
        <form className={styles.card} onSubmit={submit}>
          <span className={styles.icon}><LockKey weight="duotone" /></span>
          <h2>Tizimga kirish</h2>
          <p>Administrator yoki foydalanuvchi hisobingizni kiriting.</p>

          <label>
            Elektron pochta
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@marifat.uz"
              required
            />
          </label>
          <label>
            Parol
            <span className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}>
                {showPassword ? <EyeSlash /> : <Eye />}
              </button>
            </span>
          </label>

          {error && <div className={styles.error} role="alert">{error}</div>}
          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? "Tekshirilmoqda…" : <>Kirish <SignIn weight="bold" /></>}
          </button>
          <Link href="/" className={styles.back}>← Bosh sahifaga qaytish</Link>
        </form>
      </section>
    </main>
  );
}
