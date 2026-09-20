(function () {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);

  function markDelays(elements, step = 60, max = 360) {
    elements.forEach((element, index) => {
      element.style.setProperty('--archive-delay', `${Math.min(index * step, max)}ms`);
    });
  }

  function initReveal() {
    const items = [
      ...document.querySelectorAll(
        '.rights-stats article, .registry-card, .directory-card, .admin-metric, .case-card, .api-endpoint, .ops-metric, .ops-check, .rights-section__head, .site-section__head, .verify-console'
      )
    ];
    items.forEach((item, index) => {
      item.classList.add('archive-observe');
      if (item.matches('.rights-section__head, .site-section__head')) item.classList.add('archive-section-head');
      item.style.setProperty('--archive-delay', `${Math.min(index * 34, 240)}ms`);
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94) item.classList.add('archive-visible');
    });

    if (!('IntersectionObserver' in window) || reducedMotion || saveData) {
      items.forEach(item => item.classList.add('archive-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('archive-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.filter(item => !item.classList.contains('archive-visible')).forEach(item => observer.observe(item));
  }

  function animateCounts() {
    if (reducedMotion || saveData) return;
    document.querySelectorAll('.rights-stats strong').forEach(element => {
      const text = element.textContent.trim();
      const match = text.match(/^(\d+)$/);
      if (!match) return;
      const target = Number(match[1]);
      element.classList.add('archive-count');
      let start = null;
      const duration = 680;
      const tick = timestamp => {
        if (start === null) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(target * eased)).padStart(match[1].length, '0');
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function init() {
    document.body.classList.add('rights-archive-page');
    markDelays([...document.querySelectorAll('.rights-hero__copy > *, .console-hero__main > *, .tracking-hero__copy > *, .platform-hero > div > *, .admin-dashboard-hero > div > *')]);
    initReveal();
    requestAnimationFrame(() => root.classList.add('rights-archive-ready'));
    animateCounts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
