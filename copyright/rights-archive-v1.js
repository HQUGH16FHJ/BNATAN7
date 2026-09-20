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
    markDelays([...document.querySelectorAll('.rights-stats article, .registry-card, .directory-card, .admin-metric, .case-card, .api-endpoint, .ops-metric, .ops-check')], 36, 260);
    requestAnimationFrame(() => root.classList.add('rights-archive-ready'));
    animateCounts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
