"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Books,
  CalendarBlank,
  CalendarCheck,
  CaretDown,
  ChartBar,
  Check,
  ClipboardText,
  Clock,
  CreditCard,
  Exam,
  House,
  List,
  MagnifyingGlass,
  Medal,
  Play,
  PlugsConnected,
  Question,
  Sparkle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

import {
  apiFetch,
  AuthUser,
  MyCourse,
  NotificationFeed,
  StudentAnalytics,
  StudentAssignment,
  StudentCalendarItem,
} from "./_lib/api";

const cardStyles = [
  { color: "violet", gradient: "violetArt" },
  { color: "orange", gradient: "orangeArt" },
  { color: "blue", gradient: "blueArt" },
];

const monthName = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", month: "short" }).format(new Date(value)).replace(".", "").toUpperCase();
const dayNumber = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit" }).format(new Date(value));
const timeLabel = (value: string) => new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function initials(value: string | null) {
  if (!value) return "—";
  return value.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function dueLabel(value: string | null, currentTime: number) {
  if (!value) return "Muddat belgilanmagan";
  const date = new Date(value);
  const difference = date.getTime() - currentTime;
  if (difference < 0) return "Muddati o‘tgan";
  if (difference < 24 * 60 * 60 * 1000) return `Bugun, ${timeLabel(value)}`;
  if (difference < 48 * 60 * 60 * 1000) return `Ertaga, ${timeLabel(value)}`;
  return new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [calendar, setCalendar] = useState<StudentCalendarItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationFeed>({ unread_count: 0, items: [] });
  const [currentTime, setCurrentTime] = useState(0);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role === "admin" || profile.role === "super_admin") return router.replace("/admin");
        if (profile.role === "teacher") return router.replace("/teacher");
        if (profile.role !== "student") return router.replace("/courses");
        setUser(profile);

        const responses = await Promise.all([
          apiFetch("/api/v1/me/courses"),
          apiFetch("/api/v1/me/analytics"),
          apiFetch("/api/v1/me/assignments"),
          apiFetch("/api/v1/me/calendar"),
          apiFetch("/api/v1/notifications"),
        ]);
        if (responses.some((response) => !response.ok)) throw new Error("Kabinet ma’lumotlarini yuklab bo‘lmadi");
        const [courseData, analyticsData, assignmentData, calendarData, notificationData] = await Promise.all(responses.map((response) => response.json()));
        setCourses(courseData as MyCourse[]);
        setAnalytics(analyticsData as StudentAnalytics);
        setAssignments(assignmentData as StudentAssignment[]);
        setCalendar(calendarData as StudentCalendarItem[]);
        setNotifications(notificationData as NotificationFeed);
        setCurrentTime(Date.now());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void loadDashboard();
  }, [router]);

  const pendingAssignments = useMemo(() => assignments.filter((item) => item.submission === null).sort((first, second) => {
    if (!first.due_at) return 1;
    if (!second.due_at) return -1;
    return new Date(first.due_at).getTime() - new Date(second.due_at).getTime();
  }), [assignments]);

  const upcomingEvents = useMemo(() => calendar.filter((item) => new Date(item.starts_at).getTime() >= currentTime), [calendar, currentTime]);
  const averageProgress = courses.length ? Math.round(courses.reduce((sum, item) => sum + item.progress_percent, 0) / courses.length) : 0;
  const filteredCourses = useMemo(() => courses.filter((item) => `${item.course.title} ${item.course.teacher_name ?? ""} ${item.course.category}`.toLocaleLowerCase("uz").includes(query.toLocaleLowerCase("uz"))), [courses, query]);
  const visibleCourses = filteredCourses.slice(0, 3);
  const firstName = user?.full_name.split(" ")[0] ?? "Talaba";
  const today = currentTime ? new Intl.DateTimeFormat("uz-UZ", { timeZone: "Asia/Tashkent", weekday: "long", day: "numeric", month: "long" }).format(new Date(currentTime)).toUpperCase() : "BUGUN";

  const navItems = [
    { label: "Bosh sahifa", icon: House, href: "/" },
    { label: "Kurslarim", icon: BookOpen, href: "/my-courses" },
    { label: "Testlar", icon: Exam, href: "/assessments" },
    { label: "Uy vazifalari", icon: ClipboardText, badge: pendingAssignments.length || undefined, href: "/assignments" },
    { label: "Taqvim", icon: CalendarBlank, href: "/calendar" },
    { label: "Natijalar", icon: ChartBar, href: "/results" },
    { label: "Davomat", icon: CalendarCheck, href: "/attendance" },
    { label: "Sertifikatlar", icon: Medal, href: "/certificates" },
    { label: "Resurslar", icon: Books, href: "/resources" },
  ];

  if (loading) return <main className="dashboardState"><BookOpen weight="duotone" /><p>Shaxsiy kabinet yuklanmoqda…</p></main>;
  if (error) return <main className="dashboardState dashboardError"><WarningCircle /><h1>Kabinetni ochib bo‘lmadi</h1><p>{error}</p><Link href="/login">Qayta kirish</Link></main>;

  return (
    <main className="appShell">
      <aside className={`sidebar ${menuOpen ? "sidebarOpen" : ""}`}>
        <div className="brand"><span className="brandMark"><BookOpen weight="fill" /></span><span>SiteLearning</span></div>
        <button className="closeMenu" onClick={() => setMenuOpen(false)} aria-label="Menyuni yopish"><X /></button>
        <nav className="mainNav" aria-label="Asosiy menyu">
          <p className="navLabel">MENYU</p>
          {navItems.map(({ label, icon: Icon, badge, href }) => (
            <Link key={label} className={href === "/" ? "navItem active" : "navItem"} href={href} onClick={() => setMenuOpen(false)}>
              <Icon size={21} weight={href === "/" ? "fill" : "regular"} /><span>{label}</span>{badge && <b>{badge > 99 ? "99+" : badge}</b>}
            </Link>
          ))}
          <p className="navLabel second">BOSHQALAR</p>
          <Link className="navItem" href="/payments"><CreditCard size={21} /><span>To‘lovlar</span></Link>
          <Link className="navItem" href="/help"><Question size={21} /><span>Yordam markazi</span></Link>
          <Link className="navItem" href="/integrations"><PlugsConnected size={21} /><span>Integratsiyalar</span></Link>
        </nav>
        <div className="upgradeCard">
          <span className="spark"><Sparkle weight="fill" /></span>
          <h3>Bilimingizni oshiring!</h3>
          <p>Yangi kurslarni kashf eting va imkoniyatlaringizni kengaytiring.</p>
          <Link href="/courses">Kurslarni ko‘rish <ArrowRight /></Link>
        </div>
        <Link className="sideProfile" href="/my-courses">
          <span className="avatar avatarPhoto">{initials(user?.full_name ?? null)}</span>
          <span><strong>{user?.full_name}</strong><small>Talaba</small></span>
          <CaretDown />
        </Link>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Menyuni yopish" />}

      <section className="workspace">
        <header className="topbar">
          <button className="mobileMenu" onClick={() => setMenuOpen(true)} aria-label="Menyuni ochish"><List /></button>
          <label className="searchBox"><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kurslaringizni qidiring..." /></label>
          <Link className="notification" href="/notifications" aria-label={`Bildirishnomalar: ${notifications.unread_count} ta yangi`}><Bell />{notifications.unread_count > 0 && <i />}</Link>
          <Link className="headerProfile" href="/my-courses"><span className="avatar avatarPhoto">{initials(user?.full_name ?? null)}</span><span><strong>{user?.full_name}</strong><small>Talaba kabineti</small></span><CaretDown /></Link>
        </header>

        <div className="content">
          <section className="welcomeRow">
            <div><p className="eyebrow">{today}</p><h1>Xush kelibsiz, {firstName}! <span>👋</span></h1><p>Bugungi rejalaringiz va o‘quv natijalaringiz bir joyda.</p></div>
            <div className="streak"><span><CalendarBlank weight="fill" /></span><div><strong>{upcomingEvents.length} ta</strong><small>Yaqin tadbir</small></div><div className="miniWeek"><i>D</i><i>S</i><i>C</i><i className="today">P</i><i>J</i></div></div>
          </section>

          <section className="statsGrid">
            <article><span className="statIcon purple"><BookOpen weight="duotone" /></span><div><small>Faol kurslar</small><strong>{courses.filter((item) => item.status === "active").length} <em>ta</em></strong><p><b>{courses.length}</b> jami biriktirilgan</p></div></article>
            <article><span className="statIcon green"><ChartBar weight="duotone" /></span><div><small>O‘rtacha progress</small><strong>{averageProgress} <em>%</em></strong><p><b>{analytics?.summary.completed_courses ?? 0}</b> kurs tugallangan</p></div></article>
            <article><span className="statIcon amber"><Medal weight="duotone" /></span><div><small>Test natijasi</small><strong>{analytics?.summary.average_assessment_score ?? 0} <em>%</em></strong><p><b>{analytics?.summary.passed_assessments ?? 0}</b> testdan o‘tilgan</p></div></article>
            <article><span className="statIcon blue"><Check weight="bold" /></span><div><small>Tugallangan</small><strong>{analytics?.summary.completed_lessons ?? 0} <em>dars</em></strong><p><b>{analytics?.summary.enrolled_courses ?? 0}</b> kursda o‘qilmoqda</p></div></article>
          </section>

          <div className="mainGrid">
            <section className="coursesSection">
              <div className="sectionHead"><div><h2>Kurslarim</h2><p>O‘rganishni davom ettiring</p></div><Link href="/my-courses">Barchasini ko‘rish <ArrowRight /></Link></div>
              <div className="courseGrid">
                {visibleCourses.map((item, index) => {
                  const style = cardStyles[index % cardStyles.length];
                  return <article className="courseCard" key={item.enrollment_id}>
                    <div className={`courseArt ${style.gradient}`}><span>{item.course.category}</span><div className="artShape"><i /><i /><i /></div></div>
                    <div className="courseBody">
                      <h3>{item.course.title}</h3>
                      <div className="mentor"><span className={`avatar ${style.color}`}>{initials(item.course.teacher_name)}</span><small>{item.course.teacher_name ?? "O‘qituvchi biriktirilmagan"}</small></div>
                      <div className="progressMeta"><span>{item.course.lesson_count} dars</span><strong>{item.progress_percent}%</strong></div>
                      <div className="progress"><i style={{ width: `${item.progress_percent}%` }} /></div>
                      <Link href={`/courses/${item.course.id}`}><span className={`play ${style.color}`}><Play weight="fill" /></span><span><small>{item.status === "completed" ? "Kurs tugallangan" : "O‘qishni davom ettiring"}</small><strong>{item.status === "completed" ? "Qayta ko‘rish" : "Davom ettirish"}</strong></span><ArrowRight /></Link>
                    </div>
                  </article>;
                })}
                {visibleCourses.length === 0 && <div className="emptyState"><MagnifyingGlass /><h3>{query ? "Kurs topilmadi" : "Sizga kurs biriktirilmagan"}</h3><p>{query ? "Boshqa kalit so‘z bilan qidiring." : "Administrator kurs biriktirgach shu yerda paydo bo‘ladi."}</p></div>}
              </div>
            </section>

            <aside className="rightRail">
              <section className="tasksCard">
                <div className="sectionHead"><div><h2>Yaqin topshiriqlar</h2><p>Muddatlarni o‘tkazib yubormang</p></div><Link className="iconButton" href="/assignments"><ArrowRight /></Link></div>
                <div className="taskList">
                  {pendingAssignments.slice(0, 3).map((task, index) => {
                    const urgent = Boolean(task.due_at && new Date(task.due_at).getTime() - currentTime < 24 * 60 * 60 * 1000);
                    return <Link className="task" key={task.id} href={`/assignments/${task.id}`}>
                      <span className={`dateBadge d${index}`}>{task.due_at ? <><strong>{dayNumber(task.due_at)}</strong><small>{monthName(task.due_at)}</small></> : <><strong>—</strong><small>MUD</small></>}</span>
                      <span className="taskInfo"><strong>{task.title}</strong><small>{task.course_title}</small><em className={urgent ? "urgent" : ""}><Clock weight="fill" />{dueLabel(task.due_at, currentTime)}</em></span>
                      <ArrowRight className="taskArrow" />
                    </Link>;
                  })}
                  {pendingAssignments.length === 0 && <div className="railEmpty"><Check weight="bold" /><strong>Yaqin vazifa yo‘q</strong><small>Barcha topshiriqlar yuborilgan.</small></div>}
                </div>
              </section>

              <section className="activityCard">
                <div className="sectionHead"><div><h2>Kurslar progressi</h2><p>O‘zlashtirish ko‘rsatkichlari</p></div><Link href="/results">Natijalar <ArrowRight /></Link></div>
                {courses.length > 0 ? <>
                  <div className="chart">
                    <div className="yLabels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0</span></div>
                    <div className="bars">{courses.slice(0, 7).map((item, index) => <div key={item.enrollment_id}><i className={item.progress_percent === Math.max(...courses.map((course) => course.progress_percent)) ? "peak" : ""} style={{ height: `${item.progress_percent}%` }} /><small>K{index + 1}</small></div>)}</div>
                  </div>
                  <div className="chartFooter"><span><b>{averageProgress}%</b><small>O‘rtacha progress</small></span><span><b className="positive">{analytics?.summary.completed_courses ?? 0} ta</b><small>Tugallangan kurs</small></span></div>
                </> : <div className="railEmpty"><ChartBar weight="duotone" /><strong>Progress hali yo‘q</strong><small>Kurs biriktirilgach ko‘rsatkichlar chiqadi.</small></div>}
              </section>
            </aside>
          </div>
        </div>
      </section>

      <nav className="mobileNav">
        {navItems.slice(0, 5).map(({ label, icon: Icon, href }) => <Link key={label} className={href === "/" ? "active" : ""} href={href}><Icon weight={href === "/" ? "fill" : "regular"} /><small>{label.split(" ")[0]}</small></Link>)}
      </nav>
    </main>
  );
}
