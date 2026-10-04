import { ArrowLeft, BookOpen, CalendarBlank, ChartBar, CreditCard, Exam, Question, Users } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "./styles.module.css";

const sections = {
  courses: { title: "Kurslar", description: "Kurslar katalogi va o‘quv dasturlari shu bo‘limda boshqariladi.", icon: BookOpen },
  assignments: { title: "Topshiriqlar", description: "Vazifalar, topshirish muddatlari va baholash jarayoni.", icon: Exam },
  calendar: { title: "Taqvim", description: "Darslar, imtihonlar va muhim sanalar taqvimi.", icon: CalendarBlank },
  results: { title: "Natijalar", description: "O‘zlashtirish ko‘rsatkichlari va yakuniy baholar.", icon: ChartBar },
  payments: { title: "To‘lovlar", description: "To‘lov holati, hisob-fakturalar va moliyaviy tarix.", icon: CreditCard },
  help: { title: "Yordam markazi", description: "Platformadan foydalanish bo‘yicha savol va yo‘riqnomalar.", icon: Question },
  users: { title: "Foydalanuvchilar", description: "Talabalar, o‘qituvchilar va administratorlar boshqaruvi.", icon: Users },
} as const;

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section as keyof typeof sections];
  if (!item) notFound();
  const Icon = item.icon;

  return (
    <main className={styles.shell}>
      <header><Link href="/" className={styles.brand}><BookOpen weight="fill" />ma&apos;rifat</Link><Link href="/login" className={styles.login}>Boshqaruvga kirish</Link></header>
      <section className={styles.content}>
        <Link href="/" className={styles.back}><ArrowLeft /> Bosh sahifa</Link>
        <span className={styles.icon}><Icon weight="duotone" /></span>
        <p>MA&apos;RIFAT LMS MODULI</p>
        <h1>{item.title}</h1>
        <div>{item.description}</div>
        <article><b>1-bosqich faol</b><span>Marshrut ishlayapti. Ushbu modulning ma&apos;lumotlar bazasi va boshqaruv amallari keyingi ishlab chiqish bosqichida ulanadi.</span></article>
      </section>
    </main>
  );
}
