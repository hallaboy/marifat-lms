# sitlearning.uz domenini ishga tushirish

Tekshiruv sanasi: 2026-10-05. Eskiz registratorida nameserverlar `ashton.ns.cloudflare.com` va `aurora.ns.cloudflare.com` qiymatlariga almashtirildi; global DNS keshlari yangilanishi kutilmoqda.

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
| A | `ftp` | `45.138.159.2` | DNS only; ildiz domen tunnelga o‘tganda FTP uzilmasligi uchun mustaqil yozuv |
| MX | `@` | `10 mail.sitlearning.uz` | DNS only |
| TXT | `@` | `v=spf1 +a +mx +a:panel1.eskiz.uz -all` | DNS only |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=s; aspf=s` | DNS only |

Eski `@ A 45.138.159.2` va `www CNAME sitlearning.uz` yozuvlari Cloudflare’da tunnel ID manziliga proxied CNAME yozuvlari bilan almashtirildi.

## Xavfsiz ko‘chirish tartibi

1. Cloudflare zone, `sitlearning-production` tunnel va `@` hamda `www` public hostname’lari yaratildi.
2. Tunnel tokeni `D:\\LMS-Server\\secrets\\cloudflare-tunnel.token` ichida cheklangan ACL bilan saqlandi; repositoryda faqat token fayliga yo‘l ko‘rsatilgan konfiguratsiya bor.
3. Mail, webmail, MX, SPF, DMARC va xizmat yozuvlari Cloudflare DNS’da tekshirildi; `ftp` amaldagi IP’ga mustaqil DNS-only A yozuvi qilindi.
4. `@` va `www` tunnel UUID’ining `.cfargotunnel.com` manziliga proxied CNAME sifatida yo‘naltirildi.
5. Eskiz panelida nameserverlar Cloudflare bergan ikki NS qiymatiga almashtirildi va registrator muvaffaqiyat xabarini qaytardi.
6. NS tarqalishi tugagach HTTPS, login/logout, fayl yuklash, material ko‘rish va `/api/v1/ready` smoke testlarini bajaring.
7. `/api/*` va autentifikatsiyalangan sahifalar uchun cache bypass, login/API rate limit va WAF qoidalarini tekshiring.

Nameserver almashtirish mail oqimiga ta’sir qilishi mumkin. MX, `mail`, SPF va DMARC Cloudflare’da tasdiqlanmasdan Eskiz NS yozuvlarini o‘zgartirish taqiqlanadi.
