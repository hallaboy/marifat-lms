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

## Tarmoq

- Backend dastlab faqat `127.0.0.1` manzilida ishlaydi.
- Tashqi kirish faqat HTTPS va Cloudflare Tunnel/reverse proxy orqali beriladi.
- PostgreSQL porti internetga ochilmaydi.

## Zaiflik haqida xabar

Zaiflikni ommaviy issue sifatida yubormang. Repository egasiga xususiy kanal orqali xabar bering.
