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
- To‘lovlar boshqaruvi: `http://127.0.0.1:3000/admin/payments`
- Taqvim boshqaruvi: `http://127.0.0.1:3000/admin/calendar`
- Resurslar boshqaruvi: `http://127.0.0.1:3000/admin/resources`
- Bildirishnomalar boshqaruvi: `http://127.0.0.1:3000/admin/notifications`
- Yordam markazi boshqaruvi: `http://127.0.0.1:3000/admin/support`
- O‘qituvchi kabineti: `http://127.0.0.1:3000/teacher`
- O‘qituvchi kontent boshqaruvi: `/teacher/courses/{course_id}/manage`
- Talabaning kurslari: `http://127.0.0.1:3000/my-courses`
- Talabaning testlari: `http://127.0.0.1:3000/assessments`
- Talabaning uy vazifalari: `http://127.0.0.1:3000/assignments`
- Talabaning natijalari: `http://127.0.0.1:3000/results`
- Talabaning to‘lovlari: `http://127.0.0.1:3000/payments`
- Talabaning taqvimi: `http://127.0.0.1:3000/calendar`
- Elektron resurslar: `http://127.0.0.1:3000/resources`
- Bildirishnomalar markazi: `http://127.0.0.1:3000/notifications`
- Texnik yordam markazi: `http://127.0.0.1:3000/help`
- Dastlabki Super Admin: `admin@marifat.uz`
- Bir martalik boshlang‘ich parol faqat lokal `D:\LMS-Server\secrets\initial-super-admin.env` faylida saqlanadi.

GitHub Pages manzili production LMS emas. Dinamik login va admin paneli Next.js runtime hamda FastAPI serverini talab qiladi.

## Kurslar moduli

- Kurslar avval `draft` holatida yaratiladi.
- Kursni nashr qilish uchun kamida bitta nashr qilingan dars kerak.
- Faqat `published` kurslar umumiy katalogda ko‘rinadi.
- Video va jonli dars havolalari faqat HTTPS orqali qabul qilinadi.
- Barcha kurs va dars yaratish amallari serverda admin roli va CSRF token bilan tekshiriladi.

## Haqiqiy talaba dashboardi

- Bosh sahifa faqat autentifikatsiyalangan talaba uchun ochiladi; administrator va o‘qituvchi o‘z kabinetiga yo‘naltiriladi.
- Talaba ismi, kurslar, progress, test natijalari, tugallangan darslar, yaqin vazifalar, taqvim va o‘qilmagan bildirishnomalar API orqali PostgreSQL’dan olinadi.
- Qidiruv faqat talabaning o‘ziga biriktirilgan kurslarida ishlaydi va kurs kartalari haqiqiy progressni ko‘rsatadi.
- Soxta foydalanuvchi, kurs, vazifa, statistika va faollik grafiklari olib tashlangan.

## O‘qituvchi kabineti

- O‘qituvchi tizimga kirganda avtomatik ravishda `/teacher` kabinetiga yo‘naltiriladi.
- Kabinetda faqat shu o‘qituvchiga biriktirilgan kurslar, talabalar soni, o‘rtacha progress, test natijalari va tekshirilmagan vazifalar ko‘rsatiladi.
- Kurs sahifasida har bir talabaning dars progressi, test o‘rtachasi va uy vazifalari holati kuzatiladi.
- O‘qituvchi yuborilgan hujjatni ruxsat bilan yuklab olib, maksimal ball chegarasida baho va izoh qoldiradi.
- O‘qituvchi o‘z kursiga matnli, video yoki jonli dars qo‘shadi; test yaratib savol va variantlarni kiritadi; uy vazifasi, muddat va maksimal ballni belgilaydi.
- Har bir darsga YouTube, tashqi video/audio, gamifikatsiya havolasi yoki PDF, DOCX, PPTX, XLSX, MP3, M4A, WAV, MP4 va WebM fayli qo‘shishi mumkin.
- O‘qituvchi faqat o‘z kursidagi materiallarni ko‘radi va o‘chiradi; yuklangan fayllar autentifikatsiyalangan API orqali uzatiladi.
- Test va vazifalar qoralama sifatida yaratiladi va alohida nashr qilingandagina talabaga ko‘rinadi.
- Ma’lumotlarni kurs egasi bo‘yicha filtrlash frontendga emas, FastAPI’dagi rol va `teacher_id` tekshiruviga tayanadi.

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

## Moliyaviy hisob va to‘lovlar

- Kurs narxi so‘mda belgilanadi; `0` qiymati bepul kursni bildiradi.
- Pullik kursga talaba biriktirilganda uning nomiga `pending` holatidagi hisob avtomatik yaratiladi.
- Administrator qo‘lda hisob yaratishi, to‘lov usuli va provayder operatsiya raqami bilan to‘lovni tasdiqlashi, hisobni bekor qilishi yoki to‘lovni qaytarilgan deb belgilashi mumkin.
- Talaba faqat o‘z hisoblari va to‘lov tarixini ko‘radi.
- Click, Payme va Uzum usullari ma’lumot modelida tayyor, lekin provayder webhooklari ulanmaguncha to‘lovlar administrator tomonidan tasdiqlanadi.

## Taqvim va o‘quv jadvali

- Administrator kurs uchun jonli dars, imtihon, uchrashuv yoki muhim muddat yaratadi va talabalarga nashr qiladi.
- Boshlanish va tugash vaqti tekshiriladi, tashqi uchrashuv havolalari faqat HTTPS orqali qabul qilinadi.
- Talaba faqat o‘zi biriktirilgan kurslarning nashr qilingan tadbirlarini ko‘radi.
- Nashr qilingan uy vazifalarining topshirish muddatlari talaba taqvimiga avtomatik qo‘shiladi.
- Taqvim ma’lumotlari keyingi Telegram eslatmalari integratsiyasi uchun tayyor asos hisoblanadi.

## Elektron resurslar kutubxonasi

- Administrator yo‘nalishlar bo‘yicha mustaqil resurs guruhlarini yaratadi.
- Har bir guruhga darslik, metodik qo‘llanma, tavsiya, taqdimot yoki boshqa turdagi resurs joylanadi.
- PDF, DOCX, PPTX va XLSX fayllari 50 MB gacha qabul qilinadi va fayl imzosi yoki Office konteyner tuzilmasi serverda tekshiriladi.
- Tashqi elektron resurslar faqat HTTPS havola orqali qo‘shiladi; lokal va xususiy IP manzillari rad etiladi.
- Guruh va har bir resurs alohida nashr qilinadi. Foydalanuvchi faqat ikkala darajada ham nashr qilingan materiallarni ko‘radi.
- Kutubxonada yo‘nalish bo‘yicha filtrlash va matnli qidiruv ishlaydi.

## Bildirishnomalar markazi

- Administrator barcha foydalanuvchilar, talabalar, o‘qituvchilar yoki administratorlar uchun e’lon yaratadi.
- E’lonni muayyan kursga bog‘lash, oddiy, muhim yoki shoshilinch ustuvorlik berish va amal qilish muddatini belgilash mumkin.
- Bildirishnomalar avval qoralama holatida yaratiladi va faqat alohida nashr qilingandan keyin tegishli foydalanuvchilarga ko‘rinadi.
- Kursga bog‘langan xabarni talaba faqat shu kursga faol biriktirilgan bo‘lsa ko‘radi.
- Har bir foydalanuvchining o‘qilganlik holati PostgreSQL bazasida alohida saqlanadi; bitta yoki barcha xabarni o‘qildi deb belgilash mumkin.
- Xabardagi amal tugmasi faqat platforma ichidagi xavfsiz yo‘lga yo‘naltiriladi. Ushbu modul keyingi Telegram yetkazib berish kanali uchun asos bo‘ladi.

## Yordam markazi va texnik ko‘mak

- Administrator kategoriyalar bo‘yicha FAQ savol-javoblarini qoralama sifatida yaratadi va alohida nashr qiladi.
- Foydalanuvchi nashr qilingan yo‘riqnomalarni qidiradi yoki texnik yordamga yangi murojaat yuboradi.
- Har bir murojaat ichida foydalanuvchi va yordam xizmati o‘rtasidagi yozishmalar, ustuvorlik va holat tarixi saqlanadi.
- Administrator murojaatni `yangi`, `jarayonda`, `hal qilindi` yoki `yopildi` holatida boshqaradi.
- Hal qilingan murojaatga foydalanuvchi yana yozsa u qayta ochiladi; yopilgan murojaatga yangi xabar qo‘shilmaydi.

## Arxitektura chegarasi

Bu repository faqat frontend kodi va xavfsiz hujjatlarni saqlaydi. Backend kodi, PostgreSQL ma’lumotlari, foydalanuvchi yuklamalari, loglar, zaxira nusxalari va barcha sirlar `D:\LMS-Server` hududida saqlanadi va GitHub’ga yuborilmaydi.

Production frontend statik GitHub Pages emas, qat’iy nonce asosidagi CSP’ni qo‘llaydigan Next.js runtime orqali chiqariladi. Tashqi trafik Cloudflare HTTPS/WAF orqali keladi, backend va PostgreSQL esa internetga bevosita ochilmaydi.

Xavfsizlik talablari [SECURITY.md](./SECURITY.md) faylida yozilgan.
