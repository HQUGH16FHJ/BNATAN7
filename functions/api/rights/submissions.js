function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function authorized(context) {
  const expected = context.env.RIGHTS_ADMIN_TOKEN;
  const provided = context.request.headers.get('x-admin-token') || '';
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function onRequestGet(context) {
  if (!authorized(context)) return json({ ok: false, error: '管理密钥错误。' }, 401);
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);

  const url = new URL(context.request.url);
  const status = (url.searchParams.get('status') || '').trim();
  const search = (url.searchParams.get('search') || '').trim();
  const conditions = [];
  const values = [];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    values.push(status);
  }
  if (search) {
    conditions.push('(project_name LIKE ? OR owner LIKE ? OR registration_code LIKE ? OR domains LIKE ?)');
    const like = '%' + search + '%';
    values.push(like, like, like, like);
  }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const statement = db.prepare(`SELECT * FROM rights_registrations${where} ORDER BY created_at DESC LIMIT 200`);
  const result = values.length ? await statement.bind(...values).all() : await statement.all();
  return json({ ok: true, items: result.results || [] });
}

export async function onRequestPatch(context) {
  if (!authorized(context)) return json({ ok: false, error: '管理密钥错误。' }, 401);
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);

  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return json({ ok: false, error: '请求格式错误。' }, 400);
  }

  const id = String(body.id || '').trim();
  const status = String(body.status || '').trim();
  const reviewNote = String(body.reviewNote || '').trim().slice(0, 2000);
  const allowed = new Set(['待审核', '审核中', '已通过', '已驳回', '已归档']);
  if (!id || !allowed.has(status)) return json({ ok: false, error: '参数错误。' }, 400);

  await db.prepare('UPDATE rights_registrations SET status = ?, review_note = ?, updated_at = ? WHERE id = ?')
    .bind(status, reviewNote || null, new Date().toISOString(), id)
    .run();
  return json({ ok: true });
}
