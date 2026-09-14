# DocNear xavfsizlik auditi — 2026-09-13–14

## Qisqa xulosa

Lokal kod auditi, boshqariladigan pentest va regressiya tekshiruvlari bajarildi.
Quyidagi 10 muammo toifasiga tuzatish kiritildi. Yakuniy backend natijasi:
**2 374 passed**. Bu hisobot zaifliklar umuman yo‘qligi kafolati yoki tashqi
sertifikatsiya emas; tekshirilgan lokal MVP uchun dalillarga asoslangan bahodir.

## Scope

- Django: `http://127.0.0.1:8001`, development konfiguratsiyasi va alohida QA bazasi.
- Patient/Doctor/Admin/Owner: `http://localhost:3001`–`3004`.
- PostgreSQL: test bazalari, ORM, tranzaksiya va booking cheklovlari.
- Flutter kodi, Android debug APK va emulator-5554.
- Telegram bot kodi va mock transportli testlar; Telegram infratuzilmasiga hujum qilinmadi.
- Dependency manifestlari, CI, hujjatlar, Gitdagi fayllar va reachable tarix.

Staging konfiguratsiyasi tasdiqlanmagan. Haqiqiy bemorlar bilan brute force,
yuqori hajmli trafik, tashqi pentest yoki haqiqiy SMS/Telegram OTP yuborish bajarilmadi.

## Topilgan xavfsizlik muammolari

### S01 — High: AI javobidan XSS

- Joy: Patient Web `AIChatBubble.tsx`.
- Sabab: ishonchsiz model javobi `dangerouslySetInnerHTML` bilan chiqarilgan.
- Xavfsiz dalil: img/onerror va script matni, jumladan bold ichidagi payload.
- Tuzatish: `BoldText` React komponenti; matn avtomatik escape qilinadi.
- Test: `tests/xss.test.ts` HTML teglar bajariladigan markupka aylanmasligini tekshiradi.

### S02 — Medium: forwarded IP orqali OTP cheklovini chetlash

- Joy: `accounts/otp.py`, DRF sozlamalari.
- Sabab: mijoz bergan X-Forwarded-For IP kvotasiga ishonilgan.
- Dalil: bir peer, ikki soxta header; ikkinchi so‘rov belgilangan kvotada 429 oladi.
- Tuzatish: standart `NUM_PROXIES=0`; operator uchun aniq `TRUSTED_PROXY_COUNT`.
- Test: `test_forwarded_header_does_not_override_direct_peer`, `test_spoofed_ip_cannot_bypass_otp_quota`.

### S03 — Medium: parallel OTP request race

- Joy: OTP kvotasi, eski kodni bekor qilish va yangi hisob yaratish.
- Sabab: count va insert orasida bir xil telefon/IP uchun umumiy lock yo‘q edi.
- Dalil: ikki parallel lokal so‘rov, limit 1; bitta 200 va bitta 429, bitta aktiv OTP.
- Tuzatish: parameterized PostgreSQL transaction advisory locks; verify ham telefon lockini oladi.
- Test: `test_concurrent_otp_requests_respect_quota`.

### S04 — Medium: register orqali staff activation

- Joy: `_eligible_user` va register verify.
- Sabab: oldindan mavjud, unverified staff hisobi register orqali aktivlashtirilishi mumkin edi.
- Shart: o‘sha telefon OTPsiga egalik; bu ixtiyoriy role yaratish hujumi emas.
- Tuzatish: register faqat yangi/pending patient uchun; staff va verified hisoblar rad etiladi.
- Test: to‘rtta staff roli uchun `test_registration_does_not_activate_unverified_staff`.

### S05 — High: OTPni shaxsiy bo‘lmagan Telegram chatiga bog‘lash

- Joy: bot contact handler, phone-link API, OTP delivery lookup.
- Sabab: contact egasi tekshirilgan, lekin chat shu foydalanuvchining private chati ekanligi tekshirilmagan.
- Dalil: guruh chat identifikatorli contact rad etiladi; eski group link bilan delivery chaqirilmaydi.
- Tuzatish: private chat va sender/chat tengligi; eski noto‘g‘ri linklar ham OTP olmaydi.
- Test: `test_backend_rejects_group_phone_link`, `test_legacy_group_link_cannot_receive_otp`.

### S06 — Low: matnsiz Telegram xabari botni to‘xtatishi

- Sabab: bo‘sh text split natijasi commandga unpack qilingan.
- Tuzatish: text bo‘lmagan update xavfsiz o‘tkazib yuboriladi.
- Test: `test_bot_ignores_group_contacts_and_nontext_updates`.

### S07 — High: zaif production konfiguratsiyasini qabul qilish

- Shart: noto‘g‘ri deployment qiymatlari; lokal defaultning o‘zi production emas.
- Sabab: uzun placeholder/repeated secret, wildcard host, noto‘g‘ri HTTPS origin,
  HTTP SMS URL, shared cache yo‘qligi yetarli darajada bloklanmagan.
- Tuzatish: fail-fast validatsiya; DEBUG true taqiqlanadi, Redis talab qilinadi,
  SMS HTTPS, explicit hosts/origins, OTP muddati/urinishlari chegaralanadi.
- Test: valid konfiguratsiya va 12 ta invalid variant subprocesslarda, tashqi ulanishsiz.
- Secret generator sifatini to‘liq isbotlab bo‘lmaydi: operator kriptografik random secret yaratishi kerak.

### S08 — High: Android release cleartext transport

- Sabab: main manifest barcha buildlarda HTTPga ruxsat bergan.
- Tuzatish: main/release cleartext false, debug override true; release API URL HTTPS
  bo‘lishi kerak. Backup o‘chirildi. JWT FlutterSecureStorage’da qoladi.
- Test: `security_config_test.dart`, debug build va emulator install/start.
- Production signing yoki fizik qurilma sinovi bu tekshiruvga kirmadi.

### S09 — Medium: test runtime izolyatsiyasi

- Sabab: QA runner inherited DOCNEAR_ENV_FILE orqali boshqa bazani yuklashi mumkin;
  fixed-test-OTP server barcha interfeysga bind qilingan edi.
- Tuzatish: env fayl override’i olib tashlanadi; QA faqat 127.0.0.1da ishlaydi.
- Test: `test_qa_bootstrap.py` inherited env va bind manzilini ham tekshiradi.
- Test yakunida QA API to‘xtatilib, normal development API qaytarildi.

### S10 — Medium: pullik AI endpointlarida access/quota yo‘qligi

- Shart: operator haqiqiy GEMINI_API_KEY sozlagan bo‘lsa xarajat suiiste’moli mumkin.
- Tuzatish: backend-verified patient JWT, timeout, redirect rejection, 10/min socket-IP
  limiti. Backend nosozligida 503; credential yoki transport tafsiloti chiqarilmaydi.
- Test: anonymous, patient, invalid JWT, staff, backend failure va rate limit.
- Multi-instance limit va xarajat budgeti alohida production vazifasi bo‘lib qoladi.

## Backend security

OTP hash, expiry, attempts, resend, safe delivery failures, JWT rotation/blacklist,
profile mass assignment, role/IDOR, booking overlap va tranzaksiyalar mavjud
regressiyalar bilan qayta tekshirildi. Booking exclusion constraint zaiflashtirilmadi.
Patient, doctor va owner querysetlari o‘z obyektlariga cheklangan; ownerga patient_note
chiqarilmaydi. Admin settings/admin-user yo‘llari super_admin talab qiladi.

## Telegram security

Token envdan olinadi; transport exceptionlari tokenli URLni chiqarmasligi bo‘yicha
testlar mavjud. Own-contact, private-chat, unlink, linked/account_ready va send failure
holatlari tekshirildi. HTTP 200 faqat mock transport qabul qilgan holatda beriladi;
real Telegram delivery ushbu auditda tekshirilmagan. Diagnostika masking testlari o‘tdi.

## Web security

To‘rtta app real API bilan ishlaydi. JWT sessionStorage’da, logout/refresh failureda
tozalanadi. SessionStorage XSSdan himoya qilmaydi; S01 shu sabab yuqori ahamiyatli.
AI rendering tuzatildi; production paid AIga server-side auth qo‘shildi.
Clinic Owner va Doctor backend role cheklovlari browser routingdan mustaqil.

## Mobile security

FlutterSecureStorage saqlanmoqda; SharedPreferences JWT/OTP uchun ishlatilmaydi.
Release HTTP bloklandi. Flutter analyze toza, 15 test passed va odatiy runda 1 live
test skipped; alohida live run 1 passed. Debug APK install `Success`, launch `Status: ok`;
login ekrani ko‘rib tasdiqlandi.

APK: `artifacts/DocNear-debug.apk`.
SHA-256: `f86e00442f57610f15501f10bee5802df3c077bea59a2c66c395c05d882742fe`.
Bu emulator APIga ulangan development APK.

## API security

Kichik lokal HTTP probe: health 200; auth/me va admin appointments anonymous 401.
X-Frame-Options DENY, nosniff va Referrer-Policy mavjud. Allowed origin preflight
qabul qilindi; untrusted origin uchun allow-origin yo‘q. Search SQL/XSS satrlari
ORM/API orqali xavfsiz ishladi; bu SQLi uchun exhaustive fuzzing emas.
Pagination maksimumi 100. Production secure cookies/HSTS/HTTPS redirect saqlangan.
JWT header authda cookie CSRF qo‘llanmaydi; Django admin sessionida CSRF middleware bor.

## Dependency security

- To‘rtta `npm audit --audit-level=high`: 0 vulnerabilities.
- `pip check`: broken requirement yo‘q; `pip-audit`: 53 paket, 0 known advisory.
- Bandit: 6 finding. Ikki LOW — error-string/boolean false positive; to‘rtta MEDIUM
  urlopen — Telegram fixed host, SMS production HTTPS/operator URL, bot operator backend URL.
  Tashqi mijoz bu URLlarni request bodydan bera olmaydi. Findinglar yashirilmadi.
- Python outdated: boto3/botocore, DRF, PyJWT, Ruff, tzdata va Django major yangilanishi mavjud.
  Auditda advisory yo‘qligi sabab major upgrade ko‘r-ko‘rona bajarilmadi.
- Flutter outdated: 2 locked-upgradable va 10 constrained dependency; macOS secure-storage
  adapteri va js discontinued. Bu ma’lum CVE isboti emas, maintenance xavfi.
- Recharts 2.x npm deprecated warningi bor; migration alohida rejalashtirilishi kerak.

## Secret scanning

529 tracked fayl, 696 reachable history blob, web dist va APK ichida mavjud runtime
secretlarining aniq nusxalari tekshirildi: 0 match. Private-key marker ham topilmadi.
Bu noma’lum yoki oldin rotate qilingan har qanday secretni aniqlash kafolati emas.
`git status --ignored -s` bajarildi; `.runtime`, APK/build, node_modules, local.properties
ignored. Real env/keystore tracked emas. `.runtime/local.env` saqlandi, secret chiqarilmadi.

## E2E security checks

Phone OTP register/login → booking → doctor accept → patient confirmed → admin va
owner bir xil booking → second patient 409: passed.
Qo‘shimcha: owner isolation, Telegram-authenticated booking access/cancel, notifications,
reschedule bir xil ID, admin create/edit passed. Browser page errors: 0.
Newman: 24 requests, 59 assertions, 0 failures. Flutter live booking: 1 passed.

## Commands used

Repo rootda, hech qanday secret qiymatini command matniga yozmasdan:

```bash
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py check --settings=config.settings.development
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py makemigrations --check --dry-run --settings=config.settings.development
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python backend/manage.py migrate --settings=config.settings.development
.venv/bin/python -m compileall -q backend
.venv/bin/ruff check backend
DOCNEAR_ENV_FILE=.runtime/local.env .venv/bin/python -m pytest -q
python3 -m pip --python .venv/bin/python check
python3 -m pip --python .venv/bin/python list --outdated
uvx --from pip-audit pip-audit --path .venv/lib/python3.12/site-packages --format json --output /tmp/docnear-pip-audit.json
uvx --from bandit bandit -r backend -x backend/tests,backend/qa,backend/apps/clinics/management -f json -o /tmp/docnear-bandit.json
./scripts/run-integration-qa.sh
npx --yes newman run postman/DocNear.postman_collection.json -e .runtime/integration/postman.env.json --folder '00 End-to-end booking verification' --reporters cli --reporter-cli-no-console
.venv/bin/python scripts/run-mobile-integration.py
git diff --check
git status --ignored -s
```

To‘rtta React papkasida: `npm ci`, `npm run lint`, `npm run test --if-present`,
`npm run build`, `npm audit --audit-level=high`.
Patient Webda: `node tests/otp-ui.mjs`, `node tests/live-booking.mjs`, `node tests/live-ecosystem.mjs`.

Flutter papkasida:

```bash
flutter pub get
flutter analyze
flutter test
flutter pub outdated
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:8001/api/v1/ --dart-define=TELEGRAM_BOT_USERNAME=Clinic_Booking_System_bot
```

## Test results

- Yakuniy backend: 2 374 passed.
- Oxirgi focused backend: 46 passed.
- Django check/migration drift/migrate, compileall, Ruff: passed; yangi migration yo‘q.
- To‘rtta React install/lint/build/audit: passed.
- Patient test runner: 3 test fayli passed; qolgan panellarda test script yo‘q.
- OTP browser: 4 app passed; booking ecosystem va Newman passed.
- Flutter: 15 passed, 1 skipped; alohida live 1 passed; APK build/install/start passed.

## Git

Audit kodi, testlar va hisobot bitta lokal commitga saqlanadi.
Commitni `git log -1 --format=%H` orqali tekshirish mumkin; yakuniy chat javobida hash berilgan.
Push bajarilmadi. Secret/build artefaktlar commitga kiritilmaydi.

## Remaining risks

- Production SMS vendorning real qabul/delivery shartnomasi va real Telegram yakuniy smoke sinovi.
- Production HTTPS/domain/proxy, Redis va edge rate-limit deploymenti tekshirilmagan.
- Android production signing, fizik qurilma sinovi, iOS build/test bajarilmagan.
- SessionStorage tokenlari same-origin scriptga ochiq; XSSning yangi manbalaridan himoya zarur.
- AI quota hozir per-process; tarqatilgan limit va provider spending cap kerak.
- Dependency maintenance yuqoridagi outdated/discontinued paketlar uchun zarur.
- Hozirgi secretlarning tarixdagi nusxasi topilmadi; bu oldingi barcha secretlarni qamramaydi.

## Final verdict

**Tekshirilgan lokal MVP security baseline tayyor. Production release hali tayyor emas.**
Bu verdict yuqoridagi testlar, cheklangan lokal pentest va ochiq qolgan deployment
vazifalari doirasida amal qiladi.

## Texnik manbalar

Proxy IP konfiguratsiyasi: [DRF throttling](https://www.django-rest-framework.org/api-guide/throttling/).
Cleartext ta’siri: [Android cleartext communications](https://developer.android.com/privacy-and-security/risks/cleartext-communications).
