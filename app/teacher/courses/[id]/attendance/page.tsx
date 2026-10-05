"use client";

import { ArrowLeft, BookOpen, CheckCircle, SignOut, Student, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { apiFetch, AttendanceBoard, AttendanceStatus, AuthUser, readCsrfCookie } from "../../../../_lib/api";
import styles from "../../../styles.module.css";

type Draft = { status: AttendanceStatus; note: string };

const statusNames: Record<AttendanceStatus, string> = { present: "Qatnashdi", absent: "Qatnashmadi", late: "Kechikdi", excused: "Sababli" };

function draftsFor(board: AttendanceBoard, lessonId: string): Record<string, Draft> {
  return Object.fromEntries(board.students.map((student) => {
    const record = board.records.find((item) => item.lesson_id === lessonId && item.student_id === student.student_id);
    return [student.student_id, { status: record?.status ?? "present", note: record?.note ?? "" }];
  }));
}

export default function TeacherAttendancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [board, setBoard] = useState<AttendanceBoard | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBoard = useCallback(async () => {
    const response = await apiFetch(`/api/v1/attendance/courses/${params.id}`);
    if (response.status === 404) throw new Error("Kurs topilmadi yoki sizga biriktirilmagan");
    if (!response.ok) throw new Error("Davomatni yuklab bo‘lmadi");
    const data = (await response.json()) as AttendanceBoard;
    const nextLessonId = lessonId && data.lessons.some((item) => item.lesson_id === lessonId) ? lessonId : data.lessons[0]?.lesson_id ?? "";
    setBoard(data); setLessonId(nextLessonId); setDrafts(draftsFor(data, nextLessonId));
  }, [lessonId, params.id]);

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "teacher") return router.replace(profile.role === "admin" || profile.role === "super_admin" ? "/admin" : "/my-courses");
        setUser(profile); await loadBoard();
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi"); } finally { setLoading(false); }
    }
    void load();
  }, [loadBoard, router]);

  function chooseLesson(nextLessonId: string) {
    setLessonId(nextLessonId); setMessage(""); setError("");
    if (board) setDrafts(draftsFor(board, nextLessonId));
  }

  async function save() {
    if (!board || !lessonId || board.students.length === 0) return;
    const token = readCsrfCookie(); if (!token) return router.replace("/login");
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await apiFetch(`/api/v1/attendance/courses/${params.id}`, { method: "PUT", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ lesson_id: lessonId, entries: board.students.map((student) => ({ student_id: student.student_id, status: drafts[student.student_id]?.status ?? "present", note: drafts[student.student_id]?.note || null })) }) });
      const data = (await response.json().catch(() => ({}))) as AttendanceBoard & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Davomatni saqlab bo‘lmadi");
      setBoard(data); setDrafts(draftsFor(data, lessonId)); setMessage("Davomat saqlandi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Davomatni saqlab bo‘lmadi"); } finally { setSaving(false); }
  }

  async function logout() { const token = readCsrfCookie(); if (token) await apiFetch("/api/v1/auth/logout", { method: "POST", headers: { "X-CSRF-Token": token } }).catch(() => undefined); router.replace("/login"); }

  return <main className={styles.shell}><header className={styles.topbar}><Link href="/teacher" className={styles.brand}><BookOpen weight="fill" />sitlearning</Link><nav><Link href={`/teacher/courses/${params.id}`}><ArrowLeft /> Kurs natijalari</Link></nav><div className={styles.profile}><span><small>O‘qituvchi</small><b>{user?.full_name}</b></span><button onClick={logout}><SignOut /> Chiqish</button></div></header><section className={styles.detailHero}><Link className={styles.back} href={`/teacher/courses/${params.id}`}><ArrowLeft /> Kursga qaytish</Link><h1>{board?.course_title ?? "Davomat"}</h1><p>Darsni tanlang va kurs talabalarining qatnashuv holatini belgilang.</p></section><section className={styles.attendancePanel}>{loading && <div className={styles.state}>Davomat yuklanmoqda…</div>}{error && <div className={styles.formError}>{error}</div>}{message && <div className={styles.formSuccess}><CheckCircle /> {message}</div>}{board && <>{board.lessons.length === 0 ? <div className={styles.empty}><BookOpen /><h3>Davomat uchun dars mavjud emas</h3></div> : <><div className={styles.attendanceToolbar}><label>Dars<select value={lessonId} onChange={(event) => chooseLesson(event.target.value)}>{board.lessons.map((lesson) => <option value={lesson.lesson_id} key={lesson.lesson_id}>{lesson.position}. {lesson.title}{lesson.is_published ? "" : " — qoralama"}</option>)}</select></label><span><UsersThree /> {board.students.length} talaba</span><button disabled={saving || board.students.length === 0} onClick={save}>{saving ? "Saqlanmoqda…" : "Davomatni saqlash"}</button></div><div className={styles.attendanceTable}><table><thead><tr><th>Talaba</th><th>Holati</th><th>Izoh</th></tr></thead><tbody>{board.students.map((student) => <tr key={student.student_id}><td><div className={styles.studentCell}><Student /><span><strong>{student.full_name}</strong><small>{student.email}</small></span></div></td><td><select className={styles[drafts[student.student_id]?.status ?? "present"]} value={drafts[student.student_id]?.status ?? "present"} onChange={(event) => setDrafts((current) => ({ ...current, [student.student_id]: { status: event.target.value as AttendanceStatus, note: current[student.student_id]?.note ?? "" } }))}>{Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td><td><input value={drafts[student.student_id]?.note ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [student.student_id]: { status: current[student.student_id]?.status ?? "present", note: event.target.value } }))} maxLength={1000} placeholder="Ixtiyoriy izoh" /></td></tr>)}</tbody></table>{board.students.length === 0 && <div className={styles.empty}><UsersThree /><h3>Kursga talaba biriktirilmagan</h3></div>}</div></>}</>}</section></main>;
}
