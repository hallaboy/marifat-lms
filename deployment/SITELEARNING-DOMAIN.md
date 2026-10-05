# sitlearning.uz domenini ishga tushirish

Tekshiruv sanasi: 2026-10-05. Domenning amaldagi authoritative nameserverlari `dns1.eskiz.uz` va `dns2.eskiz.uz`.

## Maqsadli arxitektura

- `https://sitlearning.uz` va `https://www.sitlearning.uz` Cloudflare edge’ga keladi.
- Cloudflare Tunnel `/api/*` so‘rovlarini faqat `127.0.0.1:8000` FastAPI’ga uzatadi.
- Qolgan trafik faqat `127.0.0.1:3000` Next.js’ga uzatiladi.
- PostgreSQL `5432` va originning boshqa portlari internetga ochilmaydi.
- Brauzer productionda API bilan bir xil HTTPS origin orqali ishlaydi.

## Nameserver almashtirishdan oldin saqlanadigan DNS yozuvlari

Quyidagi qiymatlar 2026-10-05 kuni Eskiz authoritative DNS’dan o‘qilgan. Cloudflare zone faollashtirilishidan oldin ular Cloudflare DNS’da qayta yaratilishi shart:

| Turi | Nomi | Qiymati | Proxy |
|---|---|---|---|
| A | `mail` | `45.138.159.2` | DNS only |
| A | `webmail` | `45.138.159.2` | DNS only |
| CNAME | `ftp` | `sitlearning.uz` | DNS only; FTP ishlatilsa keyinchalik alohida origin yozuvi tavsiya etiladi |
| MX | `@` | `10 mail.sitlearning.uz` | DNS only |
| TXT | `@` | `v=spf1 +a +mx +a:panel1.eskiz.uz -all` | DNS only |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=s; aspf=s` | DNS only |

Amaldagi `@ A 45.138.159.2` va `www CNAME sitlearning.uz` yozuvlari eski hostingga xizmat qiladi. Tunnel DNS route’lari tayyor bo‘lmaguncha ularni almashtirmang.

## Xavfsiz ko‘chirish tartibi

1. Cloudflare hisobiga `sitlearning.uz` zone’ini qo‘shing.
2. Yuqoridagi mail/SPF/DMARC yozuvlarini Cloudflare importidan keyin bandma-band tekshiring.
3. `sitlearning-production` nomli tunnel yarating va credential faylini faqat `D:\\LMS-Server\\secrets` ichida ACL bilan saqlang.
4. `deployment/cloudflare-tunnel.example.yml` asosida haqiqiy `cloudflare-tunnel.yml` yarating va `ingress validate` bajaring.
5. Cloudflare’da `@` va `www` hostlarini tunnel UUID’ining `.cfargotunnel.com` manziliga proxied CNAME sifatida yo‘naltiring.
6. Shundan keyingina Eskiz panelida nameserverlarni Cloudflare bergan ikkita NS qiymatiga almashtiring.
7. NS tarqalishi tugagach HTTPS, login/logout, fayl yuklash, material ko‘rish va `/api/v1/ready` smoke testlarini bajaring.
8. `/api/*` va autentifikatsiyalangan sahifalar uchun cache bypass, login/API rate limit va WAF qoidalarini tekshiring.

Nameserver almashtirish mail oqimiga ta’sir qilishi mumkin. MX, `mail`, SPF va DMARC Cloudflare’da tasdiqlanmasdan Eskiz NS yozuvlarini o‘zgartirish taqiqlanadi.
