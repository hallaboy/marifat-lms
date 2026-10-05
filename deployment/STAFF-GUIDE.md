# Ma’rifat LMS xodimlar qo‘llanmasi

Ushbu qo‘llanma administrator va o‘qituvchilarga platformadagi kundalik ishlarni xavfsiz bajarish uchun mo‘ljallangan.

## Tizimga kirish va rollar

- Lokal kirish manzili: `http://127.0.0.1:3000/login`.
- `Super Admin` barcha boshqaruv modullariga ega va administrator hisoblarini boshqaradi.
- `Administrator` foydalanuvchilar, kurslar, biriktirish, testlar, moliya, resurslar va yordam markazini boshqaradi.
- `O‘qituvchi` faqat o‘ziga biriktirilgan kurs, dars, talaba, vazifa va davomat ma’lumotlarini ko‘radi.
- `Talaba` faqat o‘ziga biriktirilgan kurslar va shaxsiy natijalarini ko‘radi.

Parol yoki sessiyani boshqa xodim bilan ulashmang. Ish tugagach profil menyusidan tizimdan chiqing.

## Administratorning asosiy ish tartibi

### 1. Foydalanuvchilar

1. Admin paneldan **Foydalanuvchilar** bo‘limini oching.
2. To‘liq ism, email, rol va vaqtinchalik kuchli parol bilan hisob yarating.
3. Xodim ketganida hisobni o‘chirish o‘rniga avval bloklang; bu audit tarixini saqlaydi.
4. `Super Admin` vakolatini faqat zarur shaxsga bering.

### 2. Kurs va darslar

1. **Kurslar** bo‘limida kursni qoralama sifatida yarating.
2. O‘qituvchi, davomiylik, daraja, yo‘nalish, narx va tavsifni kiriting.
3. Darslarni mantiqiy tartibda yarating va mazmunini tekshiring.
4. Kursni nashr qilishdan oldin kamida bitta dars nashr qilingan bo‘lishi kerak.

### 3. Multimedia materiallari

- YouTube, tashqi video/audio va gamifikatsiya havolalarida faqat `https://` manzil ishlating.
- PDF, DOCX, PPTX, XLSX, MP3, M4A, WAV, MP4 va WebM fayllari qo‘llanadi.
- Fayl yuklangandan keyin talaba ko‘rinishida ochilishini tekshiring.
- Mualliflik huquqi yoki shaxsiy ma’lumotni buzadigan fayllarni joylamang.

### 4. Test, imtihon va vazifa

1. Kurs ichida test nomi, o‘tish bali, vaqt va urinishlar sonini belgilang.
2. Har bir savolda aynan bitta to‘g‘ri javobni tanlang.
3. Testni savollar tayyor bo‘lgandan keyingina nashr qiling.
4. Uy vazifasida muddat, maksimal ball va kech yuborish qoidasini tekshiring.
5. O‘qituvchi yoki administrator javoblarni baholab, tushunarli fikr qoldiradi.

### 5. Talabani biriktirish va to‘lov

1. **Biriktirish** bo‘limida faol talaba va kerakli kursni tanlang.
2. Pullik kursda hisob avtomatik yaratilganini tekshiring.
3. Qo‘lda to‘lov tasdiqlanganda provayder operatsiya raqamini kiriting.
4. Karta raqami, CVV yoki bank parolini platformaga yozmang.
5. Click yoki Payme tugmalari faqat merchant sozlamalari kiritilganda ishlaydi.

### 6. Taqvim, davomat va sertifikat

- Jonli dars, uchrashuv, imtihon yoki muddatni kurs taqvimida yarating va nashr qiling.
- O‘qituvchi dars kesimida davomatni belgilaydi; izohda maxfiy tibbiy yoki ortiqcha shaxsiy ma’lumot yozilmaydi.
- Barcha nashr qilingan darslar tugaganda sertifikat avtomatik beriladi.
- Xato yoki noqonuniy berilgan sertifikatni administrator sabab bilan bekor qiladi.

### 7. Resurslar va bildirishnomalar

1. Resurslar uchun yo‘nalish bo‘yicha guruh yarating.
2. Darslik, metodik qo‘llanma va tavsiyani guruhga qo‘shing.
3. Avval resursni, so‘ng guruhni nashr qiling.
4. Bildirishnomada auditoriya, kurs, ustuvorlik va amal muddatini tekshiring.
5. Platforma ichidagi tugma havolasi faqat `/` bilan boshlanuvchi ichki yo‘l bo‘lishi kerak.

### 8. Texnik yordam

- Yangi murojaatlarni ustuvorlik bo‘yicha saralang.
- Javobda parol, token yoki to‘liq to‘lov rekvizitini so‘ramang.
- Muammo yechilganda `hal qilindi`, yakunlanganda `yopildi` holatini tanlang.
- Takroriy savollar uchun FAQ yarating va tekshirgandan keyin nashr qiling.

## O‘qituvchi uchun kundalik tekshiruv

1. O‘qituvchi kabinetidagi kurslar va tekshirilmagan vazifalarni ko‘ring.
2. Yaqin dars materiallari va havolalarini sinab ko‘ring.
3. Talabalar progressi, test natijasi va kechikkan vazifalarni kuzating.
4. Darsdan keyin davomatni kiriting.
5. Baholashda maksimal ball chegarasidan chiqmasdan, aniq izoh qoldiring.

## Xavfsizlik hodisasi

Parol, bot tokeni yoki merchant kaliti sizgan deb gumon qilinsa, undan foydalanishni to‘xtating va Super Admin’ga xabar bering. Provayderdagi kalit bekor qilinib yangilanmaguncha uni oddiy xabar yoki email orqali yubormang. Server holati, backup va hodisaga javob tartibi [OPERATIONS.md](./OPERATIONS.md) faylida berilgan.

