import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatUzPhoneInput, normalizeUzPhone } from '../src/utils/phone';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, 'window', { value: new EventTarget(), configurable: true });

test('Telegram handoff service posts names and returns backend bot URL', async () => {
  let requestPath = '';
  let requestBody: Record<string, string> = {};
  globalThis.fetch = async (url, init) => {
    requestPath = String(url);
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ success: true, data: { bot_url: 'https://t.me/test_bot?start=opaque' } }));
  };
  const { authService } = await import('../src/services/authService');
  const botUrl = await authService.createTelegramHandoff({
    phone: '+998901234567', purpose: 'register', firstName: 'Ali', lastName: 'Valiyev',
  });
  assert.match(requestPath, /auth\/telegram-handoff\/$/);
  assert.deepEqual(requestBody, {
    phone_number: '+998901234567', purpose: 'register', first_name: 'Ali', last_name: 'Valiyev',
  });
  assert.equal(botUrl, 'https://t.me/test_bot?start=opaque');
});

test('auth pages expose one primary handoff flow without direct Telegram OTP request', async () => {
  const source = await readFile(new URL('../src/pages/AuthPages.tsx', import.meta.url), 'utf8');
  assert.match(source, /Tasdiqlash kodini olish/);
  assert.match(source, /createTelegramHandoff/);
  assert.match(source, /noopener,noreferrer/);
  assert.match(source, /Telegram botni qayta ochish/);
  assert.doesNotMatch(source, /send\('telegram'\)/);
  assert.doesNotMatch(source, /requestOtp/);
  assert.doesNotMatch(source, /VITE_TELEGRAM_BOT_USERNAME/);
  assert.match(source, /verifyOtp/);
  assert.match(source, /account_already_exists/);
  assert.match(source, /Kirish sahifasiga o‘tish/);
  assert.match(source, /account_not_found/);
  assert.match(source, /Ro‘yxatdan o‘tish/);
  assert.ok(source.indexOf('await createTelegramHandoff') < source.indexOf('openTelegram(url)'));
});

test('Uzbek phone input masks typing and paste while API normalization stays compact', () => {
  for (const raw of ['+998200008839', '998200008839', '200008839']) {
    assert.equal(formatUzPhoneInput(raw), '+998 20 000 88 39');
  }
  assert.equal(normalizeUzPhone(formatUzPhoneInput('+998200008839')), '+998200008839');
  assert.equal(formatUzPhoneInput('abc'), '+998');
});
