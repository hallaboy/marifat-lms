export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://127.0.0.1:8000";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "teacher" | "student";
  is_active: boolean;
  last_login_at: string | null;
};

export type AdminStats = {
  total_users: number;
  administrators: number;
  teachers: number;
  students: number;
  active_sessions: number;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  duration_weeks: number;
  status: "draft" | "published" | "archived";
  teacher_id: string | null;
  teacher_name: string | null;
  lesson_count: number;
  published_at: string | null;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  position: number;
  content_type: "text" | "video" | "live";
  content_url: string | null;
  content_text: string | null;
  duration_minutes: number;
  is_preview: boolean;
  is_published: boolean;
  created_at: string;
  materials: Material[];
};

export type CourseDetail = Course & { lessons: Lesson[] };

export type EnrollmentStatus = "active" | "completed" | "suspended";

export type Enrollment = {
  id: string;
  course_id: string;
  course_title: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: EnrollmentStatus;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
  last_activity_at: string | null;
};

export type MyCourse = {
  enrollment_id: string;
  status: EnrollmentStatus;
  progress_percent: number;
  last_activity_at: string | null;
  course: Course;
};

export type LessonCompletion = {
  lesson_id: string;
  is_completed: boolean;
  progress_percent: number;
  course_completed: boolean;
};

export type CourseProgress = {
  course_id: string;
  status: EnrollmentStatus;
  progress_percent: number;
  completed_lesson_ids: string[];
};

export type Assessment = {
  id: string;
  course_id: string;
  course_title: string;
  lesson_id: string | null;
  title: string;
  instructions: string | null;
  assessment_type: "quiz" | "exam";
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  is_published: boolean;
  question_count: number;
  published_at: string | null;
  created_at: string;
};

export type AdminAssessmentOption = {
  id: string;
  text: string;
  position: number;
  is_correct: boolean;
};

export type AdminAssessmentQuestion = {
  id: string;
  prompt: string;
  position: number;
  points: number;
  options: AdminAssessmentOption[];
};

export type AdminAssessmentDetail = Assessment & {
  questions: AdminAssessmentQuestion[];
};

export type StudentAssessment = Assessment & {
  attempts_used: number;
  latest_score_percent: number | null;
  latest_passed: boolean | null;
};

export type StudentAssessmentQuestion = {
  id: string;
  prompt: string;
  position: number;
  points: number;
  options: { id: string; text: string; position: number }[];
};

export type StudentAssessmentDetail = StudentAssessment & {
  questions: StudentAssessmentQuestion[];
};

export type AssessmentAttempt = {
  id: string;
  assessment_id: string;
  attempt_number: number;
  status: "in_progress" | "submitted" | "expired";
  started_at: string;
  expires_at: string | null;
};

export type AssessmentResult = {
  attempt_id: string;
  attempt_number: number;
  score_percent: number;
  points_earned: number;
  total_points: number;
  passed: boolean;
  submitted_at: string;
};

export type Material = {
  id: string;
  lesson_id: string;
  title: string;
  material_type: "youtube" | "video" | "audio" | "document" | "game" | "link";
  url: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  display_order: number;
  is_downloadable: boolean;
  created_at: string;
};

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${API_ORIGIN}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
}

export function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const item = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("lms_csrf="));
  return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : null;
}
