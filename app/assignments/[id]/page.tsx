"use client";

import { API_ORIGIN, apiFetch, AssignmentSubmission, readCsrfCookie, StudentAssignment } from "../../_lib/api";
import { ArrowLeft, CheckCircle, ClipboardText, Clock, FileArrowDown, FilePdf, PaperPlaneTilt } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import styles from "./styles.module.css";

function fileUrl(path: string) { return path.startsWith("/") ? `${API_ORIGIN}${path}` : path; }

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/me/assignments/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Uy vazifasi topilmadi yoki sizga biriktirilmagan");
        const data = (await response.json()) as StudentAssignment;
        setAssignment(data); setText(data.submission?.submission_text ?? "");
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"));
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() && !file) return setError("Matn yozing yoki hujjat tanlang.");
    const token = readCsrfCookie();
    if (!token) return setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    setWorking(true); setError(""); setMessage("");
    try {
      const body = new FormData();
      if (text.trim()) body.append("submission_text", text.trim());
      if (file) body.append("file", file);
      const response = await apiFetch(`/api/v1/me/assignments/${id}/submit`, { method: "POST", headers: { "X-CSRF-Token": token }, body });
      const data = (await response.json().catch(() => ({}))) as AssignmentSubmission & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Uy vazifasini yuborib bo‘lmadi");
      setAssignment((current) => current ? { ...current, submission: data } : current); setFile(null);
      setMessage("Uy vazifasi muvaffaqiyatli yuborildi.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
    } finally {
      setWorking(false);
    }
  }

  if (!assignment) return <main className={styles.center}>{error || "Uy vazifasi yuklanmoqda…"}{error && <Link href="/assignments">Vazifalarga qaytish</Link>}</main>;
  const locked = assignment.submission?.status === "graded" || (assignment.is_overdue && !assignment.allow_late);

  return (
    <main className={styles.shell}>
      <header><Link href="/assignments"><ArrowLeft /> Uy vazifalari</Link><span><ClipboardText weight="fill" /> SiteLearning</span></header>
      <section className={styles.hero}><p>{assignment.course_title}</p><h1>{assignment.title}</h1><div>{assignment.description}</div><section><span><Clock /> {assignment.due_at ? new Date(assignment.due_at).toLocaleString("uz-UZ") : "Muddat belgilanmagan"}</span><span>{assignment.max_score} ball</span></section></section>
      <section className={styles.workspace}>
        {assignment.submission && <aside className={`${styles.submissionState} ${assignment.submission.status === "graded" ? styles.graded : ""}`}>{assignment.submission.status === "graded" ? <CheckCircle weight="duotone" /> : <PaperPlaneTilt weight="duotone" />}<div><small>{assignment.submission.status === "graded" ? "BAHOLANGAN" : "YUBORILGAN"}</small><h2>{assignment.submission.status === "graded" ? `${assignment.submission.score} / ${assignment.max_score} ball` : "O‘qituvchi tekshirishi kutilmoqda"}</h2>{assignment.submission.feedback && <p>{assignment.submission.feedback}</p>}{assignment.submission.file_url && <a href={fileUrl(assignment.submission.file_url)} target="_blank" rel="noopener noreferrer"><FileArrowDown /> {assignment.submission.original_filename}</a>}</div></aside>}
        {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}
        {locked ? <div className={styles.locked}><ClipboardText weight="duotone" /><h2>{assignment.submission?.status === "graded" ? "Uy vazifasi baholangan" : "Yuborish muddati tugagan"}</h2><p>{assignment.submission?.status === "graded" ? "Baholangan javobni o‘zgartirib bo‘lmaydi." : "Ushbu vazifa kech yuborishga ruxsat bermaydi."}</p></div> : <form className={styles.form} onSubmit={submit}><div><h2>{assignment.submission ? "Javobni yangilash" : "Javob yuborish"}</h2><p>Matn yozing va kerak bo‘lsa PDF yoki Office hujjatini ilova qiling.</p></div><label>Javob matni<textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={20000} placeholder="Bajarilgan ish haqida yozing…" /></label><label className={styles.file}><FilePdf weight="duotone" /><span><b>{file?.name ?? "Hujjatni tanlang"}</b><small>PDF, DOCX, PPTX yoki XLSX · 50 MB gacha</small></span><input type="file" accept=".pdf,.docx,.pptx,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><button type="submit" disabled={working}><PaperPlaneTilt /> {working ? "Yuborilmoqda…" : assignment.submission ? "Javobni yangilash" : "Javobni yuborish"}</button></form>}
      </section>
    </main>
  );
}
