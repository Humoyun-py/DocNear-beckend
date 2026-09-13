import { chromium, expect } from '@playwright/test';

// Only OTP responses are intercepted: no messages or real credentials are used.
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', headless: true });
try {
  for (const port of [3001, 3002, 3003, 3004]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let requests = 0;
    let rateLimited = true;
    await page.route('**/auth/request-otp/', route => {
      requests++;
      return route.fulfill({ status: rateLimited ? 429 : 200, contentType: 'application/json', body: JSON.stringify(rateLimited
        ? { success: false, code: 'too_many_requests', message: 'Please wait before retrying.', errors: {} }
        : { success: true, data: {} }) });
    });
    await page.route('**/auth/verify-otp/', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'invalid_otp', message: 'Kod noto‘g‘ri.', errors: {} }) }));
    await page.goto(`http://localhost:${port}/login`);
    await page.clock.install();
    await page.locator('input[type=tel]').fill('+998901234567');
    const send = page.getByRole('button', { name: 'Tasdiqlash kodini yuborish', exact: true });
    const telegram = page.getByRole('button', { name: 'Kodni Telegram orqali olish', exact: true });
    await send.click();
    await expect(page.getByText('Please wait before retrying.', { exact: true })).toBeVisible();
    await expect(send).toBeDisabled();
    await expect(telegram).toBeDisabled();
    expect(requests).toBe(1);
    rateLimited = false;
    for (let remaining = 59; remaining >= 0; remaining--) {
      await page.clock.runFor(1000);
      if (remaining > 0) await expect(page.getByRole('status')).toHaveText(`Qayta yuborish (${remaining}s)`);
    }
    await expect(send).toBeEnabled();
    await send.click();
    const code = page.locator('input[inputmode=numeric]');
    await expect(code).toBeVisible();
    await code.evaluate(element => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text', '12 34 56');
      element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    });
    await expect(code).toHaveValue('123456');
    await page.getByRole('button', { name: 'Tasdiqlash', exact: true }).click();
    await expect(page.getByText('Kod noto‘g‘ri.', { exact: true })).toBeVisible();
    await expect(code).toHaveValue('123456');
    await page.getByRole('button', { name: 'Telefon raqamini o‘zgartirish', exact: true }).click();
    await expect(page.locator('input[type=tel]')).toBeEditable();
    await expect(send).toBeDisabled();
    expect(errors).toEqual([]);
    console.log(`OTP UI ${port}: passed`);
    await page.close();
  }
} finally {
  await browser.close();
}
