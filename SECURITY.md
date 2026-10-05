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
- O‘qituvchining dars, test, savol va vazifa yaratish yoki nashr qilish amallari CSRF, sessiya roli va kurs egasi bo‘yicha qayta tekshiriladi hamda audit jurnaliga yoziladi.
- O‘qituvchi kursni boshqa foydalanuvchiga biriktira olmaydi va boshqa o‘qituvchi yaratgan kontentni identifikator orqali boshqara olmaydi.
- O‘qituvchi material yuklamalari administrator yuklamalari bilan bir xil hajm, fayl imzosi va Office konteyner tekshiruvlaridan o‘tadi; foydalanuvchi yuborgan MIME qiymati yoki fayl nomiga ishonilmaydi.
- Tashqi havolalar faqat HTTPS bo‘lishi mumkin; lokal host, xususiy IP va noto‘g‘ri YouTube identifikatorlari serverda rad etiladi.

## To‘lovlar xavfsizligi

- Moliyaviy hisob yaratish, tasdiqlash, bekor qilish va qaytarish faqat administrator roli hamda CSRF tekshiruvidan keyin bajariladi.
- Talaba API’si sessiyadagi foydalanuvchi identifikatori orqali faqat uning enrollment yozuvlariga tegishli hisoblarni qaytaradi.
- Tasdiqlangan to‘lov oddiy `pending` yoki `cancelled` holatiga qaytarilmaydi; faqat auditlanadigan `refunded` jarayoni mavjud.
- Provayder operatsiya raqami takrorlanmaydi va serverda ruxsat etilgan belgilar bo‘yicha tekshiriladi.
- Karta rekvizitlari, CVV yoki to‘liq karta raqami platforma bazasida saqlanmaydi.
- Click callbacklari xizmat identifikatori, action va protokol talab qilgan imzo bilan doimiy vaqtga yaqin taqqoslanadi; invoice identifikatori hamda summa serverdagi yozuvga aynan mos bo‘lishi shart.
- Payme callbacklari `Paycom` Basic credentiali bilan tekshiriladi; invoice summasi tiyinlarda serverda qayta hisoblanadi va JSON-RPC tranzaksiyalari doimiy bazada saqlanadi.
- Provayder tranzaksiyasi `(provider, transaction_id)` yagona kalitiga ega. Takroriy `create`, `perform`, `complete` va `cancel` chaqiruvlari pul holatini ikkinchi marta o‘zgartirmaydi.
- Checkout havolasini faqat hisob egasi, `pending` holatida va CSRF token bilan oladi; merchant secretlari URL yoki frontend javobiga kiritilmaydi.

## Taqvim xavfsizligi

- Taqvim tadbirlarini yaratish, nashr qilish va o‘chirish admin roli hamda CSRF himoyasi bilan cheklangan.
- Talaba taqvim so‘rovi serverdagi enrollment yozuvlari bo‘yicha filtrlanadi; boshqa kurs tadbirlari qaytarilmaydi.
- Qoralama tadbirlar talaba API’siga kiritilmaydi.
- Jonli dars va uchrashuv havolalari faqat HTTPS bo‘lsa saqlanadi.

## Davomat xavfsizligi

- Davomatni faqat administrator yoki kursga biriktirilgan o‘qituvchi CSRF himoyasi orqali belgilaydi.
- Talaba identifikatori serverda aynan tanlangan kursning enrollment yozuvlari bilan tekshiriladi.
- O‘qituvchi boshqa kurs identifikatorini yuborsa, kurs mavjudligi oshkor qilinmasdan `404` qaytariladi.
- Talaba API’si sessiyadagi foydalanuvchi identifikatori bo‘yicha faqat uning o‘z davomat yozuvlarini qaytaradi.

## Sertifikat xavfsizligi

- Sertifikat faqat serverdagi `completed` enrollment uchun va har bir enrollmentga bir marta yaratiladi.
- Ochiq tekshiruv identifikatori `MRF-` prefiksi va 128-bit kriptografik tasodifiy qiymatdan iborat; ketma-ket baza identifikatorlari oshkor qilinmaydi.
- Talaba sertifikatlar ro‘yxatini faqat o‘z sessiyasi orqali oladi; sinxronlash CSRF va rol tekshiruvi bilan himoyalangan.
- Bekor qilish faqat administratorga ruxsat etiladi, sabab va vaqt audit jurnalida saqlanadi.
- Ochiq tekshiruv javobi faqat sertifikat egasi nomi, kurs, berilgan/yakunlangan sana va amal qilish holatini ko‘rsatadi; email va boshqa profil ma’lumotlari berilmaydi.

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

## Telegram va CRM integratsiyalari xavfsizligi

- Telegram bot tokeni, webhook siri va CRM HMAC siri frontendga yoki PostgreSQL bazasiga yozilmaydi; ular faqat server secret storage xizmatidan olinadi.
- Telegram hisobini bog‘lash kodi kriptografik tasodifiy, bazada faqat SHA-256 xeshi saqlanadi, 15 daqiqada tugaydi va bir marta ishlatiladi.
- Telegram webhook so‘rovi `X-Telegram-Bot-Api-Secret-Token` sarlavhasi bilan doimiy vaqtli taqqoslashdan o‘tadi; integratsiya o‘chirilganida endpoint `404` qaytaradi.
- CRM hodisasi xom JSON tanasi, Unix vaqt belgisi va HMAC-SHA256 imzosi bilan yuboriladi; redirect kuzatilmaydi.
- Yetkazmalar yagona idempotency kaliti bilan outboxga yoziladi. Xatolar javob tanasini saqlamaydi, urinishlar cheklangan va kechiktirib qaytariladi.
- Administrator jurnalida Telegram chat identifikatorining faqat oxirgi to‘rtta belgisi ko‘rinadi; token, payload va to‘liq manzil API javobiga kiritilmaydi.
- Firebase service-account JSON faqat backend secret storage’da turadi. Brauzer public config va VAPID public kaliti maxfiy hisoblanmaydi, lekin loyiha/domen cheklovlari bilan ishlatiladi.
- Firebase Installation ID faqat sessiya va CSRF orqali foydalanuvchiga biriktiriladi; boshqa hisobdagi FID’ni egallash `409` bilan bloklanadi va admin jurnalida FID maskalanadi.

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
