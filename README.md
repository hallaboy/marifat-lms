# Ma’rifat LMS

O‘zbek tilidagi zamonaviy LMS platformasining interaktiv frontend MVPsi. Dashboard kurslar, topshiriqlar, o‘qish faolligi, natijalar va bildirishnomalarni birlashtiradi.

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

## Arxitektura chegarasi

Bu repository faqat frontend kodi va xavfsiz hujjatlarni saqlaydi. Backend kodi, PostgreSQL ma’lumotlari, foydalanuvchi yuklamalari, loglar, zaxira nusxalari va barcha sirlar `D:\LMS-Server` hududida saqlanadi va GitHub’ga yuborilmaydi.

Production frontend statik GitHub Pages emas, qat’iy nonce asosidagi CSP’ni qo‘llaydigan Next.js runtime orqali chiqariladi. Tashqi trafik Cloudflare HTTPS/WAF orqali keladi, backend va PostgreSQL esa internetga bevosita ochilmaydi.

Xavfsizlik talablari [SECURITY.md](./SECURITY.md) faylida yozilgan.
