(function () {
  'use strict';

  const page = document.currentScript?.dataset.page;
  const endpoints = [
    { method: 'GET', path: '/api/rights/health', title: '服务状态', test: '/api/rights/health' },
    { method: 'GET', path: '/api/rights/openapi', title: 'OpenAPI 文档', test: '/api/rights/openapi' },
    { method: 'GET', path: '/api/rights/site-status?code=BNT-SITE-2026-001&domain=bantan.online', title: '官网编号查询', test: '/api/rights/site-status?code=BNT-SITE-2026-001&domain=bantan.online' },
    { method: 'GET', path: '/api/rights/site-verify?code=BNT-SITE-2026-001&domain=bantan.online', title: 'DNS 验证读取', test: '/api/rights/site-verify?code=BNT-SITE-2026-001&domain=bantan.online' },
    { method: 'POST', path: '/api/rights/site-verify?code=BNT-SITE-2026-001&domain=bantan.online', title: 'DNS 所有权检测', test: '/api/rights/site-verify?code=BNT-SITE-2026-001&domain=bantan.online', post: true },
    { method: 'GET', path: '/api/rights/site-badge?code=BNT-SITE-2026-001&domain=bantan.online&theme=dark', title: '动态认证徽章', test: '/api/rights/site-badge?code=BNT-SITE-2026-001&domain=bantan.online&theme=dark' }
  ];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  async function testEndpoint(endpoint) {
    const output = document.getElementById('apiResponse');
    if (!output) return;
    output.textContent = `正在请求 ${endpoint.path}`;
    try {
      const response = await fetch(endpoint.test, { method: endpoint.post ? 'POST' : 'GET', cache: 'no-store' });
      const type = response.headers.get('content-type') || '';
      const body = type.includes('json') ? JSON.stringify(await response.json(), null, 2) : await response.text();
      output.textContent = `HTTP ${response.status}\n${body}`;
    } catch (error) {
      output.textContent = `请求失败：${error.message}`;
    }
  }

  async function initApi() {
    const container = document.getElementById('apiEndpoints');
    if (!container) return;
    container.innerHTML = endpoints.map((endpoint, index) => `
      <article class="api-endpoint">
        <header><b>${endpoint.method}</b><code>${escapeHtml(endpoint.path)}</code></header>
        <p>${escapeHtml(endpoint.title)}</p>
        <button type="button" data-endpoint="${index}">测试接口</button>
      </article>
    `).join('');
    container.addEventListener('click', event => {
      const button = event.target.closest('[data-endpoint]');
      if (button) testEndpoint(endpoints[Number(button.dataset.endpoint)]);
    });
    try {
      const response = await fetch('/api/rights/health', { cache: 'no-store' });
      const data = await response.json();
      document.getElementById('apiHealth').textContent = data.ok ? 'ONLINE' : 'DEGRADED';
    } catch {
      document.getElementById('apiHealth').textContent = 'OFFLINE';
    }
  }

  async function check(name, url, type = 'fetch') {
    const started = performance.now();
    try {
      if (type === 'image') {
        await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = reject;
          image.src = url + (url.includes('?') ? '&' : '?') + 'health=' + Date.now();
        });
      } else {
        await fetch(url, { mode: 'no-cors', cache: 'no-store' });
      }
      return { status: 'ok', duration: Math.round(performance.now() - started) };
    } catch {
      return { status: 'error', duration: Math.round(performance.now() - started) };
    }
  }

  async function initOps() {
    const metrics = document.getElementById('opsMetrics');
    const checks = document.getElementById('opsChecks');
    if (!metrics || !checks) return;
    const healthResponse = await fetch('/api/rights/health', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
    document.getElementById('opsStatus').textContent = healthResponse?.ok ? 'OPERATIONAL' : 'DEGRADED';
    metrics.innerHTML = healthResponse?.ok ? `
      <article class="ops-metric"><span>登记申请</span><strong>${healthResponse.database.registrations}</strong></article>
      <article class="ops-metric"><span>有效网站</span><strong>${healthResponse.database.activeSites}</strong></article>
      <article class="ops-metric"><span>DNS 已验证</span><strong>${healthResponse.database.dnsVerified}</strong></article>
      <article class="ops-metric"><span>数据库</span><strong>ONLINE</strong></article>
    ` : '<article class="ops-metric"><span>状态</span><strong>OFFLINE</strong></article>';

    const targets = [
      ['Bantan Rights', '/api/rights/health'],
      ['OpenAPI', '/api/rights/openapi'],
      ['bantan.online', 'https://bantan.online/favicon.svg', 'image'],
      ['llllkk.online', 'https://llllkk.online/', 'fetch'],
      ['动态徽章', '/api/rights/site-badge?code=BNT-SITE-2026-001&domain=bantan.online&theme=dark', 'image']
    ];
    checks.innerHTML = '<article class="ops-check" data-status="pending"><i></i><div><strong>正在检测</strong><small>等待全部结果</small></div></article>';
    const results = await Promise.all(targets.map(async ([name, url, type]) => ({ name, url, ...(await check(name, url, type)) })));
    checks.innerHTML = results.map(item => `
      <article class="ops-check" data-status="${item.status}">
        <i></i>
        <div><strong>${escapeHtml(item.name)}</strong><small>${item.status === 'ok' ? '可访问' : '检测失败'} · ${escapeHtml(item.url)}</small></div>
        <time>${item.duration} ms</time>
      </article>
    `).join('');
  }

  if (page === 'api') initApi();
  if (page === 'ops') {
    initOps();
    document.getElementById('refreshOps')?.addEventListener('click', initOps);
  }
})();
