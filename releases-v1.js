(function () {
  'use strict';

  const timeline = document.getElementById('releaseTimeline');

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function releaseUrl(version) {
    return `https://github.com/HQUGH16FHJ/BNATAN7/releases`;
  }

  function render(data) {
    const versions = Array.isArray(data.versions) ? data.versions : [];
    const latest = versions[0];
    if (latest) {
      document.getElementById('latestVersion').textContent = `v${latest.version}`;
      document.getElementById('latestTitle').textContent = latest.title;
      document.getElementById('latestDate').textContent = latest.date;
      document.getElementById('metricVersion').textContent = latest.version;
    }

    timeline.innerHTML = versions.map((item, index) => `
      <article class="release-card ${index === 0 ? 'is-latest' : ''}">
        <div class="release-card__version">v${escapeHtml(item.version)}</div>
        <div class="release-card__body">
          <h3>${escapeHtml(item.title)}</h3>
          <time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}${index === 0 ? ' · 最新版本' : ''}</time>
          <ul class="release-card__changes">
            ${(item.changes || []).map(change => `<li>${escapeHtml(change)}</li>`).join('')}
          </ul>
        </div>
        <div class="release-card__actions">
          <a class="is-primary" href="${releaseUrl(item.version)}" target="_blank" rel="noopener">GitHub Releases</a>
          <a href="./changelog.html#v${item.version.replace(/\./g, '-')}" >查看更新</a>
          <a href="https://github.com/HQUGH16FHJ/BNATAN7/archive/refs/tags/v${encodeURIComponent(item.version)}.zip" target="_blank" rel="noopener">下载源码</a>
        </div>
      </article>
    `).join('');
  }

  async function load() {
    try {
      const response = await fetch('./changelog.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('版本数据读取失败');
      render(await response.json());
    } catch (error) {
      timeline.innerHTML = `<article class="release-card"><div class="release-card__version">ERROR</div><div class="release-card__body"><h3>暂时无法读取版本数据</h3><p>${escapeHtml(error.message)}</p></div></article>`;
    }
  }

  load();
})();
