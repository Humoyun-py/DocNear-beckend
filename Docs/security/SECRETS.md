# DocNear secret handling

Runtime credentials must be supplied through environment variables or a secret manager. They must never be committed to source, exposed through Vite `VITE_*` variables, or bundled into Android resources.

Required placeholders are documented in each client `.env.example`. Keep real
local values in a protected file outside the repository and set
`DOCNEAR_ENV_FILE` for Django, or supply them through the deployment platform.

The Telegram credential previously present in the repository must be revoked and replaced through **BotFather** before deployment. Treat it as compromised even if it was only used for development. Rotate Gemini credentials as well if they were ever active.

The maintained bot entry point is `DocNear-web-frontend-main(2)/DocNear-web-frontend-main/telegram_bot.py`. The Node script is retained only for compatibility and also requires `TELEGRAM_BOT_TOKEN` at runtime.
