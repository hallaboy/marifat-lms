# Ma’rifat LMS

O‘zbek tilidagi zamonaviy LMS platformasi. Hozirgi bosqichda haqiqiy FastAPI autentifikatsiyasi, rolga asoslangan ruxsatlar, Super Admin paneli va foydalanuvchilar boshqaruvi ishlaydi.

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

## Lokal boshqaruv paneli

Butun lokal platformani ishga tushirish:

```powershell
& "D:\LMS-Server\config\start-lms.ps1"
```

- Platforma: `http://127.0.0.1:3000`
- Login: `http://127.0.0.1:3000/login`
- Admin panel: `http://127.0.0.1:3000/admin`
- Dastlabki Super Admin: `admin@marifat.uz`
- Bir martalik boshlang‘ich parol faqat lokal `D:\LMS-Server\secrets\initial-super-admin.env` faylida saqlanadi.

GitHub Pages manzili production LMS emas. Dinamik login va admin paneli Next.js runtime hamda FastAPI serverini talab qiladi.

## Arxitektura chegarasi

Bu repository faqat frontend kodi va xavfsiz hujjatlarni saqlaydi. Backend kodi, PostgreSQL ma’lumotlari, foydalanuvchi yuklamalari, loglar, zaxira nusxalari va barcha sirlar `D:\LMS-Server` hududida saqlanadi va GitHub’ga yuborilmaydi.

Production frontend statik GitHub Pages emas, qat’iy nonce asosidagi CSP’ni qo‘llaydigan Next.js runtime orqali chiqariladi. Tashqi trafik Cloudflare HTTPS/WAF orqali keladi, backend va PostgreSQL esa internetga bevosita ochilmaydi.

Xavfsizlik talablari [SECURITY.md](./SECURITY.md) faylida yozilgan.
