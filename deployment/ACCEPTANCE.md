# Ma’rifat LMS qabul protokoli

Tekshiruv sanasi: 2026-10-05. Ushbu protokol credential talab qilmaydigan lokal platforma holatini qayd etadi.

| Talab | Amalga oshirilgan yechim | Tekshiruv dalili | Holat |
|---|---|---|---|
| Zamonaviy onlayn ta’lim platformasi | Next.js/React frontend va FastAPI/PostgreSQL backend | Production build, `/api/v1/ready`, real brauzer | Qabul qilindi |
| Talaba va o‘qituvchi kabinetlari | Rolga mos dashboard, kurs, natija, baholash va kontent marshrutlari | Backend rol testlari, frontend route build | Qabul qilindi |
| Kurs va dars boshqaruvi | Qoralama/nashr/arxiv, o‘qituvchi biriktirish, dars tartibi | API testlari va admin/teacher UI | Qabul qilindi |
| Video, audio, hujjat va o‘yin materiallari | YouTube, HTTPS linklar, tekshiriladigan fayl uploadlari | Fayl imzosi, hajm va ruxsat testlari | Qabul qilindi |
| Test va imtihonlar | Savol/variant, vaqt, urinish, server bahosi | Talaba javobida to‘g‘ri variant yashirilishi va rol testlari | Qabul qilindi |
| Uy vazifalari | Matn/fayl yuborish, muddat, ball va o‘qituvchi izohi | API va egalik/ruxsat testlari | Qabul qilindi |
| Analitika | Umumiy, kurs va talaba kesimidagi progress/natijalar | PostgreSQL asosidagi analytics API | Qabul qilindi |
| Moliyaviy hisob | Invoice, qo‘lda tasdiq/refund, Click va Payme adapterlari | Imzo, summa va idempotency testlari | Qabul qilindi |
| Taqvim va davomat | Kurs tadbirlari, vazifa muddatlari, dars davomat jurnali | Rol va kurs egaligi testlari | Qabul qilindi |
| Resurslar kutubxonasi | Yo‘nalish guruhlari, fayl/link, ikki bosqichli nashr | Admin va foydalanuvchi API ruxsatlari | Qabul qilindi |
| Bildirishnoma va yordam | Auditoriya/kurs xabarlari, FAQ va murojaatlar | Shaxsiy ko‘rinish va administrator oqimlari | Qabul qilindi |
| Sertifikat | Avtomatik berish, ochiq tekshiruv kodi, bekor qilish | Enrollment va admin ruxsat testlari | Qabul qilindi |
| Telegram, CRM va Firebase | Xeshlangan link kodi, HMAC webhook, FID push va barqaror outbox | Integratsiya testlari va faol ichki worker | Adapter qabul qilindi; credential kutilmoqda |
| Adaptiv interfeys | Mobil va desktop breakpointlar | 390×844 va 1440×900 real brauzer tekshiruvi | Qabul qilindi |
| Texnik qo‘llab-quvvatlash | FAQ, ticket, yozishmalar va operatsion qo‘llanma | `/help`, `/admin/support`, `OPERATIONS.md` | Qabul qilindi |
| Xodimlarni o‘qitish | Administrator va o‘qituvchi amaliy yo‘riqnomasi | `STAFF-GUIDE.md` | Qabul qilindi |
| Xavfsizlik | Argon2id, HttpOnly sessiya, CSRF, RBAC, audit, CSP, upload tekshiruvi | Ruff, pytest, npm audit, pip-audit va ACL tekshiruvi | Qabul qilindi |
| Lokal server va backup | D diskdagi PostgreSQL/backend, boshqaruv, baza va uploads uchun SHA-256 backup skriptlari | `status-lms.ps1`, `backup-lms.ps1 -IncludeUploads`, baza hamda arxiv tarkibi tekshiruvi | Qabul qilindi |
| GitHub frontend | Faqat frontend kodi va xavfsiz hujjatlar | Lokal `HEAD` va `origin/main` tengligi | Qabul qilindi |
| Public production | Cloudflare runtime va HTTPS/WAF/Tunnel konfiguratsiyasi tayyor | `cloudflared 2026.9.1` SHA-256 bilan tekshirildi; domen va tunnel credentiali mavjud emas | Tashqi rekvizit kutilmoqda |

## Avtomatik tekshiruv natijalari

- FastAPI OpenAPI: 108 ta yo‘l va 125 ta operatsiya.
- Backend: Ruff muvaffaqiyatli, 14 ta pytest testi muvaffaqiyatli.
- Frontend: ESLint va Next.js production build muvaffaqiyatli; 33 ta route yig‘ildi.
- Bog‘liqliklar: `npm audit --omit=dev` — 0 ta; `pip-audit` — ma’lum zaiflik topilmadi.
- PostgreSQL migratsiyasi: `20261005_16 (head)`.
- Runtime: PostgreSQL, FastAPI, ichki integratsiya workeri va Next.js faol.

Tashqi provayderlarning haqiqiy kalitlari test yoki repositoryga yozilmaydi. Ular taqdim etilgach [PRODUCTION.md](./PRODUCTION.md) bo‘yicha Cloudflare orqali yakuniy public smoke test o‘tkaziladi.

