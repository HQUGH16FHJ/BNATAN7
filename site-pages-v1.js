(function () {
  'use strict';

  const current = location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('.site-nav a').forEach(link => {
    const url = new URL(link.href, location.href);
    const target = url.pathname.replace(/\/+$/, '') || '/';
    const isCurrent = current === target || (target.endsWith('/guides') && current.endsWith('/guides/index.html'));
    if (isCurrent) link.setAttribute('aria-current', 'page');
  });

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
