"use client";

import { ArrowLeft, BookOpen, FileArrowUp, FileText, GameController, Headphones, LinkSimple, Trash, Video, YoutubeLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiFetch, CourseDetail, Material, readCsrfCookie } from "../../../_lib/api";
import styles from "./styles.module.css";

const typeNames: Record<Material["material_type"], string> = { youtube: "YouTube", video: "Video", audio: "Audio", document: "Hujjat", game: "O‘yin", link: "Havola" };

export default function CourseMaterialsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [linkForm, setLinkForm] = useState({ title: "", material_type: "youtube", external_url: "", display_order: 1 });
  const [uploadForm, setUploadForm] = useState({ title: "", material_type: "document", display_order: 1, is_downloadable: true });

  useEffect(() => {
    async function load() {
      const profile = await apiFetch("/api/v1/auth/me");
      if (!profile.ok) return router.replace("/login");
      const response = await apiFetch(`/api/v1/courses/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("Kurs darslarini yuklab bo‘lmadi");
      const data = (await response.json()) as CourseDetail;
      setCourse(data); setLessonId(data.lessons[0]?.id ?? "");
    }
    void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"));
  }, [id, router]);

  const selectedLesson = useMemo(() => course?.lessons.find((lesson) => lesson.id === lessonId), [course, lessonId]);

  async function refresh() {
    const response = await apiFetch(`/api/v1/courses/${encodeURIComponent(id)}`);
    if (response.ok) setCourse((await response.json()) as CourseDetail);
  }

  function token() {
    const value = readCsrfCookie(); if (!value) setError("Sessiya tugagan. Qayta kiring."); return value;
  }

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); const csrf = token(); if (!csrf || !lessonId) return;
    const response = await apiFetch(`/api/v1/admin/lessons/${lessonId}/materials/link`, { method: "POST", headers: { "X-CSRF-Token": csrf }, body: JSON.stringify(linkForm) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Havolani qo‘shib bo‘lmadi");
    await refresh(); setLinkForm({ title: "", material_type: "youtube", external_url: "", display_order: linkForm.display_order + 1 }); setMessage("Tashqi material qo‘shildi.");
  }

  async function addUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); const csrf = token(); if (!csrf || !lessonId || !uploadFile) return setError("Faylni tanlang.");
    const body = new FormData(); body.set("title", uploadForm.title); body.set("material_type", uploadForm.material_type); body.set("display_order", String(uploadForm.display_order)); body.set("is_downloadable", String(uploadForm.is_downloadable)); body.set("file", uploadFile);
    const response = await apiFetch(`/api/v1/admin/lessons/${lessonId}/materials/upload`, { method: "POST", headers: { "X-CSRF-Token": csrf }, body });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Faylni yuklab bo‘lmadi");
    await refresh(); setUploadFile(null); setUploadForm({ ...uploadForm, title: "", display_order: uploadForm.display_order + 1 }); setMessage("Fayl xavfsiz saqlandi.");
  }

  async function remove(material: Material) {
    const csrf = token(); if (!csrf || !window.confirm(`“${material.title}” materialini o‘chirasizmi?`)) return;
    const response = await apiFetch(`/api/v1/admin/materials/${material.id}`, { method: "DELETE", headers: { "X-CSRF-Token": csrf } });
    if (!response.ok) return setError("Materialni o‘chirib bo‘lmadi");
    await refresh(); setMessage("Material o‘chirildi.");
  }

  return <main className={styles.shell}><header><Link href="/admin/materials"><ArrowLeft /> Kurslar</Link><span><BookOpen weight="fill" />SiteLearning</span></header><section className={styles.content}><p>MULTIMEDIA MUHARRIRI</p><h1>{course?.title ?? "Yuklanmoqda…"}</h1><div className={styles.lead}>Har bir darsga bir nechta video, audio, hujjat yoki interaktiv resurs biriktiring.</div>{error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}>{message}</div>}{course && course.lessons.length === 0 && <div className={styles.empty}>Avval kurs boshqaruvida kamida bitta dars yarating.</div>}{course && course.lessons.length > 0 && <><nav className={styles.lessons}>{course.lessons.map((lesson) => <button key={lesson.id} className={lesson.id === lessonId ? styles.active : ""} onClick={() => setLessonId(lesson.id)}><span>{lesson.position}</span><div><b>{lesson.title}</b><small>{lesson.materials.length} material</small></div></button>)}</nav><div className={styles.columns}><section><h2><LinkSimple /> Tashqi resurs</h2><form onSubmit={addLink}><label>Nomi<input value={linkForm.title} onChange={(event) => setLinkForm({ ...linkForm, title: event.target.value })} minLength={2} required /></label><label>Turi<select value={linkForm.material_type} onChange={(event) => setLinkForm({ ...linkForm, material_type: event.target.value })}><option value="youtube">YouTube</option><option value="video">Video havolasi</option><option value="audio">Audio havolasi</option><option value="game">Gamifikatsiya/o‘yin</option><option value="link">Qo‘shimcha havola</option></select></label><label>HTTPS havola<input type="url" value={linkForm.external_url} onChange={(event) => setLinkForm({ ...linkForm, external_url: event.target.value })} placeholder="https://..." required /></label><label>Tartib<input type="number" min="1" value={linkForm.display_order} onChange={(event) => setLinkForm({ ...linkForm, display_order: Number(event.target.value) })} /></label><button type="submit"><LinkSimple /> Havolani qo‘shish</button></form></section><section><h2><FileArrowUp /> Fayl yuklash</h2><form onSubmit={addUpload}><label>Nomi<input value={uploadForm.title} onChange={(event) => setUploadForm({ ...uploadForm, title: event.target.value })} minLength={2} required /></label><label>Turi<select value={uploadForm.material_type} onChange={(event) => setUploadForm({ ...uploadForm, material_type: event.target.value })}><option value="document">PDF / Word / PowerPoint / Excel</option><option value="video">MP4 / WebM video</option><option value="audio">MP3 / M4A / WAV audio</option></select></label><label>Fayl<input type="file" accept=".pdf,.docx,.pptx,.xlsx,.mp4,.webm,.mp3,.m4a,.wav" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} required /></label><label>Tartib<input type="number" min="1" value={uploadForm.display_order} onChange={(event) => setUploadForm({ ...uploadForm, display_order: Number(event.target.value) })} /></label><button type="submit"><FileArrowUp /> Xavfsiz yuklash</button></form><small className={styles.limits}>Hujjat 50 MB, audio 100 MB, video 512 MB gacha. Fayl imzosi serverda tekshiriladi.</small></section></div><section className={styles.materials}><h2>{selectedLesson?.title} materiallari</h2>{selectedLesson?.materials.length === 0 && <p>Hozircha material yo‘q.</p>}{selectedLesson?.materials.map((material) => { const Icon = material.material_type === "youtube" ? YoutubeLogo : material.material_type === "video" ? Video : material.material_type === "audio" ? Headphones : material.material_type === "document" ? FileText : material.material_type === "game" ? GameController : LinkSimple; return <article key={material.id}><span><Icon weight="duotone" /></span><div><b>{material.title}</b><small>{typeNames[material.material_type]}{material.original_filename ? ` · ${material.original_filename}` : ""}</small></div><em>#{material.display_order}</em><button onClick={() => remove(material)} aria-label="Materialni o‘chirish"><Trash /></button></article>; })}</section></>}</section></main>;
}
