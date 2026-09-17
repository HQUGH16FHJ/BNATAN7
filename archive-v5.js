(function () {
  'use strict';

  const path = location.pathname.toLowerCase();
  const page = path.endsWith('/changelog.html') ? 'changelog' : path.endsWith('/license.html') ? 'license' : '';
  if (!page) return;

  function addTopbar() {
    if (document.querySelector('.archive-topbar')) return;
    if (page === 'license') {
      const legacyNav = document.querySelector('.lic-nav');
      if (legacyNav) legacyNav.hidden = true;
    }
    const nav = document.createElement('nav');
    nav.className = 'archive-topbar';
    nav.setAttribute('aria-label', '档案馆导航');
    nav.innerHTML = [
      '<a class="archive-brand" href="landing.html"><span class="archive-brand-mark">绊</span><span>绊谈档案馆</span></a>',
      '<div class="archive-nav-links">',
      '  <a href="landing.html">首页</a>',
      '  <a href="index.html">工具箱</a>',
      '  <a href="changelog.html" class="' + (page === 'changelog' ? 'active' : '') + '">更新日志</a>',
      '  <a href="license.html" class="' + (page === 'license' ? 'active' : '') + '">许可证</a>',
      '  <a href="about.html">关于我</a>',
      '</div>',
      '<button class="archive-nav-action" type="button">搜索</button>'
    ].join('');
    nav.querySelector('button').addEventListener('click', () => {
      if (window.BantanSearch?.open) window.BantanSearch.open();
      else location.href = 'index.html';
    });
    document.body.appendChild(nav);
  }

  function addChangelogConsole() {
    const header = document.querySelector('.page-header');
    const latest = document.querySelector('.featured-version');
    if (!header || !latest || document.querySelector('.archive-release-console')) return;
    const version = latest.querySelector('.version-number')?.textContent.trim() || '--';
    const title = latest.querySelector('.version-title')?.textContent.trim() || '';
    const date = latest.querySelector('.version-date')?.textContent.trim() || '--';
    const count = document.querySelectorAll('.change-item, .highlight-item, .compact-items li').length;
    const versionCount = document.querySelectorAll('.featured-version, .version-card, .compact-version').length;
    const consoleBox = document.createElement('section');
    consoleBox.className = 'archive-release-console';
    consoleBox.innerHTML = [
      '<article class="archive-console-main">',
      '  <div class="archive-console-kicker">LATEST RELEASE</div>',
      '  <div class="archive-console-version">' + version + '</div>',
      '  <div class="archive-console-title">' + title + '</div>',
      '  <div class="archive-console-date">发布于 ' + date + '</div>',
      '</article>',
      '<aside class="archive-console-side">',
      '  <div class="archive-console-metric"><span>版本记录</span><strong>' + versionCount + '</strong></div>',
      '  <div class="archive-console-metric"><span>更新条目</span><strong>' + count + '</strong></div>',
      '  <div class="archive-console-metric"><span>发布状态</span><strong>LIVE</strong></div>',
      '</aside>'
    ].join('');
    const toolbar = document.querySelector('.bnt-release-toolbar');
    if (toolbar) toolbar.insertAdjacentElement('afterend', consoleBox);
    else header.insertAdjacentElement('afterend', consoleBox);
  }

  function addYearFilters() {
    const toolbar = document.querySelector('.bnt-release-toolbar');
    if (!toolbar || document.querySelector('.archive-yearbar')) return;
    const cards = Array.from(document.querySelectorAll('.featured-version, .version-card, .compact-version'));
    const years = Array.from(new Set(cards.map(card => {
      const date = card.querySelector('.version-date, .card-date, .compact-date')?.textContent || '';
      return (date.match(/20\d{2}/) || ['其他'])[0];
    })));
    const bar = document.createElement('div');
    bar.className = 'archive-yearbar';
    bar.innerHTML = '<button class="archive-year active" type="button" data-year="all" aria-pressed="true">全部年份</button>' +
      years.map(year => '<button class="archive-year" type="button" data-year="' + year + '" aria-pressed="false">' + year + '</button>').join('');
    toolbar.insertAdjacentElement('afterend', bar);
    bar.addEventListener('click', event => {
      const button = event.target.closest('.archive-year');
      if (!button) return;
      bar.querySelectorAll('.archive-year').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const year = button.dataset.year;
      cards.forEach(card => {
        const date = card.querySelector('.version-date, .card-date, .compact-date')?.textContent || '';
        card.classList.toggle('archive-year-hidden', year !== 'all' && !date.includes(year));
      });
    });
  }

  function addVersionActions() {
    const cards = document.querySelectorAll('.featured-version, .version-card, .compact-version');
    cards.forEach(card => {
      const header = card.querySelector('.version-meta, .card-header, .compact-header');
      if (!header || header.querySelector('.archive-version-actions')) return;
      const actions = document.createElement('div');
      actions.className = 'archive-version-actions';
      const version = card.querySelector('.version-number, .card-version, .compact-version-num')?.textContent.trim() || '';
      const body = card.querySelector('.highlights, .change-items, .compact-items');
      const collapsible = body && !card.classList.contains('featured-version');
      if (collapsible) body.hidden = true;
      actions.innerHTML = '<button type="button" class="archive-version-action" data-action="link">复制链接</button><button type="button" class="archive-version-action" data-action="expand">' + (collapsible ? '展开' : '收起') + '</button>';
      const copyButton = actions.querySelector('[data-action="link"]');
      const expandButton = actions.querySelector('[data-action="expand"]');
      const updateExpandedState = () => {
        if (!body) return;
        expandButton.setAttribute('aria-expanded', String(!body.hidden));
        expandButton.hidden = !collapsible;
      };
      copyButton.addEventListener('click', async event => {
        event.stopPropagation();
        if (!card.id) card.id = 'version-' + version.replace(/[^a-z0-9-]/gi, '').toLowerCase();
        const url = location.origin + location.pathname + '#' + (card.id || '');
        try {
          await navigator.clipboard.writeText(url);
        } catch (error) {
          const input = document.createElement('input');
          input.value = url;
          input.setAttribute('readonly', '');
          input.style.position = 'fixed';
          input.style.opacity = '0';
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          input.remove();
        }
        copyButton.textContent = '已复制';
        setTimeout(() => { copyButton.textContent = '复制链接'; }, 1400);
      });
      expandButton.addEventListener('click', event => {
        event.stopPropagation();
        if (!body || !collapsible) return;
        body.hidden = !body.hidden;
        event.currentTarget.textContent = body.hidden ? '展开' : '收起';
        updateExpandedState();
      });
      updateExpandedState();
      header.appendChild(actions);
    });
  }

  function addCurrentVersionTracking() {
    const cards = Array.from(document.querySelectorAll('.featured-version, .version-card'));
    if (!cards.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach(card => card.classList.toggle('archive-current', card === entry.target));
        }
      });
    }, { rootMargin: '-22% 0px -58% 0px', threshold: 0.08 });
    cards.forEach(card => observer.observe(card));
  }

  function addLicenseProgress() {
    if (page !== 'license') return;
    const progress = document.createElement('div');
    progress.className = 'archive-license-progress';
    progress.innerHTML = '<span></span>';
    document.body.appendChild(progress);
    const bar = progress.querySelector('span');
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function addLicenseNumbering() {
    if (page !== 'license') return;
    const cards = document.querySelectorAll('.lic-card');
    cards.forEach((card, index) => {
      card.classList.add('archive-license-section');
      card.dataset.archiveNumber = String(index + 1).padStart(2, '0');
    });
    const first = cards[0];
    if (first && !first.querySelector('.archive-quote-code')) {
      const code = document.createElement('div');
      code.className = 'archive-quote-code';
      code.innerHTML = '<span>引用编号</span><strong>BNT-LICENSE-2026-V4</strong>';
      first.querySelector('.lic-section')?.appendChild(code);
    }
  }

  function initialize() {
    addTopbar();
    if (page === 'changelog') {
      addChangelogConsole();
      addYearFilters();
      addVersionActions();
      addCurrentVersionTracking();
    }
    if (page === 'license') {
      addLicenseProgress();
      addLicenseNumbering();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
