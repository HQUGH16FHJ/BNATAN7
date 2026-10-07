const RATE_LIMIT_TABLE = 'bantan_public_rate_limits';

async function hashKey(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isAllowedOrigin(context, allowedHosts = ['bantan.online', 'www.bantan.online', 'rights.bantan.online']) {
  const origin = context.request.headers.get('origin');
  if (!origin) return true;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return allowedHosts.some((host) => hostname === host || hostname.endsWith('.' + host));
  } catch (error) {
    return false;
  }
}

export async function enforceRateLimit(db, context, options) {
  const limit = Number(options.limit || 10);
  const windowSeconds = Number(options.windowSeconds || 3600);
  const scope = String(options.scope || 'public');
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const forwarded = context.request.headers.get('x-forwarded-for') || '';
  const ip = context.request.headers.get('cf-connecting-ip') || forwarded.split(',')[0].trim() || 'unknown';
  const userAgent = context.request.headers.get('user-agent') || 'unknown';
  const fingerprint = await hashKey(`${scope}|${ip}|${userAgent}`);

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ${RATE_LIMIT_TABLE} (
      fingerprint TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      hits INTEGER NOT NULL DEFAULT 0,
      scope TEXT NOT NULL,
      PRIMARY KEY (fingerprint, window_start)
    )
  `).run();

  const current = await db.prepare(`
    SELECT hits FROM ${RATE_LIMIT_TABLE}
    WHERE fingerprint = ? AND window_start = ?
    LIMIT 1
  `).bind(fingerprint, windowStart).first();

  if (current && Number(current.hits) >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, windowStart + windowSeconds - now)
    };
  }

  await db.prepare(`
    INSERT INTO ${RATE_LIMIT_TABLE} (fingerprint, window_start, hits, scope)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(fingerprint, window_start)
    DO UPDATE SET hits = hits + 1
  `).bind(fingerprint, windowStart, scope).run();

  if (Math.random() < 0.02) {
    await db.prepare(`DELETE FROM ${RATE_LIMIT_TABLE} WHERE window_start < ?`).bind(now - 172800).run();
  }

  return { allowed: true, retryAfter: 0 };
}
