import { ensureSiteCode, normalizeDomain } from './site-code.js';
import { enforceRateLimit, isAllowedOrigin } from './rate-limit.js';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      ...extraHeaders
    }
  });
}

async function lookup(context, code, email) {
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);
  if (!code || !email) return json({ ok: false, error: '请输入登记编号和联系邮箱。' }, 400);

  const result = await db.prepare(`
    SELECT rr.id, rr.registration_code, rr.site_code, rr.project_name, rr.status,
           rr.review_note, rr.created_at, rr.updated_at, rr.domains,
           sr.domain AS site_domain
    FROM rights_registrations rr
    LEFT JOIN site_registry sr ON sr.site_code = rr.site_code
    WHERE rr.registration_code = ? AND lower(rr.contact) = ?
    LIMIT 1
  `).bind(code, email).first();

  if (!result) return json({ ok: false, error: '没有找到匹配的登记申请，请核对编号和邮箱。' }, 404);
  if (result.status === '已通过' && !result.site_code) {
    result.site_code = await ensureSiteCode(db, result.id);
  }
  if (!result.site_domain) result.site_domain = normalizeDomain(result.domains) || null;
  delete result.id;
  delete result.domains;
  return json({ ok: true, item: result });
}

export async function onRequestPost(context) {
  if (!isAllowedOrigin(context)) return json({ ok: false, error: '请求来源未获授权。' }, 403);
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);
  const rateLimit = await enforceRateLimit(db, context, {
    scope: 'rights-status',
    limit: 30,
    windowSeconds: 3600
  });
  if (!rateLimit.allowed) {
    return json(
      { ok: false, error: '查询过于频繁，请稍后再试。' },
      429,
      { 'retry-after': String(rateLimit.retryAfter) }
    );
  }
  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return json({ ok: false, error: '查询格式错误。' }, 400);
  }
  const code = String(body.code || '').trim().toUpperCase();
  const email = String(body.email || '').trim().toLowerCase();
  return lookup(context, code, email);
}

export async function onRequestGet() {
  return json({ ok: false, error: '请使用 POST 查询，避免邮箱出现在地址栏。' }, 405);
}
