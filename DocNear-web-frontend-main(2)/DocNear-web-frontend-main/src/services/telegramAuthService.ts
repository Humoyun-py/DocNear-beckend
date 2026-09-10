export interface TelegramAuthSession {
  sessionId: string;
  phone: string;
  firstName: string;
  lastName: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  botUsername: string;
  botDeepLink: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  type?: 'text' | 'contact_button' | 'code_card' | 'action_button';
}

const STORAGE_SESSION_KEY = 'docnear_tg_auth_session';
const DEFAULT_BOT_USERNAME = 'Clinic_Booking_System_bot';

export const telegramAuthService = {
 getBotUsername(): string { return import.meta.env.VITE_TELEGRAM_BOT_USERNAME || ''; },
 startVerification(_phone:string,_first:string,_last:string): TelegramAuthSession { throw new Error('Use password sign-in. Telegram is linked after login.'); },
 getActiveSession(_phone?:string): TelegramAuthSession|null { return null; },
 verifyCode(_phone:string,_code:string) { return {success:false,message:'Telegram codes cannot authenticate this application.'}; },
 resendCode(phone:string,first:string,last:string) { return this.startVerification(phone,first,last); }
};
