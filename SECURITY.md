# Xavfsizlik siyosati

## Sirlar

- `.env`, token, parol, shaxsiy kalit va xizmat hisobi fayllari Git'ga kiritilmaydi.
- Faqat `.env.example` ichida xavfsiz namuna qiymatlar saqlanadi.
- Production sirlari Cloudflare yoki deployment platformasining secret storage xizmatida turadi.

## Autentifikatsiya

- Sessiya tokenlari JavaScript orqali o‘qilmaydigan `HttpOnly`, `SameSite` cookie'da saqlanadi; production HTTPS muhitida `Secure` majburiy yoqiladi.
- Parollar faqat backendda Argon2id yordamida xeshlanadi.
- Rollar va ruxsatlar backend tomonidan har bir so‘rovda tekshiriladi.
- Holatni o‘zgartiruvchi so‘rovlar CSRF token va ruxsat etilgan `Origin` bilan tekshiriladi.
- Besh marta noto‘g‘ri parol kiritilganda hisob vaqtincha bloklanadi.
- Login, logout va administrator amallari audit jurnaliga yoziladi.

## Fayl yuklash

- Ruxsat etilmagan bajariluvchi va skript fayllari qabul qilinmaydi.
- PDF, Office, audio va video formatlari fayl imzosi/konteyner tuzilmasi bo‘yicha tekshiriladi.
- Saqlash kalitlari tasodifiy yaratiladi; foydalanuvchi fayl nomi disk yo‘li sifatida ishlatilmaydi.
- Fayllar hajmi turiga qarab cheklanadi va SHA-256 nazorat summasi yoziladi.
- Lokal material fayllari statik katalog sifatida ochilmaydi; yuklab olishda sessiya va kurs ruxsati tekshiriladi.

## Kursga kirish nazorati

- Talabaning kurs, dars va fayllarga kirishi backenddagi amaldagi enrollment yozuvi bilan tekshiriladi.
- `suspended` holatidagi yoki kursga biriktirilmagan talaba dars mazmunini ololmaydi.
- Progress faqat tizimga kirgan talabaning o‘z enrollment yozuviga va CSRF bilan himoyalangan so‘rov orqali yoziladi.
- Kursga biriktirish va uning holatini o‘zgartirish faqat administrator roliga ruxsat etilgan va audit jurnaliga yoziladi.

## Test xavfsizligi

- To‘g‘ri javob belgisi faqat backend va PostgreSQL bazasida saqlanadi; talaba uchun savol javobida bu maydon yo‘q.
- Testni boshlash va topshirish CSRF, foydalanuvchi roli hamda kursga biriktirilganlik bilan tekshiriladi.
- Vaqt chegarasi va urinishlar limiti brauzerga ishonmasdan server vaqtida nazorat qilinadi.
- Javob varianti aynan yuborilgan savolga tegishli ekanligi serverda tekshiriladi.
- Bir urinishni qayta topshirish va boshqa talabaning urinishidan foydalanish bloklanadi.

## Uy vazifalari xavfsizligi

- Topshiriq fayllari kengaytma, fayl imzosi va Office konteyner tuzilmasi bo‘yicha tekshiriladi.
- Talaba faqat o‘z javob faylini, administrator yoki kurs o‘qituvchisi esa tekshirishi kerak bo‘lgan faylni oladi.
- Fayllar `assignment-submissions` hududida tasodifiy nom bilan saqlanadi; foydalanuvchi nomi disk yo‘liga aylantirilmaydi.
- Muddat, kech yuborish va maksimal ball cheklovlari backendda tekshiriladi.
- Baholangan javobni talaba qayta yubora olmaydi; yuborish va baholash amallari audit jurnaliga yoziladi.

## Analitika xavfsizligi

- Tizim miqyosidagi analitika faqat `super_admin` va `admin` rollariga beriladi.
- Talaba analitikasi foydalanuvchining serverdagi sessiya identifikatoriga bog‘lanadi va faqat uning o‘z enrollment, test hamda vazifa yozuvlarini qamrab oladi.
- Frontenddagi yo‘naltirish qo‘shimcha qulaylik hisoblanadi; asosiy rol va ma’lumotlarga kirish nazorati har bir API so‘rovida backendda bajariladi.
- O‘qituvchi analitikasi faqat `teacher` roliga beriladi va barcha kurs, talaba, test hamda topshiriq so‘rovlari serverda `courses.teacher_id` bilan cheklanadi.
- Boshqa o‘qituvchiga tegishli kurs yoki topshiriq identifikatori yuborilsa, mavjudlik haqida ma’lumot sizib chiqmasligi uchun `404` qaytariladi.

## To‘lovlar xavfsizligi

- Moliyaviy hisob yaratish, tasdiqlash, bekor qilish va qaytarish faqat administrator roli hamda CSRF tekshiruvidan keyin bajariladi.
- Talaba API’si sessiyadagi foydalanuvchi identifikatori orqali faqat uning enrollment yozuvlariga tegishli hisoblarni qaytaradi.
- Tasdiqlangan to‘lov oddiy `pending` yoki `cancelled` holatiga qaytarilmaydi; faqat auditlanadigan `refunded` jarayoni mavjud.
- Provayder operatsiya raqami takrorlanmaydi va serverda ruxsat etilgan belgilar bo‘yicha tekshiriladi.
- Karta rekvizitlari, CVV yoki to‘liq karta raqami platforma bazasida saqlanmaydi.

## Taqvim xavfsizligi

- Taqvim tadbirlarini yaratish, nashr qilish va o‘chirish admin roli hamda CSRF himoyasi bilan cheklangan.
- Talaba taqvim so‘rovi serverdagi enrollment yozuvlari bo‘yicha filtrlanadi; boshqa kurs tadbirlari qaytarilmaydi.
- Qoralama tadbirlar talaba API’siga kiritilmaydi.
- Jonli dars va uchrashuv havolalari faqat HTTPS bo‘lsa saqlanadi.

## Resurslar kutubxonasi xavfsizligi

- Resurs guruhlari va materiallarini yaratish, nashr qilish yoki o‘chirish faqat administrator va CSRF himoyasi bilan bajariladi.
- Foydalanuvchilar faqat nashr qilingan guruhlardagi nashr qilingan resurslarni oladi; qoralama material identifikator orqali ham ochilmaydi.
- Kutubxona fayllari statik papka sifatida ochilmaydi va autentifikatsiyalangan API orqali beriladi.
- Fayl kengaytmasiga ishonilmaydi: PDF imzosi va Office ZIP konteyneri serverda tekshiriladi.
- Tashqi havolalarda HTTPS, host, lokal domen va xususiy IP cheklovlari serverda tekshiriladi.

## Bildirishnomalar xavfsizligi

- Bildirishnoma yaratish, nashr qilish va o‘chirish faqat administrator roli hamda CSRF tekshiruvi orqali bajariladi.
- Foydalanuvchi xabarlari sessiyadagi rol, tanlangan auditoriya va amaldagi kurs biriktiruvi bo‘yicha serverda filtrlanadi.
- Nashr qilinmagan yoki muddati tugagan bildirishnomalar foydalanuvchi API’siga qaytarilmaydi.
- O‘qilganlik yozuvi foydalanuvchi identifikatoriga bog‘langan; boshqa foydalanuvchi nomidan xabar holatini o‘zgartirish mumkin emas.
- Amal havolalari faqat `/` bilan boshlanuvchi ichki platforma yo‘llari bo‘lishi mumkin; tashqi va protokolga bog‘liq havolalar rad etiladi.

## Texnik yordam xavfsizligi

- Foydalanuvchi faqat o‘z identifikatoriga tegishli murojaatlar va yozishmalarni ko‘ra oladi; begona identifikator `404` qaytaradi.
- Murojaat va javob yaratish CSRF hamda sessiya tekshiruvlari bilan, administrator javobi va holat o‘zgarishi esa qo‘shimcha rol nazorati bilan himoyalanadi.
- FAQ qoralamalari foydalanuvchi API’siga qaytarilmaydi va faqat administrator tomonidan nashr qilinadi.
- Xabarlar HTML sifatida bajarilmaydi; uzunlik cheklovlari serverda tekshiriladi va barcha boshqaruv amallari audit jurnaliga yoziladi.
- Yopilgan murojaatga foydalanuvchi ham, administrator ham yangi xabar qo‘sha olmaydi.

## Tarmoq

- Backend dastlab faqat `127.0.0.1` manzilida ishlaydi.
- Tashqi kirish faqat HTTPS va Cloudflare Tunnel/reverse proxy orqali beriladi.
- PostgreSQL porti internetga ochilmaydi.

## Zaiflik haqida xabar

Zaiflikni ommaviy issue sifatida yubormang. Repository egasiga xususiy kanal orqali xabar bering.
