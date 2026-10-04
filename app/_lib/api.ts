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

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_ORIGIN}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const item = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("lms_csrf="));
  return item ? decodeURIComponent(item.split("=").slice(1).join("=")) : null;
}
