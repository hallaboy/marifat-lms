"use client";

import { ArrowLeft, ArrowSquareOut, BookOpen, CheckCircle, Clock, FileText, GameController, Headphones, LinkSimple, LockKey, Video, YoutubeLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { API_ORIGIN, apiFetch, AuthUser, CourseDetail, CourseProgress, LessonCompletion, Material, readCsrfCookie } from "../../_lib/api";
import media from "./materials.module.css";
import styles from "./styles.module.css";

function resolvedUrl(url: string) { return url.startsWith("/") ? `${API_ORIGIN}${url}` : url; }

function MaterialView({ material }: { material: Material }) {
  const url = resolvedUrl(material.url);
  if (material.material_type === "youtube") {
    const videoId = material.url.match(/\/embed\/([A-Za-z0-9_-]{11})/)?.[1];
    const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : material.url;
    return <div className={media.youtubeBlock}><div className={media.embed}><iframe src={url} title={material.title} sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div><div className={media.youtubeFallback}><span>Agar video ichki oynada ochilmasa, YouTube’da bevosita ko‘ring.</span><a href={watchUrl} target="_blank" rel="noopener noreferrer"><YoutubeLogo weight="fill" /> YouTube’da ochish <ArrowSquareOut /></a></div></div>;
  }
  if (material.material_type === "video") return <video className={media.player} controls preload="metadata" src={url}>Brauzeringiz videoni qo‘llamaydi.</video>;
  if (material.material_type === "audio") return <audio className={media.audio} controls preload="metadata" src={url}>Brauzeringiz audioni qo‘llamaydi.</audio>;
  const Icon = material.material_type === "document" ? FileText : material.material_type === "game" ? GameController : LinkSimple;
  return <a className={media.resource} href={url} target="_blank" rel="noopener noreferrer"><Icon weight="duotone" /><span><b>{material.title}</b><small>{material.material_type === "document" ? material.original_filename ?? "Hujjat" : material.material_type === "game" ? "Interaktiv o‘yinni ochish" : "Qo‘shimcha havolani ochish"}</small></span><LinkSimple /></a>;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return setRequiresLogin(true);
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        const profile = (await profileResponse.json()) as AuthUser;
        setUser(profile);
        const response = await apiFetch(`/api/v1/courses/${encodeURIComponent(id)}`);
        if (response.status === 403) return setAccessDenied(true);
        if (!response.ok) throw new Error("Kursni yuklab bo‘lmadi");
        setCourse((await response.json()) as CourseDetail);
        if (profile.role === "student") {
          const progressResponse = await apiFetch(`/api/v1/me/courses/${encodeURIComponent(id)}/progress`);
          if (progressResponse.ok) setProgress((await progressResponse.json()) as CourseProgress);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      }
    }
    void load();
  }, [id]);

  async function completeLesson(lessonId: string) {
    const token = readCsrfCookie();
    if (!token) return setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    setCompleting(lessonId); setError("");
    try {
      const response = await apiFetch(`/api/v1/me/lessons/${lessonId}/complete`, { method: "POST", headers: { "X-CSRF-Token": token } });
      const data = (await response.json().catch(() => ({}))) as LessonCompletion & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Dars holatini saqlab bo‘lmadi");
      setProgress((current) => ({
        course_id: id,
        status: data.course_completed ? "completed" : current?.status ?? "active",
        progress_percent: data.progress_percent,
        completed_lesson_ids: current?.completed_lesson_ids.includes(lessonId) ? current.completed_lesson_ids : [...(current?.completed_lesson_ids ?? []), lessonId],
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
    } finally {
      setCompleting(null);
    }
  }

  if (requiresLogin) return <main className={styles.center}><LockKey weight="duotone" /><h1>Darslarni ko‘rish uchun tizimga kiring</h1><p>Kurs katalogi ochiq, dars mazmuni esa faqat autentifikatsiyadan keyin ko‘rsatiladi.</p><Link href="/login">Tizimga kirish</Link></main>;
  if (accessDenied) return <main className={styles.center}><LockKey weight="duotone" /><h1>Bu kurs sizga biriktirilmagan</h1><p>Kursga kirish uchun administrator sizni kursga biriktirishi kerak.</p><Link href="/my-courses">Mening kurslarim</Link></main>;
  if (error) return <main className={styles.center}><h1>{error}</h1><Link href="/courses">Kurslarga qaytish</Link></main>;
  if (!course) return <main className={styles.center}>Kurs yuklanmoqda…</main>;

  return (
    <main className={styles.shell}>
      <header><Link href={user?.role === "student" ? "/my-courses" : "/courses"}><ArrowLeft /> {user?.role === "student" ? "Mening kurslarim" : "Kurslar"}</Link><span><BookOpen weight="fill" /> SiteLearning</span></header>
      <section className={styles.hero}><p>{course.category} • {course.level}</p><h1>{course.title}</h1><div>{course.summary}</div><span><Clock /> {course.duration_weeks} hafta · {course.lesson_count} dars</span>{progress && <div className={styles.heroProgress}><span><i style={{ width: `${progress.progress_percent}%` }} /></span><b>{progress.progress_percent}% o‘zlashtirildi</b></div>}</section>
      <section className={styles.lessons}><h2>Darslar dasturi</h2>{course.lessons.map((lesson) => { const completed = progress?.completed_lesson_ids.includes(lesson.id) ?? false; return <article className={media.lessonCard} key={lesson.id}><div className={media.lessonHeader}><span>{lesson.position}</span><div><h3>{lesson.title}</h3><p>{lesson.content_text ?? "Multimedia dars"}</p></div><small><Clock /> {lesson.duration_minutes} daqiqa</small></div>{lesson.materials.length > 0 && <section className={media.materialList}><h4>Dars materiallari</h4>{lesson.materials.map((material) => <div className={media.material} key={material.id}><div className={media.materialTitle}>{material.material_type === "youtube" ? <YoutubeLogo /> : material.material_type === "video" ? <Video /> : material.material_type === "audio" ? <Headphones /> : <FileText />}<b>{material.title}</b></div><MaterialView material={material} /></div>)}</section>}{user?.role === "student" && <div className={media.lessonActions}><button className={completed ? media.done : ""} disabled={completed || completing === lesson.id} onClick={() => completeLesson(lesson.id)}>{completed ? <><CheckCircle weight="fill" /> Dars yakunlangan</> : completing === lesson.id ? "Saqlanmoqda…" : <><CheckCircle /> Darsni yakunlash</>}</button></div>}</article>; })}</section>
    </main>
  );
}
