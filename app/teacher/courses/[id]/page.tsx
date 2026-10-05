"use client";

import { ArrowLeft, BookOpen, ClipboardText, DownloadSimple, SignOut, Student } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { AdminAssignmentDetail, API_ORIGIN, apiFetch, Assignment, AuthUser, readCsrfCookie, TeacherCourseDetail } from "../../../_lib/api";
import styles from "../../styles.module.css";

type GradeDraft = { score: string; feedback: string };

export default function TeacherCoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [detail, setDetail] = useState<TeacherCourseDetail | null>(null);
  const [assignments, setAssignments] = useState<AdminAssignmentDetail[]>([]);
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourse = useCallback(async () => {
    const [detailResponse, assignmentsResponse] = await Promise.all([
      apiFetch(`/api/v1/teacher/courses/${params.id}`),
      apiFetch(`/api/v1/teacher/assignments?course_id=${encodeURIComponent(params.id)}`),
    ]);
    if (detailResponse.status === 404) throw new Error("Kurs topilmadi yoki sizga biriktirilmagan");
    if (!detailResponse.ok || !assignmentsResponse.ok) throw new Error("Kurs ma’lumotlarini yuklab bo‘lmadi");
    const baseAssignments = (await assignmentsResponse.json()) as Assignment[];
    const loadedAssignments = await Promise.all(baseAssignments.map(async (item) => {
      const response = await apiFetch(`/api/v1/teacher/assignments/${item.id}`);
      if (!response.ok) throw new Error("Topshiriq javoblarini yuklab bo‘lmadi");
      return (await response.json()) as AdminAssignmentDetail;
    }));
    setDetail((await detailResponse.json()) as TeacherCourseDetail);
    setAssignments(loadedAssignments);
    setDrafts(Object.fromEntries(loadedAssignments.flatMap((item) => item.submissions.map((submission) => [submission.id, { score: submission.score?.toString() ?? "", feedback: submission.feedback ?? "" }]))));
  }, [params.id]);

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "teacher") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/my-courses");
        setUser(profile);
        await loadCourse();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [loadCourse, router]);

  async function grade(event: FormEvent<HTMLFormElement>, submissionId: string, maxScore: number) {
    event.preventDefault();
    const draft = drafts[submissionId];
    const score = Number(draft?.score);
    if (!Number.isInteger(score) || score < 0 || score > maxScore) {
      setMessage(`Ball 0 dan ${maxScore} gacha butun son bo‘lishi kerak.`);
      return;
    }
    const token = readCsrfCookie();
    if (!token) return router.replace("/login");
    setBusyId(submissionId);
    setMessage("");
    try {
      const response = await apiFetch(`/api/v1/teacher/assignments/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": token },
        body: JSON.stringify({ score, feedback: draft.feedback || null }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { detail?: string };
        throw new Error(data.detail ?? "Bahoni saqlab bo‘lmadi");
      }
      await loadCourse();
      setMessage("Baho va fikr saqlandi.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Baholashda xatolik yuz berdi");
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    const token = readCsrfCookie();
    if (token) await apiFetch("/api/v1/auth/logout", { method: "POST", headers: { "X-CSRF-Token": token } }).catch(() => undefined);
    router.replace("/login");
  }

  return <main className={styles.shell}>
    <header className={styles.topbar}><Link href="/teacher" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link><nav><Link href="/teacher"><ArrowLeft /> Kabinetga qaytish</Link></nav><div className={styles.profile}><span><small>O‘qituvchi</small><b>{user?.full_name}</b></span><button onClick={logout}><SignOut /> Chiqish</button></div></header>
    {loading && <section className={styles.state}>Kurs yuklanmoqda…</section>}
    {error && <section className={`${styles.state} ${styles.error}`}>{error}</section>}
    {detail && <>
      <section className={styles.detailHero}><div className={styles.detailNav}><Link className={styles.back} href="/teacher"><ArrowLeft /> O‘qituvchi kabineti</Link><span className={styles.detailActions}><Link className={styles.attendanceLink} href={`/teacher/courses/${params.id}/attendance`}>Davomat</Link><Link className={styles.manageLink} href={`/teacher/courses/${params.id}/manage`}>Kontentni boshqarish →</Link></span></div><h1>{detail.course.title}</h1><p>{detail.course.student_count} talaba · {detail.course.lesson_count} dars · o‘rtacha progress {detail.course.average_progress}%</p></section>
      <div className={styles.tabs}>
        <section className={styles.tablePanel}><h2><Student /> Talabalar natijalari</h2>{detail.students.length === 0 ? <div className={styles.empty}><Student /><h3>Talabalar hali biriktirilmagan</h3></div> : <div className={styles.tableWrap}><table><thead><tr><th>Talaba</th><th>Holati</th><th>Progress</th><th>Darslar</th><th>Test natijasi</th><th>Vazifalar</th></tr></thead><tbody>{detail.students.map((student) => <tr key={student.enrollment_id}><td><strong>{student.full_name}</strong><small>{student.email}</small></td><td>{student.status === "completed" ? "Yakunlagan" : student.status === "active" ? "Faol" : "To‘xtatilgan"}</td><td><strong>{student.progress_percent}%</strong><div className={styles.miniProgress}><i style={{ width: `${student.progress_percent}%` }} /></div></td><td>{student.completed_lessons} / {student.total_lessons}</td><td><strong>{student.average_assessment_score}%</strong></td><td>{student.assignment_submissions} ta<small>o‘rtacha {student.average_assignment_score}%</small></td></tr>)}</tbody></table></div>}</section>
        <section className={styles.assignmentPanel}><h2><ClipboardText /> Topshiriqlarni baholash</h2>{message && <p className={message === "Baho va fikr saqlandi." ? styles.success : styles.error}>{message}</p>}<div className={styles.assignmentList}>{assignments.length === 0 ? <div className={styles.empty}><ClipboardText /><h3>Topshiriqlar mavjud emas</h3><p>Administrator bu kurs uchun topshiriq yaratishi mumkin.</p></div> : assignments.map((assignment) => <article className={styles.assignment} key={assignment.id}><div className={styles.assignmentHeader}><h3>{assignment.title}</h3><span>{assignment.submissions.length} ta javob · maksimal {assignment.max_score} ball</span></div>{assignment.submissions.length === 0 ? <p>Talabalar hali javob yubormagan.</p> : assignment.submissions.map((submission) => <div className={styles.submission} key={submission.id}><div><strong>{submission.student_name}</strong><small>{submission.student_email}</small><p>{submission.submission_text || "Matnli izoh yo‘q"}</p></div><div>{submission.file_url ? <a href={`${API_ORIGIN}${submission.file_url}`}><DownloadSimple /> Faylni yuklab olish</a> : <span>Fayl biriktirilmagan</span>}<p>{submission.status === "graded" ? `${submission.score} ball berilgan` : "Tekshirilmagan"}</p></div><form className={styles.gradeForm} onSubmit={(event) => grade(event, submission.id, assignment.max_score)}><input aria-label="Ball" type="number" min="0" max={assignment.max_score} placeholder="Ball" value={drafts[submission.id]?.score ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [submission.id]: { score: event.target.value, feedback: current[submission.id]?.feedback ?? "" } }))} required /><input aria-label="Fikr" placeholder="Talabaga fikr" value={drafts[submission.id]?.feedback ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [submission.id]: { score: current[submission.id]?.score ?? "", feedback: event.target.value } }))} /><button disabled={busyId === submission.id}>{busyId === submission.id ? "Saqlanmoqda…" : "Baholash"}</button></form></div>)}</article>)}</div></section>
      </div>
    </>}
  </main>;
}
