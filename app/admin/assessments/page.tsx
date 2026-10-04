"use client";

import { ArrowLeft, BookOpen, CheckCircle, Exam, Plus, RocketLaunch } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AdminAssessmentDetail, AdminAssessmentQuestion, apiFetch, Assessment, AuthUser, Course, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const typeName = { quiz: "Test", exam: "Imtihon" };

export default function AdminAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<AdminAssessmentDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ course_id: "", title: "", instructions: "", assessment_type: "quiz", passing_score: 70, max_attempts: 2, time_limit_minutes: 20 });
  const [question, setQuestion] = useState({ prompt: "", points: 1, correct: 0, options: ["", "", "", ""] });

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/");
        const [assessmentResponse, courseResponse] = await Promise.all([
          apiFetch("/api/v1/admin/assessments"), apiFetch("/api/v1/admin/courses"),
        ]);
        if (!assessmentResponse.ok || !courseResponse.ok) throw new Error("Test ma’lumotlarini yuklab bo‘lmadi");
        const assessmentList = (await assessmentResponse.json()) as Assessment[];
        setAssessments(assessmentList);
        setCourses((await courseResponse.json()) as Course[]);
        const requestedAssessmentId = new URLSearchParams(window.location.search).get("assessment");
        if (requestedAssessmentId && assessmentList.some((item) => item.id === requestedAssessmentId)) {
          const detailResponse = await apiFetch(`/api/v1/admin/assessments/${requestedAssessmentId}`);
          if (detailResponse.ok) setSelected((await detailResponse.json()) as AdminAssessmentDetail);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      }
    }
    void load();
  }, [router]);

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function chooseAssessment(assessment: Assessment) {
    setError(""); setMessage("");
    const response = await apiFetch(`/api/v1/admin/assessments/${assessment.id}`);
    if (!response.ok) return setError("Test tafsilotlarini yuklab bo‘lmadi");
    setSelected((await response.json()) as AdminAssessmentDetail);
  }

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/assessments", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(form) });
    const data = (await response.json().catch(() => ({}))) as Assessment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Testni yaratib bo‘lmadi");
    setAssessments((current) => [data, ...current]);
    setSelected({ ...data, questions: [] }); setShowForm(false);
    setForm({ course_id: "", title: "", instructions: "", assessment_type: "quiz", passing_score: 70, max_attempts: 2, time_limit_minutes: 20 });
    setMessage("Test qoralama sifatida yaratildi. Endi savollarni kiriting.");
  }

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!selected) return;
    const token = csrf(); if (!token) return;
    const payload = {
      prompt: question.prompt,
      position: selected.question_count + 1,
      points: question.points,
      options: question.options.map((text, index) => ({ text, is_correct: index === question.correct })),
    };
    const response = await apiFetch(`/api/v1/admin/assessments/${selected.id}/questions`, { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(payload) });
    const data = (await response.json().catch(() => ({}))) as AdminAssessmentQuestion & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Savolni qo‘shib bo‘lmadi");
    const updated = { ...selected, question_count: selected.question_count + 1, questions: [...selected.questions, data] };
    setSelected(updated); setAssessments((current) => current.map((item) => item.id === updated.id ? { ...item, question_count: updated.question_count } : item));
    setQuestion({ prompt: "", points: 1, correct: 0, options: ["", "", "", ""] });
    setMessage("Savol testga qo‘shildi.");
  }

  async function changePublish(isPublished: boolean) {
    if (!selected) return;
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/assessments/${selected.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: isPublished }) });
    const data = (await response.json().catch(() => ({}))) as Assessment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Test holatini o‘zgartirib bo‘lmadi");
    const updated = { ...selected, ...data };
    setSelected(updated); setAssessments((current) => current.map((item) => item.id === data.id ? data : item));
    setMessage(isPublished ? "Test talabalar uchun nashr qilindi." : "Test qoralama holatiga qaytarildi.");
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />ma&apos;rifat</span></header>
      <section className={styles.content}>
        <div className={styles.titleRow}><div><p>BAHOLASH MODULI</p><h1>Test va imtihonlar</h1><span>Savollar yarating, to‘g‘ri javobni belgilang va natijani avtomatik hisoblang.</span></div><button onClick={() => setShowForm((current) => !current)}><Plus /> Yangi test</button></div>
        {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}
        {showForm && <form className={styles.createForm} onSubmit={createAssessment}><h2>Yangi test</h2><label>Kurs<select value={form.course_id} onChange={(event) => setForm({ ...form, course_id: event.target.value })} required><option value="">Kursni tanlang</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label>Test nomi<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} required /></label><label>Turi<select value={form.assessment_type} onChange={(event) => setForm({ ...form, assessment_type: event.target.value })}><option value="quiz">Test</option><option value="exam">Imtihon</option></select></label><label>O‘tish bali (%)<input type="number" min="1" max="100" value={form.passing_score} onChange={(event) => setForm({ ...form, passing_score: Number(event.target.value) })} /></label><label>Urinishlar<input type="number" min="1" max="10" value={form.max_attempts} onChange={(event) => setForm({ ...form, max_attempts: Number(event.target.value) })} /></label><label>Vaqt (daqiqa)<input type="number" min="1" max="600" value={form.time_limit_minutes} onChange={(event) => setForm({ ...form, time_limit_minutes: Number(event.target.value) })} /></label><label className={styles.wide}>Ko‘rsatma<textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></label><div className={styles.formActions}><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button type="submit"><Plus /> Yaratish</button></div></form>}
        <div className={styles.layout}><section className={styles.list}><h2>Testlar <small>{assessments.length}</small></h2>{assessments.map((assessment) => <button key={assessment.id} className={selected?.id === assessment.id ? styles.selected : ""} onClick={() => chooseAssessment(assessment)}><span><Exam weight="duotone" /></span><div><strong>{assessment.title}</strong><small>{assessment.course_title} · {assessment.question_count} savol</small></div><b className={assessment.is_published ? styles.published : styles.draft}>{assessment.is_published ? "Nashrda" : "Qoralama"}</b></button>)}{assessments.length === 0 && <div className={styles.emptyList}>Hali test yaratilmagan.</div>}</section>
          <aside className={styles.editor}>{selected ? <><div className={styles.assessmentHead}><div><p>{typeName[selected.assessment_type].toUpperCase()}</p><h2>{selected.title}</h2><span>{selected.course_title} · O‘tish bali {selected.passing_score}% · {selected.max_attempts} urinish</span></div><button onClick={() => changePublish(!selected.is_published)}>{selected.is_published ? "Nashrdan olish" : <><RocketLaunch /> Nashr qilish</>}</button></div><section className={styles.questions}><h3>Kiritilgan savollar</h3>{selected.questions.map((item) => <article key={item.id}><b>{item.position}</b><div><strong>{item.prompt}</strong>{item.options.map((option) => <small className={option.is_correct ? styles.correct : ""} key={option.id}>{option.is_correct ? "✓ " : ""}{option.text}</small>)}</div><span>{item.points} ball</span></article>)}{selected.questions.length === 0 && <p>Hozircha savol yo‘q.</p>}</section>{!selected.is_published && <form className={styles.questionForm} onSubmit={addQuestion}><h3>Yangi savol</h3><label>Savol matni<textarea value={question.prompt} onChange={(event) => setQuestion({ ...question, prompt: event.target.value })} minLength={3} required /></label><label>Ball<input type="number" min="1" max="100" value={question.points} onChange={(event) => setQuestion({ ...question, points: Number(event.target.value) })} /></label><fieldset><legend>Javob variantlari — to‘g‘ri javobni belgilang</legend>{question.options.map((option, index) => <label key={index}><input type="radio" name="correct" checked={question.correct === index} onChange={() => setQuestion({ ...question, correct: index })} /><input value={option} onChange={(event) => { const options = [...question.options]; options[index] = event.target.value; setQuestion({ ...question, options }); }} placeholder={`${index + 1}-variant`} required /></label>)}</fieldset><button type="submit"><Plus /> Savol qo‘shish</button></form>}</> : <div className={styles.empty}><Exam weight="duotone" /><h2>Testni tanlang</h2><p>Savollarni boshqarish uchun chap ro‘yxatdan testni tanlang.</p></div>}</aside></div>
      </section>
    </main>
  );
}
