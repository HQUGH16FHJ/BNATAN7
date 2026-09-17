(function () {
  'use strict';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const path = location.pathname.toLowerCase();
  const page = path.endsWith('/index.html')
    ? 'index'
    : path.endsWith('/changelog.html')
      ? 'changelog'
      : path.endsWith('/license.html')
        ? 'license'
        : path.endsWith('/404.html')
          ? '404'
          : 'landing';

  function addEffectLayer() {
    const layer = document.createElement('div');
    layer.className = 'rb-effects-layer';
    layer.setAttribute('aria-hidden', 'true');
    const effects = {
      landing: ['rb-dot-field', 'rb-aurora-bg'],
      index: ['rb-grid-motion', 'rb-line-waves'],
      changelog: ['rb-line-waves', 'rb-aurora-bg'],
      license: ['rb-beam-grid', 'rb-dot-field'],
      '404': ['rb-dot-field', 'rb-beam-grid']
    }[page] || ['rb-dot-field'];
    effects.forEach(effect => {
      const element = document.createElement('div');
      element.className = effect;
      layer.appendChild(element);
    });
    if (!REDUCED_MOTION && (page === 'landing' || page === 'index')) {
      const colors = ['#38bdf8', '#f59e0b', '#fb7185', '#34d399'];
      for (let i = 0; i < 22; i++) {
        const particle = document.createElement('span');
        particle.className = 'rb-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = (72 + Math.random() * 35) + '%';
        particle.style.background = colors[i % colors.length];
        particle.style.boxShadow = '0 0 8px ' + colors[i % colors.length];
        particle.style.setProperty('--rb-duration', (5 + Math.random() * 6).toFixed(1) + 's');
        particle.style.setProperty('--rb-delay', (-Math.random() * 8).toFixed(1) + 's');
        particle.style.setProperty('--rb-drift', ((Math.random() - 0.5) * 70).toFixed(0) + 'px');
        layer.appendChild(particle);
      }
    }
    document.body.insertBefore(layer, document.body.firstChild);
  }

  function splitText(element) {
    if (!element || element.querySelector('.rb-char')) return;
    const text = element.textContent;
    element.textContent = '';
    element.classList.add('rb-split-text');
    let index = 0;
    Array.from(text).forEach(character => {
      if (character === ' ') {
        element.appendChild(document.createTextNode(' '));
        return;
      }
      const span = document.createElement('span');
      span.className = 'rb-char';
      span.textContent = character;
      span.style.setProperty('--rb-index', index++);
      element.appendChild(span);
    });
  }

  function addTextEffects() {
    const mainTitle = document.querySelector('h1');
    if (mainTitle) {
      if (page === 'changelog' || page === 'license') {
        splitText(mainTitle);
        mainTitle.classList.add('rb-gradient-text');
      } else if (!mainTitle.querySelector('.char')) {
        mainTitle.classList.add('rb-shiny-text');
      } else {
        mainTitle.classList.add('rb-gradient-text');
      }
    }
    document.querySelectorAll('.section-head h2, .section-title, .page-header h1').forEach((element, index) => {
      if (element === mainTitle) return;
      element.classList.add('rb-scroll-float');
      element.style.transitionDelay = Math.min(index * 0.05, 0.25) + 's';
    });
  }

  function revealFloatingText() {
    const elements = document.querySelectorAll('.rb-scroll-float');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('rb-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('rb-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px 0px' });
    elements.forEach(element => observer.observe(element));
  }

  function addCountUp() {
    if (REDUCED_MOTION) return;
    const candidates = [
      document.getElementById('hero-tools-count'),
      ...document.querySelectorAll('.stat-value')
    ].filter(Boolean);
    candidates.forEach((element, index) => {
      const text = element.textContent.trim();
      const match = text.match(/-?\d+(?:\.\d+)?/);
      if (!match) return;
      const target = Number(match[0]);
      const prefix = text.slice(0, match.index);
      const suffix = text.slice(match.index + match[0].length);
      const decimals = (match[0].split('.')[1] || '').length;
      const start = performance.now() + index * 80;
      element.classList.add('rb-counting');
      const update = now => {
        const progress = Math.min(1, Math.max(0, (now - start) / 950));
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = text;
      };
      requestAnimationFrame(update);
    });
  }

  function addDecryptText() {
    if (REDUCED_MOTION) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789✦';
    document.querySelectorAll('.entry-new, .version-label, .online-status-text').forEach((element, elementIndex) => {
      const original = element.textContent;
      if (!original) return;
      element.classList.add('rb-decrypted');
      let frame = 0;
      const timer = setInterval(() => {
        frame++;
        element.textContent = Array.from(original).map((character, index) => {
          if (character === ' ') return ' ';
          if (index < frame / 3) return original[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        if (frame > original.length * 3 + 8) {
          clearInterval(timer);
          element.textContent = original;
        }
      }, 35 + elementIndex * 5);
    });
  }

  function addAnimatedLists() {
    const selectors = ['.change-items', '.lic-section', '.quick-grid', '.projects-grid'];
    const elements = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
    elements.forEach(element => element.classList.add('rb-animated-list'));
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('rb-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('rb-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -35px 0px' });
    elements.forEach(element => observer.observe(element));
  }

  function addInteractiveComponents() {
    document.querySelectorAll('.tool-card, .mini-card, .bento-cell, .category-card, .preview-row').forEach(element => {
      element.classList.add('rb-glare-hover', 'rb-border-glow');
    });
    document.querySelectorAll('.featured-version, .profile-v2-avatar-wrap, .logout-confirm-icon').forEach(element => {
      element.classList.add('rb-star-border');
    });
    document.body.classList.add('rb-dock-shine');
  }

  function initialize() {
    addEffectLayer();
    addTextEffects();
    revealFloatingText();
    addCountUp();
    addDecryptText();
    addAnimatedLists();
    addInteractiveComponents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
