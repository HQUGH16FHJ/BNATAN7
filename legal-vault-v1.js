(function () {
  'use strict';

  const pages = {
    'license.html': {
      title: '使用许可与版权声明',
      code: 'BNT-LEGAL-2026-LICENSE',
      domain: 'bantan.online'
    },
    'trust.html': {
      title: '信任中心',
      code: 'BNT-TRUST-2026-001',
      domain: 'bantan.online'
    },
    'security.html': {
      title: '安全说明',
      code: 'BNT-SECURITY-2026-001',
      domain: 'bantan.online'
    },
    'privacy.html': {
      title: '隐私说明',
      code: 'BNT-PRIVACY-2026-001',
      domain: 'bantan.online'
    },
    'domain.html': {
      title: '官方域名档案',
      code: 'BNT-DOMAIN-2026-001',
      domain: 'bantan.online'
    }
  };

  const file = location.pathname.split('/').pop() || 'index.html';
  const meta = pages[file];
  if (!meta) return;

  document.body.classList.add('legal-vault-page');
  const hero = document.querySelector('.lic-hero') || document.querySelector('.site-hero');
  if (!hero || hero.querySelector('.legal-vault-seal')) return;

  hero.classList.add('legal-vault-hero');
  hero.insertAdjacentHTML('beforeend', [
    '<div class="legal-vault-seal">',
    '  <div class="legal-vault-seal__mark">§</div>',
    '  <div>',
    '    <span>OFFICIAL POLICY ARCHIVE</span>',
    '    <strong>' + meta.title + '</strong>',
    '    <small>' + meta.code + ' · bantan.online</small>',
    '  </div>',
    '</div>',
    '<div class="legal-vault-meta">',
    '  <div><span>档案状态</span><strong>已发布 · 公开可查</strong></div>',
    '  <div><span>适用域名</span><strong>' + meta.domain + '</strong></div>',
    '  <div><span>更新时间</span><strong>2026-10-07</strong></div>',
    '</div>',
    '<div class="legal-vault-toolbar">',
    '  <button type="button" data-legal-print>打印 / 保存 PDF</button>',
    '  <button type="button" data-legal-copy>复制当前链接</button>',
    '  <a href="https://rights.bantan.online/" target="_blank" rel="noopener">打开版权与授权中心 ↗</a>',
    '</div>'
  ].join(''));

  hero.querySelector('[data-legal-print]')?.addEventListener('click', () => window.print());
  hero.querySelector('[data-legal-copy]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(location.href);
      button.textContent = '链接已复制';
    } catch (error) {
      button.textContent = '复制失败';
    }
    setTimeout(() => { button.textContent = original; }, 1500);
  });

  const items = document.querySelectorAll('.lic-card, .official-domains, .site-card, .site-row, .site-prose');
  items.forEach((item) => {
    item.classList.add('legal-vault-reveal');
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  items.forEach((item) => observer.observe(item));
})();
