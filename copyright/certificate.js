(function () {
  'use strict';

  const paper = document.getElementById('certificatePaper');

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function errorMarkup(message) {
    return `
      <div class="certificate-error">
        <h1>无法生成证书</h1>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  async function render(item) {
    const verified = Boolean(item.dns_verified_at);
    const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false });
    const fingerprint = await sha256([
      item.site_code,
      item.domain,
      item.project_name,
      item.owner,
      item.producer || '',
      item.license || '',
      item.rights_registration_code || ''
    ].join('|'));
    paper.innerHTML = `
      <div class="certificate-inner">
        <header class="certificate-head">
          <div class="certificate-brand">
            <span class="certificate-brand__mark">绊</span>
            <div><strong>Bantan Rights</strong><small>OFFICIAL SITE CERTIFICATE</small></div>
          </div>
          <i class="certificate-status ${verified ? '' : 'is-code-only'}">${verified ? 'DOMAIN VERIFIED' : 'CODE VERIFIED'}</i>
        </header>
        <h1 class="certificate-title">版权验证证书</h1>
        <p class="certificate-subtitle">Bantan Rights 是绊谈维护的私有网站权属声明登记与版权登记系统；不属于国家行政机关、政府认证机构或国家版权登记平台。本证书仅用于核对绊谈自主登记信息；所有资料由提交人自行申报，本站不做实质真实性核验；不构成国家认证、行政认定或司法证明。</p>
        <dl class="certificate-grid">
          <div><dt>官网编号</dt><dd class="is-code">${escapeHtml(item.site_code)}</dd></div>
          <div><dt>官方域名</dt><dd>${escapeHtml(item.domain || '--')}</dd></div>
          <div><dt>项目名称</dt><dd>${escapeHtml(item.project_name)}</dd></div>
          <div><dt>版权所有者</dt><dd>${escapeHtml(item.owner)}</dd></div>
          <div><dt>制作方 / 合作方</dt><dd>${escapeHtml(item.producer || '--')}</dd></div>
          <div><dt>许可证</dt><dd>${escapeHtml(item.license || '--')}</dd></div>
          <div><dt>版权登记编号</dt><dd class="is-code">${escapeHtml(item.rights_registration_code || '--')}</dd></div>
          <div><dt>域名所有权</dt><dd>${verified ? 'DNS 已验证' : '仅编号验证'}</dd></div>
          <div><dt>登记状态</dt><dd>${escapeHtml(item.status)}</dd></div>
          <div><dt>证书生成时间</dt><dd>${escapeHtml(generatedAt)}</dd></div>
        </dl>
        <div class="certificate-fingerprint">
          <span>SHA-256 CERTIFICATE FINGERPRINT</span>
          <strong>${fingerprint}</strong>
        </div>
        <footer class="certificate-foot">
          <p>证书信息来自 Bantan Rights 私有登记数据库。发生权利争议时，应以原始作品、创作记录、授权合同和适用法律为准。如有权属异议或需要移除登记，请联系 125668039@163.com 或 1429616034@qq.com。</p>
          <div class="certificate-seal">绊谈版权中心<br>2026</div>
        </footer>
      </div>
    `;
  }

  async function load() {
    const params = new URLSearchParams(location.search);
    const code = String(params.get('code') || '').trim();
    const domain = String(params.get('domain') || '').trim();
    if (!code || !domain) {
      paper.innerHTML = errorMarkup('缺少官网编号或域名参数。');
      return;
    }
    try {
      const url = new URL('/api/rights/site-status', location.origin);
      url.searchParams.set('code', code);
      url.searchParams.set('domain', domain);
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '读取失败');
      await render(data.item);
    } catch (error) {
      paper.innerHTML = errorMarkup(error.message);
    }
  }

  document.getElementById('certificatePrint')?.addEventListener('click', () => window.print());
  load();
})();
