(function () {
  'use strict';

  const nav = document.querySelector('.site-nav');
  if (nav && !nav.querySelector('a[href="/releases.html"]')) {
    const releaseLink = document.createElement('a');
    releaseLink.href = '/releases.html';
    releaseLink.textContent = '发布';
    const badgeLink = document.createElement('a');
    badgeLink.href = '/badge.html';
    badgeLink.textContent = '徽章';
    nav.append(releaseLink, badgeLink);
  }

  const current = location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('.site-nav a').forEach(link => {
    const url = new URL(link.href, location.href);
    const target = url.pathname.replace(/\/+$/, '') || '/';
    const isCurrent = current === target || (target.endsWith('/guides') && current.endsWith('/guides/index.html'));
    if (isCurrent) link.setAttribute('aria-current', 'page');
  });

  const footer = document.querySelector('.site-footer__inner');
  if (footer && !footer.querySelector('.site-verified-badge')) {
    const badge = document.createElement('span');
    badge.className = 'site-verified-badge';
    badge.innerHTML = '<a href="https://rights.bantan.online/site?code=BNT-SITE-2026-001&domain=bantan.online" target="_blank" rel="noopener"><img src="https://rights.bantan.online/api/rights/site-badge?code=BNT-SITE-2026-001&domain=bantan.online&v=20260919-1" width="150" height="34" loading="lazy" decoding="async" alt="绊谈官方认证">官网认证 BNT-SITE-2026-001</a>';
    footer.appendChild(badge);
  }

  const items = document.querySelectorAll('.site-card, .site-row, .site-stat, .site-timeline__item');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach(item => {
    item.classList.add('site-reveal');
    observer.observe(item);
  });
})();
