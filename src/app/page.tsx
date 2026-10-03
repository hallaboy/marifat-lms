export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <main className="w-full max-w-4xl py-24">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
          LMS platformasi
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Zamonaviy ta’lim uchun xavfsiz raqamli muhit
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
          Kurslar, darslar, topshiriqlar, testlar va natijalarni yagona
          platformada boshqarish uchun yangi loyiha tayyorlanmoqda.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["O‘quvchi", "Kurslar va shaxsiy rivojlanish ko‘rsatkichlari"],
            ["O‘qituvchi", "Darslar, testlar va topshiriqlar boshqaruvi"],
            ["Administrator", "Rollar, to‘lovlar va to‘liq analitika"],
          ].map(([title, description]) => (
            <section
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="font-semibold text-cyan-200">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {description}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
