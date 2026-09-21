import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiSecurity } from '../serverAiSecurity';

test('paid AI requires a backend-verified patient and limits repeated calls', async () => {
  let checks = 0;
  const middleware = aiSecurity({ enabled: () => true, apiBase: 'http://localhost/api/v1', verify: (async () => {
    checks++;
    return Response.json({ success: true, data: { role: 'patient' } });
  }) as typeof fetch });
  const call = async (token?: string) => {
    let status = 200, next = false;
    const response = { setHeader() {}, status(code: number) { status = code; return this; }, json() {} };
    await middleware({ socket: { remoteAddress: '127.0.0.1' }, get: () => token } as any, response as any, () => { next = true; });
    return { status, next };
  };
  assert.deepEqual(await call(), { status: 401, next: false });
  assert.equal(checks, 0);
  assert.deepEqual(await call('Bearer synthetic-test'), { status: 200, next: true });
  for (let i = 0; i < 8; i++) await call();
  assert.deepEqual(await call(), { status: 429, next: false });
});

test('AI fails closed for invalid tokens, staff roles and backend outages', async () => {
  for (const [verify, expected] of [
    [async () => new Response(null, { status: 401 }), 401],
    [async () => Response.json({ success: true, data: { role: 'admin' } }), 403],
    [async () => { throw new Error('private transport detail'); }, 503],
  ] as const) {
    let status = 200, next = false, body: unknown;
    const middleware = aiSecurity({ enabled: () => true, apiBase: 'http://localhost/api/v1', verify: verify as typeof fetch });
    const response = { setHeader() {}, status(code: number) { status = code; return this; }, json(value: unknown) { body = value; } };
    await middleware({ socket: { remoteAddress: '127.0.0.1' }, get: () => 'Bearer synthetic-test' } as any, response as any, () => { next = true; });
    assert.equal(status, expected);
    assert.equal(next, false);
    assert.ok(!JSON.stringify(body).includes('private transport detail'));
  }
});
