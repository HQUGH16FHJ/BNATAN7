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

  if (tool === 'status') runStatus();
  if (tool === 'verify') runVerify();
  if (tool === 'offline') runOffline();
  if (tool === 'brand') runBrand();
})();
