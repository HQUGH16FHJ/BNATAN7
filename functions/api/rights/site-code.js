export function normalizeDomain(value) {
  return String(value || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}

export async function nextSiteCode(db) {
  const row = await db.prepare(`
    SELECT COALESCE(MAX(CAST(substr(site_code, 15) AS INTEGER)), 0) AS max_code
    FROM site_registry
  `).first();
  const next = Number(row?.max_code || 0) + 1;
  return 'BNT-SITE-' + new Date().getFullYear() + '-' + String(next).padStart(3, '0');
}

export async function ensureSiteCode(db, id) {
  const record = await db.prepare(`
    SELECT site_code, project_name, owner, producer, domains, license, registration_code
    FROM rights_registrations WHERE id = ? LIMIT 1
  `).bind(id).first();
  if (!record) return null;

  const domain = normalizeDomain(record.domains) || null;
  let siteCode = record.site_code;
  const now = new Date().toISOString();

  if (!siteCode && domain) {
    const existing = await db.prepare(`
      SELECT site_code FROM site_registry
      WHERE lower(domain) = ?
      LIMIT 1
    `).bind(domain).first();
    siteCode = existing?.site_code || null;
  }

  if (!siteCode) {
    siteCode = await nextSiteCode(db);
  }

  if (!record.site_code) {
    await db.prepare('UPDATE rights_registrations SET site_code = ?, updated_at = ? WHERE id = ?')
      .bind(siteCode, now, id)
      .run();
  }

  await db.prepare(`
    INSERT INTO site_registry (
      site_code, domain, project_name, owner, producer, license,
      rights_registration_code, dns_token, status, registered_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    ON CONFLICT(site_code) DO UPDATE SET
      domain = excluded.domain,
      project_name = excluded.project_name,
      owner = excluded.owner,
      producer = excluded.producer,
      license = excluded.license,
      rights_registration_code = excluded.rights_registration_code,
      status = 'ACTIVE',
      updated_at = excluded.updated_at
  `).bind(
    siteCode,
    domain,
    record.project_name,
    record.owner,
    record.producer || null,
    record.license || null,
    record.registration_code,
    crypto.randomUUID().replace(/-/g, ''),
    now,
    now
  ).run();

  return siteCode;
}
