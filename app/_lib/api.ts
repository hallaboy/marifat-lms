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
  price_uzs: number;
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

export type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  submission_text: string | null;
  file_url: string | null;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: "submitted" | "graded";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

export type Assignment = {
  id: string;
  course_id: string;
  course_title: string;
  lesson_id: string | null;
  title: string;
  description: string;
  due_at: string | null;
  max_score: number;
  allow_late: boolean;
  is_published: boolean;
  submission_count: number;
  published_at: string | null;
  created_at: string;
};

export type AdminAssignmentDetail = Assignment & {
  submissions: AssignmentSubmission[];
};

export type TeacherOverview = {
  assigned_courses: number;
  total_students: number;
  active_students: number;
  average_progress: number;
  pending_submissions: number;
  average_assessment_score: number;
};

export type TeacherCourseSummary = {
  course_id: string;
  title: string;
  category: string;
  status: "draft" | "published" | "archived";
  lesson_count: number;
  student_count: number;
  completed_students: number;
  average_progress: number;
  pending_submissions: number;
  average_assessment_score: number;
};

export type TeacherDashboard = {
  overview: TeacherOverview;
  courses: TeacherCourseSummary[];
};

export type TeacherStudentSummary = {
  enrollment_id: string;
  student_id: string;
  full_name: string;
  email: string;
  status: EnrollmentStatus;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  average_assessment_score: number;
  assignment_submissions: number;
  average_assignment_score: number;
};

export type TeacherCourseDetail = {
  course: TeacherCourseSummary;
  students: TeacherStudentSummary[];
};

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceRecord = {
  id: string;
  lesson_id: string;
  lesson_title: string;
  student_id: string;
  student_name: string;
  status: AttendanceStatus;
  note: string | null;
  marked_at: string;
};

export type AttendanceBoard = {
  course_id: string;
  course_title: string;
  lessons: { lesson_id: string; title: string; position: number; is_published: boolean }[];
  students: { student_id: string; full_name: string; email: string; enrollment_status: string }[];
  records: AttendanceRecord[];
};

export type StudentAttendance = {
  summary: {
    total_marked: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_percent: number;
  };
  records: AttendanceRecord[];
};

export type Certificate = {
  id: string;
  verification_code: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_title: string;
  issued_at: string;
  completed_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  is_valid: boolean;
};

export type TelegramIntegration = {
  enabled: boolean;
  linked: boolean;
  bot_username: string | null;
  linked_at: string | null;
};

export type TelegramLink = {
  command: string;
  deep_link: string | null;
  expires_at: string;
};

export type IntegrationAdmin = {
  telegram_enabled: boolean;
  telegram_bot_username: string | null;
  crm_enabled: boolean;
  firebase_enabled: boolean;
  linked_telegram_accounts: number;
  firebase_installations: number;
  pending_deliveries: number;
  failed_deliveries: number;
  delivered_deliveries: number;
  dead_deliveries: number;
};

export type FirebaseIntegration = {
  enabled: boolean;
  installation_count: number;
};

export type IntegrationDelivery = {
  id: string;
  channel: "telegram" | "crm";
  event_type: string;
  destination: string;
  status: "pending" | "processing" | "delivered" | "failed" | "dead";
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type PaymentProviders = {
  click: boolean;
  payme: boolean;
  uzum: boolean;
};

export type StudentAssignment = Assignment & {
  is_overdue: boolean;
  submission: AssignmentSubmission | null;
};

export type AdminAnalyticsOverview = {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  average_course_progress: number;
  completed_lessons: number;
  submitted_assessments: number;
  average_assessment_score: number;
  assessment_pass_rate: number;
  assignment_submissions: number;
  graded_assignments: number;
  average_assignment_score: number;
};

export type CourseAnalytics = {
  course_id: string;
  course_title: string;
  enrollment_count: number;
  completed_enrollments: number;
  average_progress: number;
  submitted_assessments: number;
  average_assessment_score: number;
  assignment_submissions: number;
};

export type AdminAnalytics = {
  overview: AdminAnalyticsOverview;
  courses: CourseAnalytics[];
};

export type StudentCourseResult = {
  course_id: string;
  course_title: string;
  status: EnrollmentStatus;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
};

export type StudentAssessmentResult = {
  assessment_id: string;
  title: string;
  course_title: string;
  attempt_number: number;
  score_percent: number;
  passed: boolean;
  submitted_at: string;
};

export type StudentAssignmentResult = {
  assignment_id: string;
  title: string;
  course_title: string;
  status: "submitted" | "graded";
  score: number | null;
  max_score: number;
  score_percent: number | null;
  feedback: string | null;
  submitted_at: string;
};

export type StudentAnalyticsSummary = {
  enrolled_courses: number;
  completed_courses: number;
  completed_lessons: number;
  average_assessment_score: number;
  passed_assessments: number;
  average_assignment_score: number;
};

export type StudentAnalytics = {
  summary: StudentAnalyticsSummary;
  courses: StudentCourseResult[];
  assessments: StudentAssessmentResult[];
  assignments: StudentAssignmentResult[];
};

export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";
export type PaymentMethod = "cash" | "bank_transfer" | "card" | "click" | "payme" | "uzum" | "other";

export type Payment = {
  id: string;
  enrollment_id: string;
  course_id: string;
  course_title: string;
  student_id: string;
  student_name: string;
  student_email: string;
  amount_uzs: number;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  provider_reference: string | null;
  note: string | null;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type PaymentSummary = {
  total_invoiced_uzs: number;
  paid_uzs: number;
  pending_uzs: number;
  refunded_uzs: number;
  pending_count: number;
  paid_count: number;
};

export type CalendarEventType = "live_lesson" | "exam" | "meeting" | "deadline" | "other";

export type CalendarEvent = {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  starts_at: string;
  ends_at: string | null;
  meeting_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type StudentCalendarItem = {
  id: string;
  source: "event" | "assignment";
  course_id: string;
  course_title: string;
  title: string;
  description: string | null;
  event_type: CalendarEventType | "assignment_due";
  starts_at: string;
  ends_at: string | null;
  meeting_url: string | null;
};

export type LibraryResourceType = "textbook" | "methodology" | "recommendation" | "presentation" | "other";

export type LibraryResource = {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  resource_type: LibraryResourceType;
  url: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  display_order: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type ResourceGroup = {
  id: string;
  name: string;
  slug: string;
  direction: string;
  description: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  resources: LibraryResource[];
};

export type NotificationAudience = "all" | "students" | "teachers" | "administrators";
export type NotificationPriority = "info" | "important" | "urgent";

export type Notification = {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  audience: NotificationAudience;
  course_id: string | null;
  course_title: string | null;
  action_url: string | null;
  is_published: boolean;
  is_read: boolean;
  expires_at: string | null;
  published_at: string | null;
  created_at: string;
};

export type NotificationFeed = {
  unread_count: number;
  items: Notification[];
};

export type HelpFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportMessage = {
  id: string;
  author_user_id: string;
  author_name: string;
  message: string;
  is_staff: boolean;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  category: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
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
