"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Exam,
  FilePlus,
  Plus,
  RocketLaunch,
  Stack,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { apiFetch, Assessment, AuthUser, Course, readCsrfCookie } from "../../_lib/api";
import styles from "./styles.module.css";

const statusNames = { draft: "Qoralama", published: "Nashr qilingan", archived: "Arxiv" };
const emptyCourseForm = { title: "", slug: "", summary: "", category: "", level: "beginner", duration_weeks: 6, teacher_id: "" };
const emptyQuizForm = { title: "", instructions: "", passing_score: 70, max_attempts: 2, time_limit_minutes: 20 };

function slugify(value: string) {
  return value.toLocaleLowerCase("uz").normalize("NFKD").replace(/[ʻ’‘']/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 220);
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [teachers, setTeachers] = useState<AuthUser[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [addQuizAfterCourse, setAddQuizAfterCourse] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [quizForm, setQuizForm] = useState(emptyQuizForm);
  const [lessonForm, setLessonForm] = useState({ title: "", position: 1, content_type: "text", content_text: "", duration_minutes: 20, is_preview: false, is_published: true });

  useEffect(() => {
    async function load() {
      try {
        const profile = await apiFetch("/api/v1/auth/me");
        if (!profile.ok) return router.replace("/login");
        const [courseResponse, userResponse, assessmentResponse] = await Promise.all([
          apiFetch("/api/v1/admin/courses"),
          apiFetch("/api/v1/admin/users"),
          apiFetch("/api/v1/admin/assessments"),
        ]);
        if (!courseResponse.ok || !userResponse.ok || !assessmentResponse.ok) {
          throw new Error("Boshqaruv ma’lumotlarini yuklab bo‘lmadi");
        }
        setCourses((await courseResponse.json()) as Course[]);
        setAssessments((await assessmentResponse.json()) as Assessment[]);
        const users = (await userResponse.json()) as AuthUser[];
        setTeachers(users.filter((user) => user.role === "teacher" && user.is_active));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      }
    }
    void load();
  }, [router]);

  const selectedQuizzes = useMemo(
    () => assessments.filter((assessment) => assessment.course_id === selected?.id),
    [assessments, selected],
  );

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const token = csrf();
    if (!token) return;
    const response = await apiFetch("/api/v1/admin/courses", {
      method: "POST",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({ ...courseForm, teacher_id: courseForm.teacher_id || null }),
    });
    const data = (await response.json().catch(() => ({}))) as Course & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Kursni yaratib bo‘lmadi");
    setCourses((current) => [data, ...current]);
    setSelected(data);
    setShowCourseForm(false);
    setShowQuizForm(addQuizAfterCourse);
    setCourseForm(emptyCourseForm);
    setQuizForm({ ...emptyQuizForm, title: `${data.title} — yakuniy quiz` });
    setMessage(addQuizAfterCourse ? "Kurs yaratildi. Endi quiz sozlamalarini kiriting." : "Kurs qoralama sifatida yaratildi. Endi dars qo‘shing.");
  }

  async function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!selected) return;
    const token = csrf();
    if (!token) return;
    const response = await apiFetch(`/api/v1/admin/courses/${selected.id}/lessons`, {
      method: "POST",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify(lessonForm),
    });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Darsni yaratib bo‘lmadi");
    const updated = { ...selected, lesson_count: selected.lesson_count + 1 };
    setSelected(updated);
    setCourses((current) => current.map((course) => course.id === updated.id ? updated : course));
    setLessonForm({ title: "", position: updated.lesson_count + 1, content_type: "text", content_text: "", duration_minutes: 20, is_preview: false, is_published: true });
    setMessage("Dars kursga qo‘shildi.");
  }

  async function createQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!selected) return;
    const token = csrf();
    if (!token) return;
    const response = await apiFetch("/api/v1/admin/assessments", {
      method: "POST",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({
        course_id: selected.id,
        lesson_id: null,
        assessment_type: "quiz",
        ...quizForm,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as Assessment & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Quizni yaratib bo‘lmadi");
    setAssessments((current) => [data, ...current]);
    setShowQuizForm(false);
    setQuizForm(emptyQuizForm);
    setMessage("Quiz qoralama sifatida yaratildi. Endi savollarni kiriting.");
  }

  async function changeStatus(course: Course, status: Course["status"]) {
    setError(""); setMessage("");
    const token = csrf();
    if (!token) return;
    const response = await apiFetch(`/api/v1/admin/courses/${course.id}/status`, {
      method: "PATCH",
      headers: { "X-CSRF-Token": token },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json().catch(() => ({}))) as Course & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Kurs holatini o‘zgartirib bo‘lmadi");
    setCourses((current) => current.map((item) => item.id === data.id ? data : item));
    if (selected?.id === data.id) setSelected(data);
    setMessage(status === "published" ? "Kurs katalogda nashr qilindi." : "Kurs holati yangilandi.");
  }

  return (
    <main className={styles.shell}>
      <header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />ma&apos;rifat</span></header>
      <section className={styles.content}>
        <div className={styles.titleRow}>
          <div><p>TA’LIM KONTENTI</p><h1>Kurslar boshqaruvi</h1><span>Kurs yarating, dars va quiz qo‘shing, so‘ng katalogga nashr qiling.</span></div>
          <button onClick={() => setShowCourseForm((current) => !current)}><Plus /> Yangi kurs</button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}><CheckCircle />{message}</div>}

        {showCourseForm && (
          <form className={styles.form} onSubmit={createCourse}>
            <h2>Yangi kurs</h2>
            <label>Kurs nomi<input value={courseForm.title} onChange={(event) => { const title = event.target.value; setCourseForm({ ...courseForm, title, slug: slugify(title) }); }} minLength={3} required /></label>
            <label>Slug<input value={courseForm.slug} onChange={(event) => setCourseForm({ ...courseForm, slug: slugify(event.target.value) })} minLength={3} required /></label>
            <label className={styles.wide}>Qisqa tavsif<textarea value={courseForm.summary} onChange={(event) => setCourseForm({ ...courseForm, summary: event.target.value })} minLength={10} required /></label>
            <label>Yo‘nalish<input value={courseForm.category} onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })} required /></label>
            <label>Daraja<select value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}><option value="beginner">Boshlang‘ich</option><option value="intermediate">O‘rta</option><option value="advanced">Yuqori</option></select></label>
            <label>Davomiyligi (hafta)<input type="number" min="1" max="104" value={courseForm.duration_weeks} onChange={(event) => setCourseForm({ ...courseForm, duration_weeks: Number(event.target.value) })} /></label>
            <label>O‘qituvchi<select value={courseForm.teacher_id} onChange={(event) => setCourseForm({ ...courseForm, teacher_id: event.target.value })}><option value="">Keyin biriktirish</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select></label>
            <label className={`${styles.wide} ${styles.courseOption}`}><input type="checkbox" checked={addQuizAfterCourse} onChange={(event) => setAddQuizAfterCourse(event.target.checked)} /><span><b>Kurs bilan birga quiz yaratish</b><small>Kurs saqlangach, quiz sozlamalari avtomatik ochiladi.</small></span></label>
            <div className={styles.actions}><button type="button" onClick={() => setShowCourseForm(false)}>Bekor qilish</button><button type="submit"><FilePlus /> Kurs yaratish</button></div>
          </form>
        )}

        <div className={styles.layout}>
          <section className={styles.list}>
            <h2>Kurslar <small>{courses.length}</small></h2>
            {courses.map((course) => (
              <article key={course.id} className={selected?.id === course.id ? styles.selected : ""} onClick={() => { setSelected(course); setShowQuizForm(false); setLessonForm((current) => ({ ...current, position: course.lesson_count + 1 })); }}>
                <span className={styles.courseIcon}><BookOpen weight="duotone" /></span>
                <div><strong>{course.title}</strong><small>{course.category} · {course.lesson_count} dars</small></div>
                <b className={styles[course.status]}>{statusNames[course.status]}</b>
              </article>
            ))}
          </section>

          <aside className={styles.editor}>
            {selected ? (
              <>
                <div className={styles.courseHead}>
                  <span><p>TANLANGAN KURS</p><h2>{selected.title}</h2><small>{selected.summary}</small></span>
                  <div>{selected.status !== "published" ? <button onClick={() => changeStatus(selected, "published")}><RocketLaunch /> Nashr qilish</button> : <button onClick={() => changeStatus(selected, "archived")}>Arxivlash</button>}</div>
                </div>
                <div className={styles.metrics}>
                  <span><Stack /><b>{selected.lesson_count}</b><small>Darslar</small></span>
                  <span><Exam /><b>{selectedQuizzes.length}</b><small>Quizlar</small></span>
                  <span><BookOpen /><b>{selected.duration_weeks}</b><small>Hafta</small></span>
                </div>

                <form className={styles.lessonForm} onSubmit={addLesson}>
                  <h3>Yangi dars qo‘shish</h3>
                  <label>Dars nomi<input value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} minLength={3} required /></label>
                  <div><label>Tartib<input type="number" min="1" value={lessonForm.position} onChange={(event) => setLessonForm({ ...lessonForm, position: Number(event.target.value) })} /></label><label>Davomiyligi<input type="number" min="0" max="1440" value={lessonForm.duration_minutes} onChange={(event) => setLessonForm({ ...lessonForm, duration_minutes: Number(event.target.value) })} /></label></div>
                  <label>Dars mazmuni<textarea value={lessonForm.content_text} onChange={(event) => setLessonForm({ ...lessonForm, content_text: event.target.value })} /></label>
                  <label className={styles.check}><input type="checkbox" checked={lessonForm.is_published} onChange={(event) => setLessonForm({ ...lessonForm, is_published: event.target.checked })} /> Darsni darhol nashr qilish</label>
                  <button type="submit"><Plus /> Dars qo‘shish</button>
                </form>

                <section className={styles.quizSection}>
                  <div className={styles.quizTitle}><div><p>BAHOLASH BOSQICHI</p><h3>Kurs quizlari</h3><span>Bilimni avtomatik tekshirish uchun quiz yarating.</span></div><button onClick={() => { setShowQuizForm((current) => !current); if (!quizForm.title) setQuizForm({ ...emptyQuizForm, title: `${selected.title} — yakuniy quiz` }); }}><Plus /> Quiz yaratish</button></div>
                  {showQuizForm && (
                    <form className={styles.quizForm} onSubmit={createQuiz}>
                      <label className={styles.quizWide}>Quiz nomi<input value={quizForm.title} onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })} minLength={3} required /></label>
                      <label>O‘tish bali (%)<input type="number" min="1" max="100" value={quizForm.passing_score} onChange={(event) => setQuizForm({ ...quizForm, passing_score: Number(event.target.value) })} /></label>
                      <label>Urinishlar<input type="number" min="1" max="10" value={quizForm.max_attempts} onChange={(event) => setQuizForm({ ...quizForm, max_attempts: Number(event.target.value) })} /></label>
                      <label>Vaqt (daqiqa)<input type="number" min="1" max="600" value={quizForm.time_limit_minutes} onChange={(event) => setQuizForm({ ...quizForm, time_limit_minutes: Number(event.target.value) })} /></label>
                      <label className={styles.quizWide}>Ko‘rsatma<textarea value={quizForm.instructions} onChange={(event) => setQuizForm({ ...quizForm, instructions: event.target.value })} placeholder="Talaba uchun qisqa yo‘riqnoma" /></label>
                      <div className={styles.quizActions}><button type="button" onClick={() => setShowQuizForm(false)}>Bekor qilish</button><button type="submit"><Exam /> Quizni yaratish</button></div>
                    </form>
                  )}
                  <div className={styles.quizList}>
                    {selectedQuizzes.map((quiz) => (
                      <article key={quiz.id}><span><Exam weight="duotone" /></span><div><b>{quiz.title}</b><small>{quiz.question_count} savol · o‘tish bali {quiz.passing_score}%</small></div><em className={quiz.is_published ? styles.quizPublished : styles.quizDraft}>{quiz.is_published ? "Nashrda" : "Qoralama"}</em><Link href={`/admin/assessments?assessment=${quiz.id}`}>Savollar <ArrowRight /></Link></article>
                    ))}
                    {selectedQuizzes.length === 0 && !showQuizForm && <p>Bu kursda hali quiz yo‘q.</p>}
                  </div>
                </section>
              </>
            ) : (
              <div className={styles.empty}><BookOpen weight="duotone" /><h2>Kursni tanlang</h2><p>Dars va quiz qo‘shish hamda nashr holatini boshqarish uchun chap ro‘yxatdan kursni tanlang.</p></div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
