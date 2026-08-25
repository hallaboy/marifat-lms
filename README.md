# Ma'rifat LMS

O'zbek tilidagi zamonaviy LMS platformasining interaktiv frontend MVPsi. Dashboard kurslar, topshiriqlar, o'qish faolligi, natijalar va bildirishnomalarni birlashtiradi.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:3000` manzilini oching.

## GitHub Pages

`main` branchga yuborilgan har bir o'zgarish GitHub Actions orqali avtomatik build va deploy qilinadi:

https://hallaboy.github.io/marifat-lms/

## Arxitektura

- **Next.js + React** — web ilova va foydalanuvchi kabinetlari
- **FastAPI** — kurslar, testlar, baholash, to'lovlar va analytics API
- **PostgreSQL** — asosiy tranzaksion ma'lumotlar
- **Firebase** — autentifikatsiya va real-time bildirishnomalar
- **Cloudflare** — CDN, WAF, video yetkazish va edge caching
- **Node.js** — Next.js runtime va integratsiya worker'lari

Frontend `.env.example` dagi `NEXT_PUBLIC_API_URL` orqali FastAPI servisiga ulanadigan qilib ajratilgan. Ishlab chiqarish bosqichida rollar `student`, `teacher`, `manager`, `accountant`, `support` va `admin` sifatida backendda RBAC orqali boshqariladi.
