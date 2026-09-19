const expected = [
  { code: 'BNT-SITE-2026-001', domain: 'bantan.online', project: '绊谈 · 万能枢纽' },
  { code: 'BNT-SITE-2026-002', domain: 'llllkk.online', project: '刘骐硕个人博客' },
  { code: 'BNT-SITE-2026-003', domain: 'rights.bantan.online', project: 'Bantan Rights 版权与授权中心' }
];

const failures = [];
const bases = [
  'https://rights.bantan.online',
  'https://bnatan7.pages.dev'
];

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function lookup(item) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    for (const base of bases) {
      const url = new URL('/api/rights/site-status', base);
      url.searchParams.set('code', item.code);
      url.searchParams.set('domain', item.domain);
      try {
        const response = await fetch(url, {
          headers: { accept: 'application/json' },
          redirect: 'follow'
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`HTTP ${response.status}: expected JSON, received ${text.slice(0, 40).replace(/\s+/g, ' ')}`);
        }
        if (response.ok && data.ok) return { data, base };
        throw new Error(data.error || `HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    if (attempt < 3) await sleep(2000);
  }
  throw lastError || new Error('Registry lookup failed');
}

for (const item of expected) {
  try {
    const { data, base } = await lookup(item);
    if (data.item.site_code !== item.code || data.item.domain !== item.domain) {
      failures.push(`${item.code} + ${item.domain}: registry mismatch`);
    }
    if (item.project && data.item.project_name !== item.project) {
      failures.push(`${item.code}: expected project ${item.project}, received ${data.item.project_name}`);
    }
    if (!failures.length) console.log(`✓ ${item.code} + ${item.domain} via ${base}`);
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
