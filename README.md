# LMS Frontend

O‘quvchi, o‘qituvchi va administrator kabinetlari uchun Next.js frontend.

## Texnologiyalar

- Next.js 16 va React 19
- TypeScript
- Tailwind CSS
- Cloudflare orqali HTTPS, CDN va himoya

## Ishga tushirish

```bash
cp .env.example .env.local
npm install
npm run dev
```

Brauzerda `http://localhost:3000` manzilini oching. Lokal backendning standart manzili `http://127.0.0.1:8000`.

## Repository chegarasi

Bu repository faqat frontend kodi va xavfsiz hujjatlarni saqlaydi. Backend kodi, PostgreSQL ma’lumotlari, foydalanuvchi yuklamalari, loglar, zaxira nusxalari va barcha sirlar `D:\LMS-Server` hududida saqlanadi va GitHub'ga yuborilmaydi.

Xavfsizlik talablari [SECURITY.md](./SECURITY.md) faylida yozilgan.
