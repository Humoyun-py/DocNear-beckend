/**
 * DocNear / Clinic Booking System Telegram Auth Bot (Node.js)
 * 
 * O'rnatish:
 * npm install node-telegram-bot-api
 * 
 * Ishga tushirish:
 * node telegram_bot.js
 */

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required; set it in the runtime environment.');
  process.exit(1);
}

// Botni polling rejimida yoqish
const bot = new TelegramBot(token, { polling: true });

console.log('Clinic_Booking_System_bot muvaffaqiyatli ishga tushdi...');

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Foydalanuvchi';

  const opts = {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Telefon raqamni yuborish',
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
    parse_mode: 'HTML',
  };

  bot.sendMessage(
    chatId,
    `Assalomu alaykum, <b>${firstName}</b>!\n\n<b>Clinic Booking System (DocNear)</b> tasdiqlash botiga xush kelibsiz.\n\nRo'yxatdan o'tishni yakunlash uchun quyidagi <b>'Telefon raqamni yuborish'</b> tugmasini bosing:`,
    opts
  );
});

// Kontakt (telefon raqam) kelganda
bot.on('contact', (msg) => {
  const chatId = msg.chat.id;
  const phone = msg.contact.phone_number.startsWith('+') 
    ? msg.contact.phone_number 
    : '+' + msg.contact.phone_number;

  // 6 xonali tasdiqlash kodi
  const code = Math.floor(100000 + Math.random() * 900000);

  const response = `
<b>Telefon raqamingiz qabul qilindi:</b> <code>${phone}</code>

Sizning 6 xonali tasdiqlash kodingiz:
<code>${code}</code>

<i>Ushbu kodni ro'yxatdan o'tish oynasiga kiriting.</i>
  `.trim();

  bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
});
