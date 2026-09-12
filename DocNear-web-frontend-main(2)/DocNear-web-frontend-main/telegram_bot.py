"""DocNear Telegram phone-link and OTP bot.

Runtime variables:
TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_SECRET and DOCNEAR_API_BASE_URL.
The Django backend creates, hashes and delivers OTP codes; this process never
generates, stores or logs them.
"""

import asyncio
import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from telegram import KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters


BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BOT_SECRET = os.getenv("TELEGRAM_BOT_SECRET", "")
API_BASE_URL = os.getenv("DOCNEAR_API_BASE_URL", "http://127.0.0.1:8001/api/v1").rstrip("/")
PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")


class BackendError(RuntimeError):
    pass


def _backend_request(path: str, method: str = "POST", payload: dict | None = None) -> dict:
    body = json.dumps(payload or {}).encode()
    request = Request(
        f"{API_BASE_URL}{path}",
        data=body,
        method=method,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Telegram-Bot-Secret": BOT_SECRET,
        },
    )
    try:
        with urlopen(request, timeout=15) as response:  # noqa: S310 - configured DocNear API URL
            result = json.load(response)
    except HTTPError as exc:
        try:
            result = json.load(exc)
            message = result.get("message", "So‘rov bajarilmadi.")
        except (ValueError, AttributeError):
            message = "So‘rov bajarilmadi."
        raise BackendError(message) from exc
    except (URLError, TimeoutError) as exc:
        raise BackendError("DocNear serveri bilan bog‘lanib bo‘lmadi. Keyinroq qayta urinib ko‘ring.") from exc
    if result.get("success") is False:
        raise BackendError(result.get("message", "So‘rov bajarilmadi."))
    return result.get("data", result)


def _phone(value: str) -> str:
    value = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not value.startswith("+"):
        value = f"+{value}"
    if not PHONE_PATTERN.fullmatch(value):
        raise BackendError("Telefon raqamni xalqaro formatda kiriting: +998901234567")
    return value


def _contact_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [[KeyboardButton(text="Telefon raqamni ulash", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    del context
    await update.effective_message.reply_text(
        "DocNear botiga xush kelibsiz. Telefon raqamingizni ulash uchun quyidagi tugmani bosing.",
        reply_markup=_contact_keyboard(),
    )


async def link_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await start(update, context)


async def contact_received(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    del context
    message = update.effective_message
    sender = update.effective_user
    contact = message.contact
    if contact.user_id != sender.id:
        await message.reply_text("Faqat o‘zingizga tegishli kontaktni ulashingiz mumkin.")
        return
    try:
        phone_number = _phone(contact.phone_number)
        await asyncio.to_thread(
            _backend_request,
            "/telegram/phone-link/",
            "POST",
            {
                "phone_number": phone_number,
                "telegram_user_id": sender.id,
                "telegram_chat_id": update.effective_chat.id,
                "contact_user_id": contact.user_id,
                "sender_user_id": sender.id,
            },
        )
    except BackendError as exc:
        await message.reply_text(str(exc))
        return
    await message.reply_text(
        "Telefon raqamingiz DocNear hisobiga ulandi. Kod olish uchun /code buyrug‘ini yuboring.",
        reply_markup=ReplyKeyboardRemove(),
    )


async def request_code(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    purpose = "register" if context.args and context.args[0].lower() == "register" else "login"
    try:
        await asyncio.to_thread(
            _backend_request,
            "/telegram/request-otp/",
            "POST",
            {"telegram_user_id": update.effective_user.id, "purpose": purpose},
        )
    except BackendError as exc:
        await update.effective_message.reply_text(str(exc))
        return
    await update.effective_message.reply_text(
        "Tasdiqlash kodi yuborildi. Kod 5 daqiqa amal qiladi. Uni hech kimga bermang."
    )


async def unlink(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    del context
    try:
        await asyncio.to_thread(
            _backend_request,
            "/telegram/phone-link/",
            "DELETE",
            {"telegram_user_id": update.effective_user.id},
        )
    except BackendError as exc:
        await update.effective_message.reply_text(str(exc))
        return
    await update.effective_message.reply_text("Telefon raqamingiz Telegram botdan uzildi.")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    del context
    await update.effective_message.reply_text(
        "/link_phone — telefon raqamni ulash\n"
        "/code — kirish kodini olish\n"
        "/code register — ro‘yxatdan o‘tish kodini olish\n"
        "/unlink — bog‘lanishni o‘chirish\n"
        "/help — yordam"
    )


async def unknown_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    del context
    await update.effective_message.reply_text("Mavjud buyruqlarni ko‘rish uchun /help ni yuboring.")


def main() -> None:
    if not BOT_TOKEN or not BOT_SECRET:
        raise RuntimeError("TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_SECRET are required.")
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("link_phone", link_phone))
    application.add_handler(CommandHandler("code", request_code))
    application.add_handler(CommandHandler("unlink", unlink))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.CONTACT, contact_received))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, unknown_text))
    application.run_polling()


if __name__ == "__main__":
    main()
