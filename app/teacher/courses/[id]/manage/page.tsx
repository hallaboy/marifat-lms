"use client";

import { ArrowLeft, BookOpen, CheckCircle, ClipboardText, Exam, Plus, RocketLaunch, SignOut, VideoCamera } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { AdminAssessmentDetail, AdminAssessmentQuestion, apiFetch, Assessment, Assignment, AuthUser, CourseDetail, readCsrfCookie } from "../../../../_lib/api";
import styles from "../../../styles.module.css";

type Section = "lessons" | "assessments" | "assignments";

export default function TeacherCourseManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AdminAssessmentDetail | null>(null);
  const [section, setSection] = useState<Section>("lessons");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [lesson, setLesson] = useState({ title: "", position: 1, content_type: "text", content_url: "", content_text: "", duration_minutes: 20, is_preview: false, is_published: false });
  const [assessment, setAssessment] = useState({ title: "", instructions: "", assessment_type: "quiz", passing_score: 70, max_attempts: 2, time_limit_minutes: 20 });
  const [question, setQuestion] = useState({ prompt: "", points: 1, correct: 0, options: ["", "", "", ""] });
  const [assignment, setAssignment] = useState({ title: "", description: "", due_at: "", max_score: 100, allow_late: false });

  const loadContent = useCallback(async () => {
    const [courseResponse, assessmentsResponse, assignmentsResponse] = await Promise.all([
      apiFetch(`/api/v1/courses/${params.id}`),
      apiFetch(`/api/v1/teacher/assessments?course_id=${encodeURIComponent(params.id)}`),
      apiFetch(`/api/v1/teacher/assignments?course_id=${encodeURIComponent(params.id)}`),
    ]);
    if (courseResponse.status === 404) throw new Error("Kurs topilmadi yoki sizga biriktirilmagan");
    if (!courseResponse.ok || !assessmentsResponse.ok || !assignmentsResponse.ok) throw new Error("Kurs kontentini yuklab bo‘lmadi");
    const courseData = (await courseResponse.json()) as CourseDetail;
    setCourse(courseData);
    setAssessments((await assessmentsResponse.json()) as Assessment[]);
    setAssignments((await assignmentsResponse.json()) as Assignment[]);
    setLesson((current) => ({ ...current, position: courseData.lessons.length + 1 }));
  }, [params.id]);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiFetch("/api/v1/auth/me");
        if (response.status === 401) return router.replace("/login");
        const profile = (await response.json()) as AuthUser;
        if (profile.role !== "teacher") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/my-courses");
        setUser(profile);
        await loadContent();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      }
    }
    void load();
  }, [loadContent, router]);

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function request(path: string, method: "POST" | "PATCH", body: unknown) {
    const token = csrf();
    if (!token) throw new Error("Sessiya tugagan");
    const response = await apiFetch(path, { method, headers: { "X-CSRF-Token": token }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) throw new Error(data.detail ?? "Amalni bajarib bo‘lmadi");
    return data;
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      await request(`/api/v1/teacher/courses/${params.id}/lessons`, "POST", { ...lesson, content_url: lesson.content_type === "text" || !lesson.content_url ? null : lesson.content_url, content_text: lesson.content_type === "text" ? lesson.content_text : null });
      await loadContent();
      setLesson((current) => ({ ...current, title: "", content_url: "", content_text: "", position: current.position + 1, is_published: false }));
      setMessage("Dars kurs dasturiga qo‘shildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Darsni yaratib bo‘lmadi"); } finally { setBusy(false); }
  }

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request("/api/v1/teacher/assessments", "POST", { ...assessment, course_id: params.id, lesson_id: null }) as unknown as Assessment;
      const detail = { ...data, questions: [] } as AdminAssessmentDetail;
      setAssessments((current) => [data, ...current]); setSelectedAssessment(detail);
      setAssessment({ title: "", instructions: "", assessment_type: "quiz", passing_score: 70, max_attempts: 2, time_limit_minutes: 20 });
      setMessage("Test qoralama sifatida yaratildi. Endi savol qo‘shing.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Testni yaratib bo‘lmadi"); } finally { setBusy(false); }
  }

  async function selectAssessment(item: Assessment) {
    setError(""); setMessage("");
    const response = await apiFetch(`/api/v1/teacher/assessments/${item.id}`);
    if (!response.ok) return setError("Test tafsilotlarini yuklab bo‘lmadi");
    setSelectedAssessment((await response.json()) as AdminAssessmentDetail);
  }

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAssessment) return;
    setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request(`/api/v1/teacher/assessments/${selectedAssessment.id}/questions`, "POST", { prompt: question.prompt, position: selectedAssessment.question_count + 1, points: question.points, options: question.options.map((text, index) => ({ text, is_correct: index === question.correct })) }) as unknown as AdminAssessmentQuestion;
      const updated = { ...selectedAssessment, question_count: selectedAssessment.question_count + 1, questions: [...selectedAssessment.questions, data] };
      setSelectedAssessment(updated); setAssessments((current) => current.map((item) => item.id === updated.id ? { ...item, question_count: updated.question_count } : item));
      setQuestion({ prompt: "", points: 1, correct: 0, options: ["", "", "", ""] }); setMessage("Savol testga qo‘shildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Savolni qo‘shib bo‘lmadi"); } finally { setBusy(false); }
  }

  async function toggleAssessment(item: Assessment) {
    setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request(`/api/v1/teacher/assessments/${item.id}/publish`, "PATCH", { is_published: !item.is_published }) as unknown as Assessment;
      setAssessments((current) => current.map((currentItem) => currentItem.id === data.id ? data : currentItem));
      if (selectedAssessment?.id === data.id) setSelectedAssessment({ ...selectedAssessment, ...data });
      setMessage(data.is_published ? "Test talabalarga nashr qilindi." : "Test qoralamaga qaytarildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Test holatini o‘zgartirib bo‘lmadi"); } finally { setBusy(false); }
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request("/api/v1/teacher/assignments", "POST", { ...assignment, course_id: params.id, lesson_id: null, due_at: assignment.due_at ? new Date(assignment.due_at).toISOString() : null }) as unknown as Assignment;
      setAssignments((current) => [data, ...current]); setAssignment({ title: "", description: "", due_at: "", max_score: 100, allow_late: false }); setMessage("Uy vazifasi qoralama sifatida yaratildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vazifani yaratib bo‘lmadi"); } finally { setBusy(false); }
  }

  async function toggleAssignment(item: Assignment) {
    setError(""); setMessage(""); setBusy(true);
    try {
      const data = await request(`/api/v1/teacher/assignments/${item.id}/publish`, "PATCH", { is_published: !item.is_published }) as unknown as Assignment;
      setAssignments((current) => current.map((currentItem) => currentItem.id === data.id ? data : currentItem)); setMessage(data.is_published ? "Vazifa talabalarga nashr qilindi." : "Vazifa qoralamaga qaytarildi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Vazifa holatini o‘zgartirib bo‘lmadi"); } finally { setBusy(false); }
  }

  async function logout() { const token = readCsrfCookie(); if (token) await apiFetch("/api/v1/auth/logout", { method: "POST", headers: { "X-CSRF-Token": token } }).catch(() => undefined); router.replace("/login"); }

  return <main className={styles.shell}><header className={styles.topbar}><Link href="/teacher" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link><nav><Link href={`/teacher/courses/${params.id}`}><ArrowLeft /> Kurs natijalari</Link></nav><div className={styles.profile}><span><small>O‘qituvchi</small><b>{user?.full_name}</b></span><button onClick={logout}><SignOut /> Chiqish</button></div></header>
    <section className={styles.detailHero}><Link className={styles.back} href={`/teacher/courses/${params.id}`}><ArrowLeft /> Kursga qaytish</Link><h1>{course?.title ?? "Kontent boshqaruvi"}</h1><p>Darslar, testlar va uy vazifalarini qoralamadan nashrgacha boshqaring.</p></section>
    <div className={styles.manageShell}>{error && <div className={styles.formError}>{error}</div>}{message && <div className={styles.formSuccess}><CheckCircle /> {message}</div>}<div className={styles.manageTabs}><button className={section === "lessons" ? styles.activeTab : ""} onClick={() => setSection("lessons")}><VideoCamera /> Darslar</button><button className={section === "assessments" ? styles.activeTab : ""} onClick={() => setSection("assessments")}><Exam /> Testlar</button><button className={section === "assignments" ? styles.activeTab : ""} onClick={() => setSection("assignments")}><ClipboardText /> Vazifalar</button></div>
      {section === "lessons" && <div className={styles.manageGrid}><form className={styles.authorForm} onSubmit={createLesson}><h2>Yangi dars</h2><label>Dars nomi<input value={lesson.title} onChange={(event) => setLesson({ ...lesson, title: event.target.value })} minLength={3} required /></label><div className={styles.formRow}><label>Tartib raqami<input type="number" min="1" value={lesson.position} onChange={(event) => setLesson({ ...lesson, position: Number(event.target.value) })} required /></label><label>Kontent turi<select value={lesson.content_type} onChange={(event) => setLesson({ ...lesson, content_type: event.target.value })}><option value="text">Matnli dars</option><option value="video">Video</option><option value="live">Jonli dars</option></select></label></div>{lesson.content_type === "text" ? <label>Dars matni<textarea value={lesson.content_text} onChange={(event) => setLesson({ ...lesson, content_text: event.target.value })} /></label> : <label>HTTPS havola<input type="url" value={lesson.content_url} onChange={(event) => setLesson({ ...lesson, content_url: event.target.value })} placeholder="https://..." required /></label>}<label>Davomiyligi (daqiqa)<input type="number" min="0" max="1440" value={lesson.duration_minutes} onChange={(event) => setLesson({ ...lesson, duration_minutes: Number(event.target.value) })} /></label><label className={styles.checkLine}><input type="checkbox" checked={lesson.is_preview} onChange={(event) => setLesson({ ...lesson, is_preview: event.target.checked })} /> Bepul ko‘rish mumkin</label><label className={styles.checkLine}><input type="checkbox" checked={lesson.is_published} onChange={(event) => setLesson({ ...lesson, is_published: event.target.checked })} /> Darhol nashr qilish</label><button disabled={busy}><Plus /> Dars qo‘shish</button></form><section className={styles.contentList}><h2>Kurs dasturi <small>{course?.lessons.length ?? 0}</small></h2>{course?.lessons.map((item) => <article key={item.id}><b>{item.position}</b><div><strong>{item.title}</strong><small>{item.content_type === "text" ? "Matn" : item.content_type === "video" ? "Video" : "Jonli dars"} · {item.duration_minutes} daqiqa</small></div><span className={item.is_published ? styles.liveBadge : styles.draftBadge}>{item.is_published ? "Nashrda" : "Qoralama"}</span></article>)}</section></div>}
      {section === "assessments" && <div className={styles.manageGrid}><div><form className={styles.authorForm} onSubmit={createAssessment}><h2>Yangi test</h2><label>Test nomi<input value={assessment.title} onChange={(event) => setAssessment({ ...assessment, title: event.target.value })} minLength={3} required /></label><label>Ko‘rsatma<textarea value={assessment.instructions} onChange={(event) => setAssessment({ ...assessment, instructions: event.target.value })} /></label><div className={styles.formRow}><label>Turi<select value={assessment.assessment_type} onChange={(event) => setAssessment({ ...assessment, assessment_type: event.target.value })}><option value="quiz">Test</option><option value="exam">Imtihon</option></select></label><label>O‘tish bali<input type="number" min="1" max="100" value={assessment.passing_score} onChange={(event) => setAssessment({ ...assessment, passing_score: Number(event.target.value) })} /></label></div><div className={styles.formRow}><label>Urinishlar<input type="number" min="1" max="10" value={assessment.max_attempts} onChange={(event) => setAssessment({ ...assessment, max_attempts: Number(event.target.value) })} /></label><label>Vaqt (daqiqa)<input type="number" min="1" max="600" value={assessment.time_limit_minutes} onChange={(event) => setAssessment({ ...assessment, time_limit_minutes: Number(event.target.value) })} /></label></div><button disabled={busy}><Plus /> Test yaratish</button></form>{selectedAssessment && !selectedAssessment.is_published && <form className={styles.authorForm} onSubmit={addQuestion}><h2>{selectedAssessment.title}: savol</h2><label>Savol matni<textarea value={question.prompt} onChange={(event) => setQuestion({ ...question, prompt: event.target.value })} minLength={3} required /></label>{question.options.map((option, index) => <label className={styles.optionLine} key={index}><input type="radio" name="correct" checked={question.correct === index} onChange={() => setQuestion({ ...question, correct: index })} /><input value={option} onChange={(event) => { const options = [...question.options]; options[index] = event.target.value; setQuestion({ ...question, options }); }} placeholder={`${index + 1}-variant`} required /></label>)}<button disabled={busy}><Plus /> Savol qo‘shish</button></form>}</div><section className={styles.contentList}><h2>Testlar <small>{assessments.length}</small></h2>{assessments.map((item) => <article className={selectedAssessment?.id === item.id ? styles.selectedContent : ""} key={item.id}><Exam /><button className={styles.itemMain} onClick={() => selectAssessment(item)}><strong>{item.title}</strong><small>{item.question_count} savol · {item.passing_score}% o‘tish bali</small></button><button className={item.is_published ? styles.unpublishButton : styles.publishButton} onClick={() => toggleAssessment(item)} disabled={busy}>{item.is_published ? "Nashrdan olish" : <><RocketLaunch /> Nashr</>}</button></article>)}{selectedAssessment && <div className={styles.questionPreview}><h3>Savollar</h3>{selectedAssessment.questions.map((item) => <p key={item.id}><b>{item.position}.</b> {item.prompt}</p>)}</div>}</section></div>}
      {section === "assignments" && <div className={styles.manageGrid}><form className={styles.authorForm} onSubmit={createAssignment}><h2>Yangi uy vazifasi</h2><label>Nomi<input value={assignment.title} onChange={(event) => setAssignment({ ...assignment, title: event.target.value })} minLength={3} required /></label><label>Tavsif<textarea value={assignment.description} onChange={(event) => setAssignment({ ...assignment, description: event.target.value })} minLength={10} required /></label><div className={styles.formRow}><label>Muddat<input type="datetime-local" value={assignment.due_at} onChange={(event) => setAssignment({ ...assignment, due_at: event.target.value })} /></label><label>Maksimal ball<input type="number" min="1" max="1000" value={assignment.max_score} onChange={(event) => setAssignment({ ...assignment, max_score: Number(event.target.value) })} /></label></div><label className={styles.checkLine}><input type="checkbox" checked={assignment.allow_late} onChange={(event) => setAssignment({ ...assignment, allow_late: event.target.checked })} /> Kech yuborishga ruxsat</label><button disabled={busy}><Plus /> Vazifa yaratish</button></form><section className={styles.contentList}><h2>Uy vazifalari <small>{assignments.length}</small></h2>{assignments.map((item) => <article key={item.id}><ClipboardText /><div className={styles.itemMain}><strong>{item.title}</strong><small>{item.submission_count} javob · {item.max_score} ball</small></div><button className={item.is_published ? styles.unpublishButton : styles.publishButton} onClick={() => toggleAssignment(item)} disabled={busy}>{item.is_published ? "Nashrdan olish" : <><RocketLaunch /> Nashr</>}</button></article>)}</section></div>}
    </div>
  </main>;
}
