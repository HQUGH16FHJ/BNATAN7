import { ensureSiteCode } from './site-code.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
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
    SELECT id, registration_code, site_code, project_name, status, review_note, created_at, updated_at
    FROM rights_registrations
    WHERE registration_code = ? AND lower(contact) = ?
    LIMIT 1
  `).bind(code, email).first();

  if (!result) return json({ ok: false, error: '没有找到匹配的登记申请，请核对编号和邮箱。' }, 404);
  if (result.status === '已通过' && !result.site_code) {
    result.site_code = await ensureSiteCode(db, result.id);
  }
  delete result.id;
  return json({ ok: true, item: result });
}
