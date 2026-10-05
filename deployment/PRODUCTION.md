# Production ishga tushirish

## 1. DNS va Cloudflare Tunnel

Portable `cloudflared 2026.9.1` binarysi `D:\LMS-Server\cloudflared\cloudflared.exe` manziliga rasmiy SHA-256 tekshiruvi bilan o‘rnatilgan. Windows versiyasi avtomatik yangilanmaydi; yangi reliz o‘rnatilganda rasmiy checksumni qayta tekshiring.

1. Remote-managed `sitlearning-production` tunnel Cloudflare’da yaratilgan.
2. Tunnel tokeni faqat `D:\LMS-Server\secrets\cloudflare-tunnel.token` ichida cheklangan ACL bilan saqlanadi.
3. `deployment/cloudflare-remote-tunnel.yml` faqat token fayliga yo‘lni ko‘rsatadi; tokenning o‘zi repositoryga kiritilmaydi.
4. `sitlearning.uz` va `www.sitlearning.uz` public hostname’lari `127.0.0.1:3000` ga uzatiladi; Next.js bir xil origin `/api/*` so‘rovlarini FastAPI’ga yo‘naltiradi.
5. PostgreSQL `5432` portini tunnel, router yoki firewall orqali internetga ochmang.

Versiya, konfiguratsiya va tunnel jarayonini tekshiring:

```powershell
& "D:\LMS-Server\cloudflared\cloudflared.exe" --version
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "cloudflared.exe" -and $_.CommandLine -like "*cloudflare-tunnel.yml*" }
```

## 2. Production environment

Backend secret storage:

```dotenv
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://sitlearning.uz","https://www.sitlearning.uz"]
TRUSTED_HOSTS=["sitlearning.uz","www.sitlearning.uz","127.0.0.1","localhost"]
COOKIE_SECURE=true
INTEGRATION_WORKER_ENABLED=true
PUBLIC_APP_URL=https://sitlearning.uz
```

Frontend build environment:

```dotenv
# Bir xil origin ishlatiladi: qiymatni bermang yoki bo‘sh qoldiring.
NEXT_PUBLIC_API_ORIGIN=
```

Telegram, CRM, Click, Payme va Firebase service-account kalitlari Git repositoryga yozilmaydi. Firebase Web config hamda public VAPID kaliti `NEXT_PUBLIC_FIREBASE_*` o‘zgaruvchilarida, service-account JSON esa faqat backend secret storage’da turadi.

## 3. Cloudflare himoyasi

- Managed WAF ruleset’ni yoqing va avval kuzatuv, so‘ng block rejimida tekshiring.
- `/api/v1/auth/login` uchun IP bo‘yicha qat’iy rate limit va takroriy muvaffaqiyatsiz urinishlarda Managed Challenge qo‘llang.
- `/admin*` uchun Managed Challenge yoki Cloudflare Access siyosatini yoqing.
- `/api/*` uchun umumiy rate limit yarating; upload endpointlarida body-size limitni alohida saqlang.
- Click, Payme, Telegram webhook yo‘llariga brauzer challenge qo‘ymang: ular ilova darajasida secret/imzo bilan tekshiriladi. Ular uchun alohida rate limit qo‘llang.
- API va autentifikatsiyalangan sahifalarni cache qilmang. `_next/static/*` immutable assetlarini cache qilish mumkin.
- Origin server firewall’ida tashqi inbound portlarni yoping; `cloudflared` origin bilan loopback orqali bog‘lansin.

## 4. Release gate

```powershell
& "D:\LMS-Server\config\backup-lms.ps1" -IncludeUploads -IncludeApplication
npm ci
npm run lint
npm run build
& "D:\LMS-Server\backend\service\.venv\Scripts\ruff.exe" check app migrations tests
& "D:\LMS-Server\backend\service\.venv\Scripts\bandit.exe" -q -r app
& "D:\LMS-Server\backend\service\.venv\Scripts\pytest.exe" -q
& "D:\LMS-Server\backend\service\.venv\Scripts\python.exe" -m alembic upgrade head
```

Release oldidan PostgreSQL custom-format backup yarating, `/api/v1/ready` va frontend `/login` uchun 200 javobni tekshiring, keyin Cloudflare orqali login, upload, webhook va logout smoke testlarini bajaring.

Kundalik monitoring, backup, tiklash sinovi va hodisaga javob tartibi [OPERATIONS.md](./OPERATIONS.md) faylida berilgan.
`sitlearning.uz` DNS ko‘chirish tartibi va saqlanishi shart bo‘lgan pochta yozuvlari [SITELEARNING-DOMAIN.md](./SITELEARNING-DOMAIN.md) faylida qayd etilgan.
