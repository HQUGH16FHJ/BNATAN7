(function () {
  'use strict';

  const form = document.getElementById('statusLookupForm');
  const result = document.getElementById('statusResult');

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function fingerprint(item) {
    let hash = 2166136261;
    const text = item.registration_code + '|' + item.created_at + '|' + item.project_name;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return 'TRACK-' + (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  function statusMeta(status) {
    return {
      '待审核': { label: '等待审核', copy: '登记单已安全写入版权数据库，正在等待审核人处理。', step: 1, tone: 'pending' },
      '审核中': { label: '正在审核', copy: '审核人正在核对权利主体、作品范围和证据信息。', step: 2, tone: 'review' },
      '已通过': { label: '审核已通过', copy: '登记申请已经通过审核，请保留登记编号和审核结果。', step: 3, tone: 'approved' },
      '已驳回': { label: '申请已驳回', copy: '登记申请未通过审核，请查看下方审核意见并按要求补充。', step: 3, tone: 'rejected' },
      '已归档': { label: '申请已归档', copy: '该项目登记流程已经结束并归档。', step: 4, tone: 'archived' }
    }[status] || { label: status, copy: '登记状态已更新。', step: 2, tone: 'pending' };
  }

  function siteCodePanel(item) {
    if (!item.site_code) return '';
    const domainQuery = item.site_domain ? `&domain=${item.site_domain}` : '';
    const embed = `<a href="https://rights.bantan.online/site?code=${item.site_code}${domainQuery}">官网编号 ${item.site_code}</a>`;
    return `
      <section class="tracking-site-code">
        <div>
          <span>OFFICIAL SITE CODE</span>
          <h3>官网编号已生成</h3>
          <p>把下面的嵌入代码放到网站页脚。访客点击后，可以验证域名、版权所有者、制作方和许可证。</p>
        </div>
        <strong>${escapeHtml(item.site_code)}</strong>
        <code>${escapeHtml(embed)}</code>
        <div class="tracking-site-code__actions">
          <button type="button" data-copy-value="${escapeHtml(item.site_code)}">复制官网编号</button>
          <button type="button" data-copy-value="${escapeHtml(embed)}">复制嵌入代码</button>
          <a href="./site.html?code=${encodeURIComponent(item.site_code)}">打开查网站页面</a>
        </div>
      </section>
    `;
  }

  function render(item) {
    const meta = statusMeta(item.status);
    result.dataset.state = meta.tone;
    result.innerHTML = `
      <article class="tracking-case">
        <header class="tracking-case__head">
          <div>
            <span>TRACKING RECORD · ${escapeHtml(item.registration_code)}</span>
            <h2>${escapeHtml(item.project_name)}</h2>
          </div>
          <i class="tracking-status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</i>
        </header>
        <div class="tracking-case__summary">
          <div class="tracking-case__stamp">${meta.step === 3 && meta.tone === 'approved' ? '✓' : meta.tone === 'rejected' ? '!' : '⌁'}</div>
          <div><span>${escapeHtml(meta.label)}</span><p>${escapeHtml(meta.copy)}</p></div>
        </div>
        <div class="tracking-progress" aria-label="审核进度">
          ${['已收件', '审核中', '审核决定', '完成归档'].map((label, index) => `
            <div class="${index + 1 <= meta.step ? 'is-active' : ''}">
              <i>${String(index + 1).padStart(2, '0')}</i>
              <span>${label}</span>
            </div>
          `).join('')}
        </div>
        <div class="tracking-facts">
          <div><span>登记编号</span><strong>${escapeHtml(item.registration_code)}</strong></div>
          <div><span>提交时间</span><strong>${escapeHtml(new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }))}</strong></div>
          <div><span>最后更新</span><strong>${escapeHtml(new Date(item.updated_at || item.created_at).toLocaleString('zh-CN', { hour12: false }))}</strong></div>
          <div><span>档案指纹</span><strong>${escapeHtml(fingerprint(item))}</strong></div>
        </div>
        ${siteCodePanel(item)}
        ${item.review_note ? `<section class="tracking-review"><span>REVIEW NOTE</span><h3>审核意见</h3><p>${escapeHtml(item.review_note)}</p></section>` : ''}
        <footer class="tracking-case__foot">
          <span>查询结果仅用于确认当前登记状态。</span>
          <a href="./register.html">返回登记工作台</a>
        </footer>
      </article>
    `;
  }

  function loading() {
    result.dataset.state = 'loading';
    result.innerHTML = '<div class="status-result__placeholder"><div class="status-result__radar is-loading"><i></i></div><div><span>SCANNING RECORDS</span><h2>正在检索版权档案</h2><p>比对登记编号、邮箱和审核记录。</p></div></div>';
  }

  function error(message) {
    result.dataset.state = 'error';
    result.innerHTML = `<div class="status-result__placeholder"><div class="status-result__radar is-error"><i>!</i></div><div><span>LOOKUP FAILED</span><h2>无法找到匹配档案</h2><p>${escapeHtml(message)}</p></div></div>`;
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const code = document.getElementById('statusCode').value.trim();
    const email = document.getElementById('statusEmail').value.trim();
    loading();
    try {
      const url = new URL('/api/rights/status', location.origin);
      url.searchParams.set('code', code);
      url.searchParams.set('email', email);
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '查询失败');
      render(data.item);
    } catch (errorValue) {
      error(errorValue.message);
    }
  });

  result?.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-value]');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copyValue || '');
      const previous = button.textContent;
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = previous; }, 1600);
    } catch (errorValue) {
      button.textContent = '复制失败，请手动选择';
    }
  });
})();
