"""
DocNear Telegram Authentication Bot (Python)
Kutubxona: pip install python-telegram-bot

Ishga tushirish:
python telegram_bot.py
"""

import os
import random
import logging
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Logging sozlamalari
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

# Vaqtinchalik kodlar xotirasi
verification_codes = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Foydalanuvchi /start bosganda ishlaydi va telefon raqamini so'raydi"""
    user = update.effective_user
    
    contact_button = KeyboardButton(text="📱 Telefon raqamni yuborish", request_contact=True)
    keyboard = ReplyKeyboardMarkup([[contact_button]], resize_keyboard=True, one_time_keyboard=True)
    
    welcome_text = (
        f"👋 Assalomu alaykum, <b>{user.first_name}</b>!\n\n"
        f"🏥 <b>Clinic Booking System (DocNear)</b> platformasining rasmiy autentifikatsiya botiga xush kelibsiz.\n\n"
        f"Ro'yxatdan o'tishni yakunlash va shifokor qabulini band qilish uchun "
        f"quyidagi <b>'📱 Telefon raqamni yuborish'</b> tugmasini bosing."
    )
    
    await update.message.reply_html(welcome_text, reply_markup=keyboard)


async def contact_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Foydalanuvchi o'z kontaktini yuborganida 6 xonali tasdiqlash kodi beradi"""
    contact = update.message.contact
    phone_number = contact.phone_number
    if not phone_number.startswith("+"):
        phone_number = "+" + phone_number
        
    # 6 xonali tasdiqlash kodi generatsiya qilish
    code = str(random.randint(100000, 999999))
    verification_codes[phone_number] = code
    
    response_text = (
        f"✅ <b>Telefon raqamingiz qabul qilindi:</b> <code>{phone_number}</code>\n\n"
        f"🔐 Sizning tasdiqlash kodingiz:\n"
        f"👉 <code>{code}</code> 👈\n\n"
        f"<i>Ushbu 6 xonali kodni saytdagi ro'yxatdan o'tish maydoniga kiriting.</i>"
    )
    
    await update.message.reply_html(response_text)


async def text_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Foydalanuvchi matn yozsa yo'l-yo'riq ko'rsatish"""
    user_text = update.message.text
    if "/start" in user_text:
        await start(update, context)
        return
        
    await update.message.reply_text(
        "Iltimos, tasdiqlash kodi olish uchun /start buyrug'ini bosing va telefon raqamingizni yuboring."
    )


def main():
    """Botni ishga tushiruvchi asosiy funksiya"""
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required; set it in the runtime environment.")
    print("Clinic_Booking_System_bot Telegram Boti ishga tushmoqda...")
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.CONTACT, contact_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_callback))

    print("Bot muvaffaqiyatli ishga tushdi va xabarlarni kutmoqda!")
    application.run_polling()


if __name__ == '__main__':
    main()
