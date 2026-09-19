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
  const domain = String(url.searchParams.get('domain') || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!code && !domain) return json({ ok: false, error: '请输入官网编号或域名。' }, 400);

  const statement = db.prepare(`
    SELECT site_code, domain, project_name, owner, producer, license,
           rights_registration_code, status, registered_at, updated_at
    FROM site_registry
    WHERE site_code = ? OR lower(domain) = ?
    LIMIT 1
  `);
  const result = await statement.bind(code || null, domain || null).first();
  if (!result) return json({ ok: false, error: '没有找到匹配的官网编号，请核对后重试。' }, 404);
  return json({ ok: true, item: result });
}
