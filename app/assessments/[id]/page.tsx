"use client";

import { ArrowLeft, CheckCircle, Clock, Exam, LockKey, Trophy, XCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, AssessmentAttempt, AssessmentResult, readCsrfCookie, StudentAssessmentDetail } from "../../_lib/api";
import styles from "./styles.module.css";

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<StudentAssessmentDetail | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [now, setNow] = useState(0);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/me/assessments/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (response.status === 401) throw new Error("Testni ishlash uchun tizimga kiring");
        if (!response.ok) throw new Error("Test topilmadi yoki sizga biriktirilmagan");
        setAssessment((await response.json()) as StudentAssessmentDetail);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"));
  }, [id]);

  useEffect(() => {
    if (!attempt?.expires_at || result) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result]);

  const remaining = attempt?.expires_at ? new Date(attempt.expires_at).getTime() - now : null;
  const expired = remaining !== null && remaining <= 0;

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function start() {
    const token = csrf(); if (!token) return;
    setWorking(true); setError(""); setResult(null); setAnswers({});
    try {
      const response = await apiFetch(`/api/v1/me/assessments/${id}/start`, { method: "POST", headers: { "X-CSRF-Token": token } });
      const data = (await response.json().catch(() => ({}))) as AssessmentAttempt & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Urinishni boshlab bo‘lmadi");
      setAttempt(data); setNow(Date.now());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
    } finally {
      setWorking(false);
    }
  }

  async function submit() {
    if (!assessment || !attempt) return;
    if (Object.keys(answers).length !== assessment.questions.length) return setError("Barcha savollarga javob bering.");
    const token = csrf(); if (!token) return;
    setWorking(true); setError("");
    try {
      const response = await apiFetch(`/api/v1/me/assessments/${assessment.id}/attempts/${attempt.id}/submit`, { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ answers: assessment.questions.map((question) => ({ question_id: question.id, selected_option_id: answers[question.id] })) }) });
      const data = (await response.json().catch(() => ({}))) as AssessmentResult & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Javoblarni yuborib bo‘lmadi");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
    } finally {
      setWorking(false);
    }
  }

  if (error && !assessment) return <main className={styles.center}><LockKey weight="duotone" /><h1>{error}</h1><Link href="/assessments">Testlarga qaytish</Link></main>;
  if (!assessment) return <main className={styles.center}>Test yuklanmoqda…</main>;

  return (
    <main className={styles.shell}>
      <header><Link href="/assessments"><ArrowLeft /> Testlar</Link><span><Exam weight="fill" /> SiteLearning</span></header>
      <section className={styles.hero}><p>{assessment.course_title} · {assessment.assessment_type === "exam" ? "Imtihon" : "Test"}</p><h1>{assessment.title}</h1><div>{assessment.instructions ?? "Har bir savol uchun bitta javobni tanlang."}</div><section><span><Exam /> {assessment.question_count} savol</span><span><Trophy /> O‘tish bali {assessment.passing_score}%</span><span><Clock /> {assessment.time_limit_minutes ? `${assessment.time_limit_minutes} daqiqa` : "Vaqt cheklanmagan"}</span></section></section>
      {!attempt && !result && <section className={styles.startCard}><Exam weight="duotone" /><h2>Testni boshlashga tayyormisiz?</h2><p>Boshlaganingizdan keyin vaqt hisoblanadi. To‘g‘ri javoblar yuborilgunga qadar ko‘rsatilmaydi.</p><span>{assessment.attempts_used} / {assessment.max_attempts} urinish ishlatilgan</span>{error && <div className={styles.error}>{error}</div>}<button onClick={start} disabled={working}>{working ? "Boshlanmoqda…" : "Testni boshlash"}</button></section>}
      {attempt && !result && <section className={styles.test}><div className={styles.testBar}><span>Urinish #{attempt.attempt_number}</span>{remaining !== null && <b className={expired ? styles.timeExpired : ""}><Clock /> {formatTime(remaining)}</b>}</div>{error && <div className={styles.error}>{error}</div>}{expired ? <div className={styles.expired}><Clock weight="duotone" /><h2>Test vaqti tugadi</h2><p>Ruxsat etilgan urinishlar qolgan bo‘lsa, yangi urinish boshlashingiz mumkin.</p><button onClick={start} disabled={working}>Yangi urinish</button></div> : <><div className={styles.questions}>{assessment.questions.map((question) => <article key={question.id}><div><span>{question.position}</span><h2>{question.prompt}</h2><small>{question.points} ball</small></div><fieldset>{question.options.map((option) => <label className={answers[question.id] === option.id ? styles.chosen : ""} key={option.id}><input type="radio" name={question.id} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} /><span>{String.fromCharCode(64 + option.position)}</span><b>{option.text}</b></label>)}</fieldset></article>)}</div><button className={styles.submit} onClick={submit} disabled={working}>{working ? "Tekshirilmoqda…" : "Javoblarni yuborish"}</button></>}</section>}
      {result && <section className={`${styles.result} ${result.passed ? styles.resultPassed : styles.resultFailed}`}>{result.passed ? <CheckCircle weight="duotone" /> : <XCircle weight="duotone" />}<p>{result.passed ? "TABRIKLAYMIZ" : "NATIJA"}</p><h2>{result.score_percent}%</h2><strong>{result.points_earned} / {result.total_points} ball</strong><span>{result.passed ? "Test muvaffaqiyatli topshirildi." : `O‘tish uchun kamida ${assessment.passing_score}% kerak.`}</span><div><Link href="/assessments">Testlar ro‘yxati</Link>{!result.passed && result.attempt_number < assessment.max_attempts && <button onClick={() => { setAttempt(null); setResult(null); setAnswers({}); }}>Qayta urinish</button>}</div></section>}
    </main>
  );
}
