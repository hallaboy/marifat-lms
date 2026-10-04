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

## Tarmoq

- Backend dastlab faqat `127.0.0.1` manzilida ishlaydi.
- Tashqi kirish faqat HTTPS va Cloudflare Tunnel/reverse proxy orqali beriladi.
- PostgreSQL porti internetga ochilmaydi.

## Zaiflik haqida xabar

Zaiflikni ommaviy issue sifatida yubormang. Repository egasiga xususiy kanal orqali xabar bering.
