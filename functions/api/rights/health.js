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
  if (!db) return json({ ok: false, status: 'degraded', error: 'RIGHTS_DB 未绑定。' }, 503);

  try {
    const [registrations, sites, verified, latest] = await Promise.all([
      db.prepare('SELECT COUNT(*) AS total FROM rights_registrations').first(),
      db.prepare("SELECT COUNT(*) AS total FROM site_registry WHERE status = 'ACTIVE'").first(),
      db.prepare('SELECT COUNT(*) AS total FROM site_registry WHERE dns_verified_at IS NOT NULL').first(),
      db.prepare('SELECT MAX(updated_at) AS updated_at FROM rights_registrations').first()
    ]);

    return json({
      ok: true,
      service: 'Bantan Rights',
      status: 'operational',
      generatedAt: new Date().toISOString(),
      database: {
        registrations: Number(registrations?.total || 0),
        activeSites: Number(sites?.total || 0),
        dnsVerified: Number(verified?.total || 0),
        latestUpdate: latest?.updated_at || null
      },
      endpoints: {
        health: '/api/rights/health',
        openapi: '/api/rights/openapi',
        siteStatus: '/api/rights/site-status',
        siteVerify: '/api/rights/site-verify',
        status: '/api/rights/status',
        siteBadge: '/api/rights/site-badge'
      }
    });
  } catch (error) {
    return json({ ok: false, status: 'degraded', error: error.message || '数据库查询失败。' }, 503);
  }
}
