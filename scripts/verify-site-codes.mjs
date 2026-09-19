const expected = [
  { code: 'BNT-SITE-2026-001', domain: 'bantan.online', project: '绊谈 · 万能枢纽' },
  { code: 'BNT-SITE-2026-002', domain: 'llllkk.online', project: '刘骐硕个人博客' },
  { code: 'BNT-SITE-2026-003', domain: 'rights.bantan.online', project: 'Bantan Rights 版权与授权中心' }
];

const failures = [];

for (const item of expected) {
  const url = new URL('https://rights.bantan.online/api/rights/site-status');
  url.searchParams.set('code', item.code);
  url.searchParams.set('domain', item.domain);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      failures.push(`${item.code} + ${item.domain}: HTTP ${response.status}`);
      continue;
    }
    if (data.item.site_code !== item.code || data.item.domain !== item.domain) {
      failures.push(`${item.code} + ${item.domain}: registry mismatch`);
    }
    if (item.project && data.item.project_name !== item.project) {
      failures.push(`${item.code}: expected project ${item.project}, received ${data.item.project_name}`);
    }
  } catch (error) {
    failures.push(`${item.code} + ${item.domain}: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`Official site code verification failed with ${failures.length} issue(s):`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Verified ${expected.length} official site codes.`);
