# Ma’rifat LMS

O‘zbek tilidagi zamonaviy LMS platformasi. Haqiqiy FastAPI autentifikatsiyasi, rolga asoslangan ruxsatlar, Super Admin paneli, foydalanuvchilar, kurslar va darslar boshqaruvi ishlaydi.

## Texnologiyalar

- Next.js 16 va React 19
- TypeScript va Tailwind CSS
- FastAPI va PostgreSQL backend
- Firebase bildirishnomalari
- Cloudflare orqali HTTPS, CDN va WAF

## Ishga tushirish

```bash
cp .env.example .env.local
npm install
npm run dev
```

Brauzerda `http://localhost:3000` manzilini oching. Lokal backendning standart manzili `http://127.0.0.1:8000`.

## Lokal boshqaruv paneli

Butun lokal platformani ishga tushirish:

```powershell
& "D:\LMS-Server\config\start-lms.ps1"
```

- Platforma: `http://127.0.0.1:3000`
- Login: `http://127.0.0.1:3000/login`
- Admin panel: `http://127.0.0.1:3000/admin`
- Kurslar katalogi: `http://127.0.0.1:3000/courses`
- Kurslar boshqaruvi: `http://127.0.0.1:3000/admin/courses`
- Multimedia kutubxonasi: `http://127.0.0.1:3000/admin/materials`
- Kursga biriktirish: `http://127.0.0.1:3000/admin/enrollments`
- Talabaning kurslari: `http://127.0.0.1:3000/my-courses`
- Dastlabki Super Admin: `admin@marifat.uz`
- Bir martalik boshlang‘ich parol faqat lokal `D:\LMS-Server\secrets\initial-super-admin.env` faylida saqlanadi.

GitHub Pages manzili production LMS emas. Dinamik login va admin paneli Next.js runtime hamda FastAPI serverini talab qiladi.

## Kurslar moduli

- Kurslar avval `draft` holatida yaratiladi.
- Kursni nashr qilish uchun kamida bitta nashr qilingan dars kerak.
- Faqat `published` kurslar umumiy katalogda ko‘rinadi.
- Video va jonli dars havolalari faqat HTTPS orqali qabul qilinadi.
- Barcha kurs va dars yaratish amallari serverda admin roli va CSRF token bilan tekshiriladi.

## Multimedia materiallari

- YouTube havolalari `youtube-nocookie.com` embed formatiga normallashtiriladi.
- Video: `.mp4`, `.webm` — 512 MB gacha.
- Audio: `.mp3`, `.m4a`, `.wav` — 100 MB gacha.
- Hujjat: `.pdf`, `.docx`, `.pptx`, `.xlsx` — 50 MB gacha.
- Gamifikatsiya/o‘yin va qo‘shimcha havolalar faqat HTTPS orqali qabul qilinadi.
- Fayl nomi va brauzer yuborgan MIME qiymatiga ishonilmaydi; haqiqiy format serverda tekshiriladi.
- Fayllar `D:\LMS-Server\uploads\course-materials` ichida tasodifiy nom bilan saqlanadi va faqat autentifikatsiyalangan API orqali uzatiladi.

## Talabalarni kursga biriktirish va progress

- Administrator faol talabani kursga biriktiradi va biriktirishni vaqtincha to‘xtata oladi.
- Talaba faqat o‘ziga biriktirilgan faol yoki tugallangan kurs darslari va fayllarini ko‘ra oladi.
- “Darsni yakunlash” amali CSRF himoyasi bilan serverda saqlanadi.
- Progress nashr qilingan darslar soniga nisbatan avtomatik hisoblanadi; barcha darslar tugaganda kurs `completed` holatiga o‘tadi.
- Talabaning “Mening kurslarim” kabinetida joriy foiz va kurs holati ko‘rsatiladi.

## Arxitektura chegarasi

Bu repository faqat frontend kodi va xavfsiz hujjatlarni saqlaydi. Backend kodi, PostgreSQL ma’lumotlari, foydalanuvchi yuklamalari, loglar, zaxira nusxalari va barcha sirlar `D:\LMS-Server` hududida saqlanadi va GitHub’ga yuborilmaydi.

Production frontend statik GitHub Pages emas, qat’iy nonce asosidagi CSP’ni qo‘llaydigan Next.js runtime orqali chiqariladi. Tashqi trafik Cloudflare HTTPS/WAF orqali keladi, backend va PostgreSQL esa internetga bevosita ochilmaydi.

Xavfsizlik talablari [SECURITY.md](./SECURITY.md) faylida yozilgan.
