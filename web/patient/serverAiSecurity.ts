import type { RequestHandler } from 'express';

export function aiSecurity({ enabled, apiBase, verify = fetch }: { enabled: () => boolean; apiBase: string; verify?: typeof fetch }): RequestHandler {
  const requests = new Map<string, { count: number; expires: number }>();
  return async (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key);
    // Trust the socket peer, never arbitrary forwarded headers.
    const key = req.socket.remoteAddress || 'unknown';
    const entry = requests.get(key) || { count: 0, expires: now + 60000 };
    if (entry.count >= 10 || (!requests.has(key) && requests.size >= 10000)) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({ error: 'Juda ko‘p so‘rov. Birozdan keyin qayta urinib ko‘ring.' });
      return;
    }
    entry.count++;
    requests.set(key, entry);
    if (!enabled()) { next(); return; }
    const authorization = req.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'AI xizmatidan foydalanish uchun hisobingizga kiring.' });
      return;
    }
    try {
      const response = await verify(apiBase.replace(/\/$/, '') + '/auth/me/', {
        headers: { Authorization: authorization }, signal: AbortSignal.timeout(5000), redirect: 'error',
      });
      if (!response.ok) { res.status(401).json({ error: 'Sessiya tugadi. Qayta kiring.' }); return; }
      const body = await response.json();
      if (body.success !== true || body.data?.role !== 'patient') {
        res.status(403).json({ error: 'Bemor hisobi talab qilinadi.' }); return;
      }
      next();
    } catch {
      res.status(503).json({ error: 'Xizmat vaqtincha mavjud emas.' });
    }
  };
}
