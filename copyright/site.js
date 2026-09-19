(function () {
  'use strict';

  const form = document.getElementById('siteLookupForm');
  const result = document.getElementById('siteLookupResult');

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function render(item) {
    result.dataset.state = item.status === 'ACTIVE' ? 'approved' : 'pending';
    result.innerHTML = `
      <article class="tracking-case">
        <header class="tracking-case__head">
          <div><span>REGISTERED SITE · ${escapeHtml(item.site_code)}</span><h2>${escapeHtml(item.project_name)}</h2></div>
          <i class="tracking-status" data-status="${item.status === 'ACTIVE' ? '已通过' : '审核中'}">${item.status === 'ACTIVE' ? 'REGISTERED' : item.status}</i>
        </header>
        <div class="tracking-case__summary">
          <div class="tracking-case__stamp">✓</div>
          <div><span>已匹配私有登记记录</span><p>该网站由提交人自主申报并登记在 Bantan Rights 私有数据库，可核对以下声明信息。</p></div>
        </div>
        <div class="tracking-facts">
          <div><span>官网编号</span><strong>${escapeHtml(item.site_code)}</strong></div>
          <div><span>官方域名</span><strong>${escapeHtml(item.domain || '--')}</strong></div>
          <div><span>版权所有者</span><strong>${escapeHtml(item.owner)}</strong></div>
          <div><span>制作方</span><strong>${escapeHtml(item.producer || '--')}</strong></div>
          <div><span>许可证</span><strong>${escapeHtml(item.license || '--')}</strong></div>
          <div><span>登记状态</span><strong>${escapeHtml(item.status)}</strong></div>
          <div><span>域名所有权</span><strong>${item.dns_verified_at ? 'DNS 已验证' : '仅编号验证'}</strong></div>
          <div><span>登记时间</span><strong>${escapeHtml(new Date(item.registered_at).toLocaleString('zh-CN', { hour12: false }))}</strong></div>
          <div><span>版权档案</span><strong>${escapeHtml(item.rights_registration_code || '--')}</strong></div>
        </div>
        <section class="tracking-review" style="border-color:rgba(52,211,153,.2);background:rgba(52,211,153,.045);">
          <span>VERIFICATION NOTE</span><h3>编号是公开标识，不是保密密钥</h3>
          <p>Bantan Rights 是绊谈维护的私有网站权属声明登记与版权登记系统；不属于国家行政机关、政府认证机构或国家版权登记平台。本页结果仅用于核对绊谈自主登记信息；所有资料由提交人自行申报，本站不做实质真实性核验；不构成国家认证、行政认定或司法证明。</p>
          <div class="tracking-site-code__actions">
            <a href="./certificate.html?code=${encodeURIComponent(item.site_code)}&domain=${encodeURIComponent(item.domain || '')}">查看版权证书</a>
          </div>
        </section>
      </article>
    `;
  }

  function loading() {
    result.dataset.state = 'loading';
    result.innerHTML = '<div class="status-result__placeholder"><div class="status-result__radar is-loading"><i></i></div><div><span>VERIFYING SITE</span><h2>正在验证官网编号</h2><p>查询官网登记数据库。</p></div></div>';
  }

  function error(message) {
    result.dataset.state = 'error';
    result.innerHTML = `<div class="status-result__placeholder"><div class="status-result__radar is-error"><i>!</i></div><div><span>VERIFICATION FAILED</span><h2>未找到官网记录</h2><p>${escapeHtml(message)}</p></div></div>`;
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const code = document.getElementById('siteCodeInput').value.trim();
    const domain = document.getElementById('siteDomainInput').value.trim();
    if (!code && !domain) {
      error('请至少输入官网编号或域名。');
      return;
    }
    loading();
    try {
      const url = new URL('/api/rights/site-status', location.origin);
      if (code) url.searchParams.set('code', code);
      if (domain) url.searchParams.set('domain', domain);
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '验证失败');
      render(data.item);
    } catch (errorValue) {
      error(errorValue.message);
    }
  });

  const initialCode = new URLSearchParams(location.search).get('code');
  const initialDomain = new URLSearchParams(location.search).get('domain');
  if (initialCode || initialDomain) {
    if (initialCode) document.getElementById('siteCodeInput').value = initialCode.trim();
    if (initialDomain) document.getElementById('siteDomainInput').value = initialDomain.trim();
    form?.requestSubmit();
  }
})();
