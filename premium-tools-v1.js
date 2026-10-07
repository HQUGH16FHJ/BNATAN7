(function () {
  'use strict';

  const tool = document.body.dataset.premiumTool;

  async function probe(url) {
    const started = performance.now();
    try {
      await fetch(url + (url.includes('?') ? '&' : '?') + 'bnt-probe=' + Date.now(), {
        mode: 'no-cors',
        cache: 'no-store'
      });
      return { online: true, latency: Math.max(1, Math.round(performance.now() - started)) };
    } catch (error) {
      return { online: false, latency: null };
    }
  }

  function setServiceCard(name, state, copy, latency) {
    const card = document.querySelector(`[data-service-card="${name}"]`);
    if (!card) return;
    card.dataset.state = state;
    const copyNode = card.querySelector('[data-service-copy]');
    const latencyNode = card.querySelector('[data-service-latency]');
    if (copyNode) copyNode.textContent = copy;
    if (latencyNode) latencyNode.textContent = latency ? latency + ' MS' : '--';
  }

  async function probeJson(url) {
    const started = performance.now();
    try {
      const response = await fetch(url + (url.includes('?') ? '&' : '?') + 'bnt-probe=' + Date.now(), {
        cache: 'no-store',
        headers: { accept: 'application/json' }
      });
      const data = await response.json();
      return {
        online: response.ok && data.ok !== false,
        latency: Math.max(1, Math.round(performance.now() - started)),
        data
      };
    } catch (error) {
      return { online: false, latency: null, data: null };
    }
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem('bantan_status_history_v1') || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem('bantan_status_history_v1', JSON.stringify(history.slice(-24)));
    } catch (error) {}
  }

  function updateUptime(history) {
    const node = document.querySelector('[data-status-uptime]');
    if (!node) return;
    if (!history.length) {
      node.textContent = '--';
      return;
    }
    const total = history.reduce((sum, item) => sum + Number(item.ratio || 0), 0);
    node.textContent = Math.round(total / history.length * 100) + '%';
  }

  async function runStatus() {
    const items = Array.from(document.querySelectorAll('.endpoint-item[data-url]'));
    if (!items.length) return;

    let onlineCount = 0;
    for (const item of items) {
      item.dataset.state = 'checking';
      item.querySelector('.endpoint-status').textContent = 'CHECKING';
      const result = await probe(item.dataset.url);
      item.dataset.state = result.online ? 'online' : 'offline';
      item.querySelector('.endpoint-status').textContent = result.online ? 'ONLINE' : 'UNREACHABLE';
      item.querySelector('.endpoint-latency').textContent = result.latency ? result.latency + ' MS' : '--';
      if (result.online) onlineCount += 1;
    }

    const metric = document.querySelector('[data-status-summary]');
    if (metric) metric.textContent = onlineCount + '/' + items.length;
    const updated = document.querySelector('[data-status-updated]');
    if (updated) updated.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });

    const [rights, openapi, traceText] = await Promise.all([
      probeJson('https://rights.bantan.online/api/rights/health'),
      probeJson('https://rights.bantan.online/api/rights/openapi'),
      fetch('https://bantan.online/cdn-cgi/trace?bnt-probe=' + Date.now(), { cache: 'no-store' })
        .then((response) => response.text())
        .catch(() => '')
    ]);

    const firstWeb = document.querySelector('.endpoint-item[data-url="https://bantan.online/"]')?.dataset.state === 'online';
    setServiceCard('web', firstWeb ? 'online' : 'offline', firstWeb ? '主站页面可达，静态入口正常。' : '主站页面当前无法从本网络访问。', null);
    setServiceCard('rights', rights.online ? 'online' : 'offline', rights.online ? '健康接口与版权数据库连接正常。' : '版权健康接口当前不可达。', rights.latency);
    setServiceCard('api', openapi.online ? 'online' : 'offline', openapi.online ? 'OpenAPI 文档和公开接口可达。' : '公开开发者接口当前不可达。', openapi.latency);

    const trace = Object.fromEntries(
      traceText.split('\n').map((line) => line.split('=')).filter((parts) => parts.length >= 2)
    );
    const networkOnline = Boolean(trace.colo);
    setServiceCard('network', networkOnline ? 'online' : 'offline', networkOnline ? 'Cloudflare 边缘节点和 DNS 路由正常。' : '无法读取当前边缘节点。', null);
    const colo = document.querySelector('[data-edge-colo]');
    const country = document.querySelector('[data-edge-country]');
    const edgeUpdated = document.querySelector('[data-edge-updated]');
    if (colo) colo.textContent = trace.colo || '--';
    if (country) country.textContent = trace.loc || '--';
    if (edgeUpdated) edgeUpdated.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });

    const history = readHistory();
    history.push({
      at: new Date().toISOString(),
      ratio: items.length ? onlineCount / items.length : 0
    });
    saveHistory(history);
    updateUptime(history.slice(-24));
  }

  function normalizeHost(value) {
    const raw = value.trim();
    if (!raw) return '';
    try {
      return new URL(raw.includes('://') ? raw : 'https://' + raw).hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  function runVerify() {
    const form = document.getElementById('verifyForm');
    const input = document.getElementById('verifyInput');
    const result = document.getElementById('verifyResult');
    if (!form || !input || !result) return;
    const official = new Set(['bantan.online', 'bantan.eu.cc', 'bnatan7.pages.dev']);

    form.addEventListener('submit', event => {
      event.preventDefault();
      const host = normalizeHost(input.value);
      result.classList.add('is-visible');
      if (!host) {
        result.dataset.result = 'unknown';
        result.innerHTML = '<strong>无法识别这个地址</strong><p>请输入完整网址，例如 https://bantan.online/。</p>';
        return;
      }
      const isOfficial = official.has(host);
      result.dataset.result = isOfficial ? 'official' : 'unknown';
      result.innerHTML = isOfficial
        ? '<strong>这是绊谈官方入口</strong><p>' + host + ' 已通过官方域名列表验证。</p>'
        : '<strong>未在官方域名列表中找到</strong><p>' + host + ' 不是当前登记的官方入口，请谨慎输入账号或敏感信息。</p>';
    });
  }

  function runOffline() {
    const label = document.getElementById('offlineStatus');
    const update = () => {
      if (!label) return;
      label.textContent = navigator.onLine ? '网络连接已恢复，可以重新加载页面。' : '当前离线，已缓存页面仍可访问。';
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    document.getElementById('offlineRetry')?.addEventListener('click', () => location.reload());
  }

  function runBrand() {
    document.querySelectorAll('[data-copy-text]').forEach(button => {
      button.addEventListener('click', async () => {
        const text = button.dataset.copyText;
        try {
          await navigator.clipboard.writeText(text);
          const original = button.textContent;
          button.textContent = '已复制';
          setTimeout(() => { button.textContent = original; }, 1400);
        } catch (error) {}
      });
    });
  }

  if (tool === 'status') {
    runStatus();
    setInterval(runStatus, 60000);
  }
  if (tool === 'verify') runVerify();
  if (tool === 'offline') runOffline();
  if (tool === 'brand') runBrand();
})();
