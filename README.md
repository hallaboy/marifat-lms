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
- Testlar boshqaruvi: `http://127.0.0.1:3000/admin/assessments`
- Uy vazifalari boshqaruvi: `http://127.0.0.1:3000/admin/assignments`
- Admin analitikasi: `http://127.0.0.1:3000/admin/analytics`
- Talabaning kurslari: `http://127.0.0.1:3000/my-courses`
- Talabaning testlari: `http://127.0.0.1:3000/assessments`
- Talabaning uy vazifalari: `http://127.0.0.1:3000/assignments`
- Talabaning natijalari: `http://127.0.0.1:3000/results`
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
- Video egasi tashqi saytda ko‘rsatishni cheklagan holatda talaba uchun xavfsiz “YouTube’da ochish” fallback tugmasi ko‘rsatiladi.
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

## Onlayn test va imtihonlar

- Yangi kurs yaratishda “Kurs bilan birga quiz yaratish” bosqichini yoqish mumkin.
- Kurs muharririning o‘zida quiz nomi, o‘tish bali, urinishlar soni va vaqt chegarasi sozlanadi.
- Yaratilgan quizdan savollar muharririga to‘g‘ridan-to‘g‘ri o‘tiladi.
- Administrator kurs uchun test yoki imtihon yaratadi, savollar va 2–6 ta javob variantini kiritadi.
- Har bir savolda aynan bitta to‘g‘ri javob serverda saqlanadi va talaba API’siga yuborilmaydi.
- O‘tish bali, vaqt chegarasi va ruxsat etilgan urinishlar soni sozlanadi.
- Talaba faqat o‘ziga biriktirilgan kursning nashr qilingan testlarini ishlaydi.
- Natija serverda avtomatik hisoblanadi, takroriy yuborish va begona urinish identifikatorlari bloklanadi.

## Uy vazifalari

- Administrator kurs uchun topshiriq, maksimal ball, muddat va kech yuborish qoidasini belgilaydi.
- Talaba javob matni va PDF, DOCX, PPTX yoki XLSX hujjatini yuborishi mumkin.
- Baholanmagan javobni yangilash mumkin; baholangandan keyin javob o‘zgartirilmaydi.
- Administrator yuborilgan faylni ko‘rib, ball va izoh beradi; natija talaba kabinetida ko‘rinadi.
- Topshiriq fayllari statik ochilmaydi va faqat ruxsati bor foydalanuvchiga API orqali beriladi.

## Analitika va natijalar

- Administrator umumiy kurs progressi, yakunlangan darslar, testlarning o‘rtacha bali va o‘tish ko‘rsatkichi hamda vazifalar bahosini kuzatadi.
- Kurslar kesimidagi jadval biriktirilgan va kursni yakunlagan talabalar sonini, o‘rtacha progressni, test va vazifa faolligini ko‘rsatadi.
- Talaba faqat o‘z kurs progressi, so‘nggi test urinishlari va yuborgan vazifalari natijalarini ko‘ra oladi.
- Hisobot qiymatlari brauzerda hisoblanmaydi; ular PostgreSQL ma’lumotlari asosida backendda shakllantiriladi.

## Arxitektura chegarasi

Bu repository faqat frontend kodi va xavfsiz hujjatlarni saqlaydi. Backend kodi, PostgreSQL ma’lumotlari, foydalanuvchi yuklamalari, loglar, zaxira nusxalari va barcha sirlar `D:\LMS-Server` hududida saqlanadi va GitHub’ga yuborilmaydi.

Production frontend statik GitHub Pages emas, qat’iy nonce asosidagi CSP’ni qo‘llaydigan Next.js runtime orqali chiqariladi. Tashqi trafik Cloudflare HTTPS/WAF orqali keladi, backend va PostgreSQL esa internetga bevosita ochilmaydi.

Xavfsizlik talablari [SECURITY.md](./SECURITY.md) faylida yozilgan.
