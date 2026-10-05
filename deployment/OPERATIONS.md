# LMS operatsion qo‘llanmasi

## Kundalik nazorat

```powershell
& "D:\LMS-Server\config\status-lms.ps1"
Invoke-WebRequest "http://127.0.0.1:8000/api/v1/ready" -UseBasicParsing
Invoke-WebRequest "http://127.0.0.1:3000/login" -UseBasicParsing
```

PostgreSQL, FastAPI, integratsiya workeri va Next.js jarayonlari faqat kutilgan lokal yo‘llardan ishga tushgan bo‘lishi kerak. API va login uchun `200` javob olinmasa, `D:\LMS-Server\logs` ichidagi tegishli logni tekshiring.

## Zaxira nusxasi

```powershell
& "D:\LMS-Server\config\backup-lms.ps1"
```

Skript PostgreSQL custom-format nusxasini yaratadi, `pg_restore --list` bilan tekshiradi va SHA-256 nazorat summasini yon faylga yozadi. Avtomatik nusxalarga saqlash muddati berish uchun `-RetentionDays 30` ishlatiladi; 7 kundan qisqa qiymat qabul qilinmaydi. Standart qiymat `0`, ya’ni skript eski nusxalarni o‘zi o‘chirmaydi.

Har kuni lokal nusxa, haftasiga kamida bir marta esa shifrlangan tashqi/offsite nusxa saqlang. Ma’lumotlar bazasi bilan birga `uploads` katalogi ham alohida shifrlangan arxivga olinishi kerak. Secret fayllarni oddiy backup yoki bulut papkasiga nusxalamang.

## Tiklash sinovi

Tiklashni faqat alohida test bazasida bajaring. Production bazasini bevosita ustidan yozmang.

```powershell
& "D:\LMS-Server\postgresql\pgsql\bin\createdb.exe" --host 127.0.0.1 --port 5432 --username lms_app lms_restore_test
& "D:\LMS-Server\postgresql\pgsql\bin\pg_restore.exe" --host 127.0.0.1 --port 5432 --username lms_app --dbname lms_restore_test --clean --if-exists "D:\LMS-Server\backups\lms-auto-YYYYMMDD-HHMMSS.backup"
```

Tiklashdan oldin `.sha256` qiymatini `Get-FileHash -Algorithm SHA256` natijasi bilan solishtiring. Test bazasi ochilgach asosiy jadvallar, foydalanuvchilar soni va migratsiya holatini tekshiring.

## Release tartibi

1. Tasdiqlangan backup yarating.
2. Frontend uchun `npm ci`, `npm run lint`, `npm run build`, `npm audit --omit=dev` bajaring.
3. Backend uchun Ruff, pytest, pip-audit va `alembic upgrade head` bajaring.
4. `stop-lms.ps1`, so‘ng `start-lms.ps1` orqali boshqariladigan restart qiling.
5. Ready/login, rol ruxsatlari, fayl yuklash va logout smoke testlarini bajaring.
6. Cloudflare orqali HTTPS, WAF, webhook va cache qoidalarini tekshiring.

## Hodisaga javob

- Token yoki kalit sizgan deb gumon qilinsa, avval provayderda uni bekor qiling va yangisini yarating; keyin server secret storage’ni yangilang.
- Shubhali hisob sessiyalarini bekor qiling, audit jurnalini vaqt oralig‘i va foydalanuvchi bo‘yicha saqlab oling.
- Ta’sirlangan serverni internetdan ajrating, lekin log va dalillarni o‘chirmang.
- Tiklash zarur bo‘lsa, oxirgi sog‘lom backup va SHA-256 faylini tekshirib, alohida bazada sinovdan o‘tkazing.
- Hodisa yakunida sabab, ta’sir, vaqtlar, almashtirilgan kalitlar va takrorlanmaslik choralarini yozma qayd eting.
