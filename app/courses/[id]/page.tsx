"use client";

import { ArrowLeft, BookOpen, Clock, FileText, GameController, Headphones, LinkSimple, LockKey, Video, YoutubeLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { API_ORIGIN, apiFetch, CourseDetail, Material } from "../../_lib/api";
import media from "./materials.module.css";
import styles from "./styles.module.css";

function resolvedUrl(url: string) { return url.startsWith("/") ? `${API_ORIGIN}${url}` : url; }

function MaterialView({ material }: { material: Material }) {
  const url = resolvedUrl(material.url);
  if (material.material_type === "youtube") return <div className={media.embed}><iframe src={url} title={material.title} sandbox="allow-scripts allow-same-origin allow-presentation" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>;
  if (material.material_type === "video") return <video className={media.player} controls preload="metadata" src={url}>Brauzeringiz videoni qo‘llamaydi.</video>;
  if (material.material_type === "audio") return <audio className={media.audio} controls preload="metadata" src={url}>Brauzeringiz audioni qo‘llamaydi.</audio>;
  const Icon = material.material_type === "document" ? FileText : material.material_type === "game" ? GameController : LinkSimple;
  return <a className={media.resource} href={url} target="_blank" rel="noopener noreferrer"><Icon weight="duotone" /><span><b>{material.title}</b><small>{material.material_type === "document" ? material.original_filename ?? "Hujjat" : material.material_type === "game" ? "Interaktiv o‘yinni ochish" : "Qo‘shimcha havolani ochish"}</small></span><LinkSimple /></a>;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/v1/courses/${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (response.status === 401) return setRequiresLogin(true);
        if (!response.ok) throw new Error("Kursni yuklab bo‘lmadi");
        setCourse((await response.json()) as CourseDetail);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"));
  }, [id]);

  if (requiresLogin) return <main className={styles.center}><LockKey weight="duotone" /><h1>Darslarni ko‘rish uchun tizimga kiring</h1><p>Kurs katalogi ochiq, dars mazmuni esa faqat autentifikatsiyadan keyin ko‘rsatiladi.</p><Link href="/login">Tizimga kirish</Link></main>;
  if (error) return <main className={styles.center}><h1>{error}</h1><Link href="/courses">Kurslarga qaytish</Link></main>;
  if (!course) return <main className={styles.center}>Kurs yuklanmoqda…</main>;

  return (
    <main className={styles.shell}>
      <header><Link href="/courses"><ArrowLeft /> Kurslar</Link><span><BookOpen weight="fill" /> ma&apos;rifat</span></header>
      <section className={styles.hero}><p>{course.category} • {course.level}</p><h1>{course.title}</h1><div>{course.summary}</div><span><Clock /> {course.duration_weeks} hafta · {course.lesson_count} dars</span></section>
      <section className={styles.lessons}><h2>Darslar dasturi</h2>{course.lessons.map((lesson) => <article className={media.lessonCard} key={lesson.id}><div className={media.lessonHeader}><span>{lesson.position}</span><div><h3>{lesson.title}</h3><p>{lesson.content_text ?? "Multimedia dars"}</p></div><small><Clock /> {lesson.duration_minutes} daqiqa</small></div>{lesson.materials.length > 0 && <section className={media.materialList}><h4>Dars materiallari</h4>{lesson.materials.map((material) => <div className={media.material} key={material.id}><div className={media.materialTitle}>{material.material_type === "youtube" ? <YoutubeLogo /> : material.material_type === "video" ? <Video /> : material.material_type === "audio" ? <Headphones /> : <FileText />}<b>{material.title}</b></div><MaterialView material={material} /></div>)}</section>}</article>)}</section>
    </main>
  );
}
