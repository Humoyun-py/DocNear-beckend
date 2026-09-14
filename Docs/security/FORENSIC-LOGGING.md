# DocNear forensic security logging

DocNear bloklangan xavfsizlik hodisalarini `docnear.security` loggeriga bitta
qatorda yozadi. Default handler server stderr/stdout oqimiga chiqadi. Productionda
shu logger JSON formatter yoki markaziy log collector tomon yo‘naltirilishi kerak.

Loglar request body, query qiymatlari, Authorization header, JWT, refresh token,
OTP, Telegram secret yoki chat IDni yozmaydi. Telefon kerak bo‘lgan OTP hodisalarida
maskalanadi. Peer IP o‘rniga 12 belgili SHA-256 fingerprint yoziladi. Dinamik URL
qiymati o‘rniga Django route shabloni yoziladi.

## Eventlar

- `otp_request_rate_limited`: telefon yoki peer bo‘yicha OTP kvotasi blokladi;
  status 429, `scope=phone|peer`, accounts `PhoneOTP` jadvalida yangi qator yo‘q.
- `otp_verification_failed`: noto‘g‘ri, expired, exhausted yoki purpose mos bo‘lmagan
  tasdiqlash; status 400, mavjud `PhoneOTP.attempts` oshishi mumkin.
- `telegram_otp_link_rejected`: aktiv va private link topilmadi; status 400,
  delivery chaqirilmaydi va OTP qatori yaratilmaydi.
- `telegram_otp_delivery_failed`: Telegram transporti qabul qilmadi; status 503,
  yaratilgan OTP darhol ishlatilgan sifatida yopiladi.
- `authentication_failed`: yaroqsiz access token yoki autentifikatsiya urinishlari;
  status 401, model o‘zgarmaydi.
- `token_refresh_failed`: invalid, expired, rotated yoki blacklisted refresh token;
  status 401, token qiymati loglanmaydi.
- `authorization_denied`: noto‘g‘ri role himoyalangan endpointga kirdi; status 403.
- `object_scope_denied`: authenticated user scoped querysetdan tashqaridagi obyektni
  so‘radi; status 404. Bu IDOR probe uchun asosiy signal.
- `booking_or_state_conflict`: slot yoki status transition konflikti; status 409.
- `database_conflict`: sanitizatsiya qilingan IntegrityError; status 409.
- `page_size_capped`: so‘ralgan page size 100 dan katta; javob ishlaydi, limit 100.
- `rate_limited`: DRF umumiy/auth/verify throttle 429 qaytardi.

## Xavfsiz misol

```text
security_event event=authorization_denied method=GET route=api/v1/admin-panel/appointments/$ actor_id=17 role=patient peer=12ca17b49af2 status=403 outcome=blocked
security_event event=object_scope_denied method=GET route=api/v1/appointments/(?P<pk>[^/.]+)/$ actor_id=18 role=patient peer=12ca17b49af2 status=404 outcome=blocked
security_event event=otp_request_rate_limited method=POST route=api/v1/auth/request-otp/ actor_id=anonymous role=anonymous peer=12ca17b49af2 phone=+99890****096 scope=phone status=429 outcome=blocked
```

Misoldagi identifikator va telefon test qiymatlaridir. Real payload kiritilmaydi.

## Alert tavsiyalari

- Bir peer fingerprintdan 5 daqiqada 5+ `otp_request_rate_limited`: warning.
- Bir actor/peerdan 10 daqiqada 10+ `otp_verification_failed`: high alert.
- Har qanday `telegram_otp_delivery_failed`: operational alert.
- Bir actor 5 daqiqada 3+ `authorization_denied`: warning; admin route bo‘lsa high.
- Bir actor/peer 10 daqiqada 5+ `object_scope_denied`: IDOR investigation.
- Bir doctor/slot bo‘yicha takroriy `booking_or_state_conflict`: abuse yoki stale UI.
- 5 daqiqada 10+ `token_refresh_failed`: credential stuffing/replay investigation.
- Takroriy `page_size_capped`: scraper yoki API abuse tekshiruvi.

Alert thresholdlar boshlang‘ich qiymatlar. Production trafik baseline’iga qarab
sozlanadi. Peer fingerprint IPning o‘zi emas va reverse lookup qilinmaydi.

## Investigation tartibi

1. Event, vaqt, route, method, actor ID/role va peer fingerprintni ajrating.
2. Shu actor/peer bo‘yicha oldingi va keyingi 10 daqiqalik eventlarni yig‘ing.
3. `AuditLog` admin write hodisalari va `AppointmentEvent` booking transitionlarini
   actor/time orqali solishtiring. OTP kodi yoki tokenni qidirmang.
4. DBda faqat zarur metadata: `PhoneOTP.attempts`, `verified_at`, appointment owner,
   status/event va Telegram link `is_active` qiymatlarini tekshiring.
5. Incident ticketda token, to‘liq telefon/chat ID va request body nusxasini saqlamang.

## Test

`backend/tests/test_security_audit.py` eventlarning mavjudligi, route shabloni,
status/role va maskalanishini tekshiradi. Test ataylab synthetic token va OTP ishlatadi.

