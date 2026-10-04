"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarBlank,
  CaretDown,
  ChartBar,
  Check,
  ClipboardText,
  Clock,
  CreditCard,
  Exam,
  Fire,
  House,
  List,
  MagnifyingGlass,
  Medal,
  Play,
  Question,
  Sparkle,
  X,
} from "@phosphor-icons/react";

type Course = {
  id: number;
  category: string;
  title: string;
  mentor: string;
  initials: string;
  color: string;
  gradient: string;
  progress: number;
  lessons: string;
  next: string;
};

const courses: Course[] = [
  { id: 1, category: "Dasturlash", title: "Frontend dasturlash: React.js", mentor: "Azizbek Rahimov", initials: "AR", color: "violet", gradient: "violetArt", progress: 72, lessons: "18 / 25 dars", next: "Keyingi: React Hooks" },
  { id: 2, category: "Dizayn", title: "UI/UX dizayn asoslari", mentor: "Madina Yusupova", initials: "MY", color: "orange", gradient: "orangeArt", progress: 48, lessons: "12 / 25 dars", next: "Keyingi: Auto Layout" },
  { id: 3, category: "Marketing", title: "Raqamli marketing strategiyasi", mentor: "Sardor Karimov", initials: "SK", color: "blue", gradient: "blueArt", progress: 31, lessons: "7 / 22 dars", next: "Keyingi: Content plan" },
];

const navItems = [
  { label: "Bosh sahifa", icon: House, href: "/" },
  { label: "Kurslarim", icon: BookOpen, href: "/my-courses" },
  { label: "Testlar", icon: Exam, href: "/assessments" },
  { label: "Uy vazifalari", icon: ClipboardText, badge: 3, href: "/assignments" },
  { label: "Taqvim", icon: CalendarBlank, href: "/calendar" },
  { label: "Natijalar", icon: ChartBar, href: "/results" },
];

const tasks = [
  { title: "React komponentlari", course: "Frontend dasturlash", date: "Bugun, 23:59", type: "Vazifa", urgent: true },
  { title: "Foydalanuvchi tadqiqoti", course: "UI/UX dizayn asoslari", date: "Ertaga, 18:00", type: "Topshiriq", urgent: false },
  { title: "Marketing asoslari", course: "Raqamli marketing", date: "28-may, 15:00", type: "Test", urgent: false },
];

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const filteredCourses = useMemo(() => courses.filter((course) =>
    `${course.title} ${course.mentor} ${course.category}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  return (
    <main className="appShell">
      <aside className={`sidebar ${menuOpen ? "sidebarOpen" : ""}`}>
        <div className="brand"><span className="brandMark"><BookOpen weight="fill" /></span><span>ma&apos;rifat</span></div>
        <button className="closeMenu" onClick={() => setMenuOpen(false)} aria-label="Menyuni yopish"><X /></button>
        <nav className="mainNav" aria-label="Asosiy menyu">
          <p className="navLabel">MENYU</p>
          {navItems.map(({ label, icon: Icon, badge, href }) => (
            <Link key={label} className={href === "/" ? "navItem active" : "navItem"} href={href} onClick={() => setMenuOpen(false)}>
              <Icon size={21} weight={href === "/" ? "fill" : "regular"} /><span>{label}</span>{badge && <b>{badge}</b>}
            </Link>
          ))}
          <p className="navLabel second">BOSHQALAR</p>
          <Link className="navItem" href="/payments"><CreditCard size={21} /><span>To‘lovlar</span></Link>
          <Link className="navItem" href="/help"><Question size={21} /><span>Yordam markazi</span></Link>
        </nav>
        <div className="upgradeCard">
          <span className="spark"><Sparkle weight="fill" /></span>
          <h3>Bilimingizni oshiring!</h3>
          <p>Yangi kurslarni kashf eting va imkoniyatlaringizni kengaytiring.</p>
          <Link href="/courses">Kurslarni ko‘rish <ArrowRight /></Link>
        </div>
        <Link className="sideProfile" href="/login">
          <span className="avatar avatarPhoto">AM</span>
          <span><strong>Aziza Mirzayeva</strong><small>Talaba</small></span>
          <CaretDown />
        </Link>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Menyuni yopish" />}

      <section className="workspace">
        <header className="topbar">
          <button className="mobileMenu" onClick={() => setMenuOpen(true)} aria-label="Menyuni ochish"><List /></button>
          <label className="searchBox"><MagnifyingGlass /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kurslar, darslar yoki topshiriqlarni qidiring..." /></label>
          <button className="notification" onClick={() => setNoticeOpen((value) => !value)} aria-label="Bildirishnomalar"><Bell /><i /></button>
          <Link className="headerProfile" href="/login"><span className="avatar avatarPhoto">MA</span><span><strong>Tizimga kirish</strong><small>Boshqaruv paneli</small></span><CaretDown /></Link>
          {noticeOpen && (
            <div className="noticePanel">
              <div><strong>Bildirishnomalar</strong><span>2 ta yangi</span></div>
              <p><b>Yangi dars ochildi</b><small>React Hooks • 12 daqiqa oldin</small></p>
              <p><b>Vazifa muddati yaqin</b><small>React komponentlari • Bugun</small></p>
            </div>
          )}
        </header>

        <div className="content">
          <section className="welcomeRow">
            <div><p className="eyebrow">SESHANBA, 27-MAY</p><h1>Xush kelibsiz, Aziza! <span>👋</span></h1><p>Bugun o‘rganish uchun ajoyib kun. Keling, davom etamiz!</p></div>
            <div className="streak"><span><Fire weight="fill" /></span><div><strong>12 kun</strong><small>Uzluksiz ta&apos;lim</small></div><div className="miniWeek"><i>D</i><i>S</i><i className="today">C</i><i>P</i><i>J</i></div></div>
          </section>

          <section className="statsGrid">
            <article><span className="statIcon purple"><BookOpen weight="duotone" /></span><div><small>Faol kurslar</small><strong>4 <em>ta</em></strong><p><b>+1</b> bu oyda</p></div></article>
            <article><span className="statIcon green"><Clock weight="duotone" /></span><div><small>O‘qish vaqti</small><strong>24.5 <em>soat</em></strong><p><b>+3.2 soat</b> bu hafta</p></div></article>
            <article><span className="statIcon amber"><Medal weight="duotone" /></span><div><small>O‘rtacha natija</small><strong>86 <em>%</em></strong><p><b>+4%</b> o‘tgan oyga</p></div></article>
            <article><span className="statIcon blue"><Check weight="bold" /></span><div><small>Tugallangan</small><strong>37 <em>dars</em></strong><p><b>+8</b> bu hafta</p></div></article>
          </section>

          <div className="mainGrid">
            <section className="coursesSection">
              <div className="sectionHead"><div><h2>Kurslarim</h2><p>O‘rganishni davom ettiring</p></div><Link href="/my-courses">Barchasini ko‘rish <ArrowRight /></Link></div>
              <div className="courseGrid">
                {filteredCourses.map((course) => (
                  <article className="courseCard" key={course.id}>
                    <div className={`courseArt ${course.gradient}`}><span>{course.category}</span><div className="artShape"><i /><i /><i /></div></div>
                    <div className="courseBody">
                      <h3>{course.title}</h3>
                      <div className="mentor"><span className={`avatar ${course.color}`}>{course.initials}</span><small>{course.mentor}</small></div>
                      <div className="progressMeta"><span>{course.lessons}</span><strong>{course.progress}%</strong></div>
                      <div className="progress"><i style={{ width: `${course.progress}%` }} /></div>
                      <Link href="/my-courses"><span className={`play ${course.color}`}><Play weight="fill" /></span><span><small>{course.next}</small><strong>Davom ettirish</strong></span><ArrowRight /></Link>
                    </div>
                  </article>
                ))}
                {filteredCourses.length === 0 && <div className="emptyState"><MagnifyingGlass /><h3>Kurs topilmadi</h3><p>Boshqa kalit so‘z bilan qidiring.</p></div>}
              </div>
            </section>

            <aside className="rightRail">
              <section className="tasksCard">
                <div className="sectionHead"><div><h2>Yaqin topshiriqlar</h2><p>Muddatlarni o‘tkazib yubormang</p></div><button className="iconButton"><ArrowRight /></button></div>
                <div className="taskList">
                  {tasks.map((task, index) => {
                    const done = completedTasks.includes(task.title);
                    return <button className={`task ${done ? "done" : ""}`} key={task.title} onClick={() => setCompletedTasks((current) => done ? current.filter((item) => item !== task.title) : [...current, task.title])}>
                      <span className={`dateBadge d${index}`}><strong>{index === 0 ? "27" : index === 1 ? "28" : "30"}</strong><small>MAY</small></span>
                      <span className="taskInfo"><strong>{task.title}</strong><small>{task.course}</small><em className={task.urgent ? "urgent" : ""}><Clock weight="fill" />{done ? "Bajarildi" : task.date}</em></span>
                      <span className="checkCircle">{done && <Check weight="bold" />}</span>
                    </button>;
                  })}
                </div>
              </section>

              <section className="activityCard">
                <div className="sectionHead"><div><h2>Haftalik faollik</h2><p>O‘qishga sarflangan vaqt</p></div><button className="period">Bu hafta <CaretDown /></button></div>
                <div className="chart">
                  <div className="yLabels"><span>4s</span><span>3s</span><span>2s</span><span>1s</span><span>0</span></div>
                  <div className="bars">{[45, 67, 42, 88, 58, 28, 12].map((height, index) => <div key={index}><i className={index === 3 ? "peak" : ""} style={{ height: `${height}%` }} /><small>{["D", "S", "C", "P", "J", "S", "Y"][index]}</small></div>)}</div>
                </div>
                <div className="chartFooter"><span><b>6.4 soat</b><small>Jami bu hafta</small></span><span><b className="positive">+18%</b><small>O‘tgan haftaga</small></span></div>
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
