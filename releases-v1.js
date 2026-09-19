(function () {
  'use strict';

  const timeline = document.getElementById('releaseTimeline');
  const compareFrom = document.getElementById('compareFrom');
  const compareTo = document.getElementById('compareTo');
  const compareResult = document.getElementById('releaseCompareResult');
  let versionData = [];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function releaseUrl(version) {
    return `https://github.com/HQUGH16FHJ/BNATAN7/releases`;
  }

  function populateCompare(versions) {
    compareFrom.innerHTML = versions.map(item => `<option value="${escapeHtml(item.version)}">v${escapeHtml(item.version)}</option>`).join('');
    compareTo.innerHTML = compareFrom.innerHTML;
    if (versions.length > 1) {
      compareFrom.value = versions[1].version;
      compareTo.value = versions[0].version;
    }
  }

  function compare() {
    const from = versionData.find(item => item.version === compareFrom.value);
    const to = versionData.find(item => item.version === compareTo.value);
    if (!from || !to) return;
    const fromSet = new Set(from.changes || []);
    const toSet = new Set(to.changes || []);
    const added = [...toSet].filter(item => !fromSet.has(item));
    const removed = [...fromSet].filter(item => !toSet.has(item));
    compareResult.innerHTML = `
      <div class="compare-columns">
        <article>
          <h3>v${escapeHtml(to.version)} 新增 / 变化</h3>
          <ul>${added.length ? added.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>没有新增条目</li>'}</ul>
        </article>
        <article class="is-removed">
          <h3>v${escapeHtml(from.version)} 不再列出</h3>
          <ul>${removed.length ? removed.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>没有移除条目</li>'}</ul>
        </article>
      </div>
    `;
  }

  function renderHeatmap(days) {
    const heatmap = document.getElementById('commitHeatmap');
    if (!heatmap) return;
    const counts = new Map(days.map(item => [item.date, item.count]));
    const dateValues = days.map(item => new Date(item.date + 'T00:00:00Z'));
    if (!dateValues.length) return;
    const min = new Date(Math.min(...dateValues));
    const max = new Date(Math.max(...dateValues));
    min.setUTCDate(min.getUTCDate() - min.getUTCDay());
    max.setUTCDate(max.getUTCDate() + (6 - max.getUTCDay()));
    const cells = [];
    const cursor = new Date(min);
    while (cursor <= max) {
      const key = cursor.toISOString().slice(0, 10);
      const count = counts.get(key) || 0;
      const level = count === 0 ? 0 : count < 4 ? 1 : count < 10 ? 2 : count < 40 ? 3 : 4;
      cells.push(`<i data-level="${level}" title="${key} · ${count} 次更新"></i>`);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    heatmap.innerHTML = cells.join('');
  }

  function render(data) {
    const versions = Array.isArray(data.versions) ? data.versions : [];
    versionData = versions;
    populateCompare(versions);
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
      const activity = await fetch('./activity.json', { cache: 'no-store' });
      if (activity.ok) renderHeatmap((await activity.json()).days || []);
    } catch (error) {
      timeline.innerHTML = `<article class="release-card"><div class="release-card__version">ERROR</div><div class="release-card__body"><h3>暂时无法读取版本数据</h3><p>${escapeHtml(error.message)}</p></div></article>`;
    }
  }

  document.getElementById('compareVersions')?.addEventListener('click', compare);
  load();
})();
