import { normalizeDomain } from './site-code.js';

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

async function getRecord(db, code, domain) {
  return db.prepare(`
    SELECT site_code, domain, dns_token, dns_verified_at
    FROM site_registry
    WHERE site_code = ? AND lower(domain) = ?
    LIMIT 1
  `).bind(code, domain).first();
}

function tokenValue(token) {
  return `bantan-site-verification=${token}`;
}

function txtValues(answer) {
  const raw = String(answer?.data || '').trim();
  const chunks = raw.match(/"((?:\\.|[^"])*)"/g) || [];
  if (chunks.length) {
    return chunks.map(chunk => chunk.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
  }
  return [raw.replace(/^"|"$/g, '')];
}

export async function onRequestGet(context) {
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);

  const url = new URL(context.request.url);
  const code = String(url.searchParams.get('code') || '').trim().toUpperCase();
  const domain = normalizeDomain(url.searchParams.get('domain'));
  if (!code || !domain) return json({ ok: false, error: '官网编号和域名不能为空。' }, 400);

  const record = await getRecord(db, code, domain);
  if (!record) return json({ ok: false, error: '官网编号与域名不匹配。' }, 404);

  let token = record.dns_token;
  if (!token) {
    token = crypto.randomUUID().replace(/-/g, '');
    await db.prepare('UPDATE site_registry SET dns_token = ?, updated_at = ? WHERE site_code = ?')
      .bind(token, new Date().toISOString(), code)
      .run();
  }

  return json({
    ok: true,
    verified: Boolean(record.dns_verified_at),
    verifiedAt: record.dns_verified_at || null,
    recordName: `_bantan-verify.${record.domain}`,
    recordType: 'TXT',
    recordValue: tokenValue(token)
  });
}

export async function onRequestPost(context) {
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);

  const url = new URL(context.request.url);
  const code = String(url.searchParams.get('code') || '').trim().toUpperCase();
  const domain = normalizeDomain(url.searchParams.get('domain'));
  if (!code || !domain) return json({ ok: false, error: '官网编号和域名不能为空。' }, 400);

  const record = await getRecord(db, code, domain);
  if (!record) return json({ ok: false, error: '官网编号与域名不匹配。' }, 404);
  if (!record.dns_token) return json({ ok: false, error: '验证令牌尚未生成，请刷新后重试。' }, 409);

  const recordName = `_bantan-verify.${record.domain}`;
  let dnsData;
  try {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(recordName)}&type=TXT`, {
      headers: { accept: 'application/dns-json' }
    });
    if (!response.ok) throw new Error('DNS_LOOKUP_FAILED');
    dnsData = await response.json();
  } catch (error) {
    return json({ ok: false, verified: false, error: '暂时无法查询 DNS，请稍后重试。' }, 502);
  }

  const expected = tokenValue(record.dns_token);
  const verified = (dnsData.Answer || []).some(answer => txtValues(answer).includes(expected));
  const now = new Date().toISOString();
  await db.prepare('UPDATE site_registry SET dns_verified_at = ?, updated_at = ? WHERE site_code = ?')
    .bind(verified ? now : null, now, code)
    .run();

  return json({
    ok: true,
    verified,
    verifiedAt: verified ? now : null,
    recordName,
    recordType: 'TXT',
    recordValue: expected,
    message: verified ? '域名所有权验证通过。' : '暂未检测到匹配的 TXT 记录，请等待 DNS 生效后重试。'
  });
}
