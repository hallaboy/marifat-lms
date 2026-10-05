# Production ishga tushirish

## 1. DNS va Cloudflare Tunnel

1. Cloudflare Zero Trust’da nomlangan tunnel yarating.
2. Tunnel credential JSON faylini faqat `D:\LMS-Server\secrets` ichida saqlang.
3. `cloudflare-tunnel.example.yml` nusxasida tunnel UUID, credential yo‘li va haqiqiy domenni kiriting.
4. Ingress tartibini saqlang: avval `^/api/.*` FastAPI’ga, keyin qolgan trafik Next.js’ga, oxirida majburiy `http_status:404`.
5. PostgreSQL `5432` portini tunnel, router yoki firewall orqali internetga ochmang.

## 2. Production environment

Backend secret storage:

```dotenv
ENVIRONMENT=production
ALLOWED_ORIGINS=["https://lms.example.uz"]
TRUSTED_HOSTS=["lms.example.uz","127.0.0.1"]
COOKIE_SECURE=true
INTEGRATION_WORKER_ENABLED=true
PUBLIC_APP_URL=https://lms.example.uz
```

Frontend build environment:

```dotenv
NEXT_PUBLIC_API_ORIGIN=https://lms.example.uz
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
& "D:\LMS-Server\config\backup-lms.ps1"
npm ci
npm run lint
npm run build
& "D:\LMS-Server\backend\service\.venv\Scripts\ruff.exe" check app migrations tests
& "D:\LMS-Server\backend\service\.venv\Scripts\pytest.exe" -q
& "D:\LMS-Server\backend\service\.venv\Scripts\python.exe" -m alembic upgrade head
```

Release oldidan PostgreSQL custom-format backup yarating, `/api/v1/ready` va frontend `/login` uchun 200 javobni tekshiring, keyin Cloudflare orqali login, upload, webhook va logout smoke testlarini bajaring.

Kundalik monitoring, backup, tiklash sinovi va hodisaga javob tartibi [OPERATIONS.md](./OPERATIONS.md) faylida berilgan.
