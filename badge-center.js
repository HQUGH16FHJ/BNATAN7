(function () {
  'use strict';

  const preview = document.getElementById('badgePreview');
  const previewSite = document.getElementById('previewSite');
  const previewCode = document.getElementById('previewCode');
  const urlOutput = document.getElementById('badgeUrl');
  const htmlOutput = document.getElementById('badgeHtml');
  const markdownOutput = document.getElementById('badgeMarkdown');
  let selected = { code: 'BNT-SITE-2026-001', domain: 'bantan.online', theme: 'dark' };

  function badgeUrl() {
    return `https://rights.bantan.online/api/rights/site-badge?code=${encodeURIComponent(selected.code)}&domain=${encodeURIComponent(selected.domain)}&theme=${encodeURIComponent(selected.theme)}`;
  }

  function update() {
    const url = badgeUrl();
    preview.src = url;
    preview.alt = `绊谈官方认证 ${selected.code}`;
    previewSite.textContent = selected.domain;
    previewCode.textContent = selected.code;
    urlOutput.textContent = url;
    htmlOutput.textContent = `<a href="https://rights.bantan.online/site?code=${selected.code}&domain=${selected.domain}" target="_blank" rel="noopener"><img src="${url}" width="320" height="72" alt="绊谈官方认证 ${selected.code}"></a>`;
    markdownOutput.textContent = `[![绊谈官方认证 ${selected.code}](${url})](https://rights.bantan.online/site?code=${selected.code}&domain=${selected.domain})`;
  }

  document.getElementById('siteChoices')?.addEventListener('click', event => {
    const button = event.target.closest('[data-code]');
    if (!button) return;
    document.querySelectorAll('#siteChoices button').forEach(item => item.classList.toggle('is-active', item === button));
    selected.code = button.dataset.code;
    selected.domain = button.dataset.domain;
    update();
  });

  document.getElementById('themeChoices')?.addEventListener('click', event => {
    const button = event.target.closest('[data-theme]');
    if (!button) return;
    document.querySelectorAll('#themeChoices button').forEach(item => item.classList.toggle('is-active', item === button));
    selected.theme = button.dataset.theme;
    update();
  });

  document.querySelectorAll('[data-copy-target]').forEach(button => {
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copyTarget);
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(target.textContent || '');
        button.textContent = '已复制';
      } catch (error) {
        button.textContent = '复制失败';
      }
      setTimeout(() => { button.textContent = original; }, 1500);
    });
  });

  update();
})();
