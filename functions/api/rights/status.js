import { ensureSiteCode, normalizeDomain } from './site-code.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });
}

export async function onRequestGet(context) {
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);

  const url = new URL(context.request.url);
  const code = String(url.searchParams.get('code') || '').trim().toUpperCase();
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
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
