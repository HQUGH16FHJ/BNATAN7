(function () {
  'use strict';

  const login = document.getElementById('adminLogin');
  const consoleBox = document.getElementById('adminConsole');
  const tokenInput = document.getElementById('adminToken');
  const loginButton = document.getElementById('adminLoginButton');
  const loginStatus = document.getElementById('adminLoginStatus');
  const list = document.getElementById('adminList');
  const detail = document.getElementById('adminDetail');
  const backdrop = document.getElementById('adminDetailBackdrop');
  const summary = document.getElementById('adminSummary');
  const search = document.getElementById('adminSearch');
  const status = document.getElementById('adminStatus');
  let token = sessionStorage.getItem('bantan_rights_admin_token') || '';
  let records = [];
  let selectedId = '';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function initials(value) {
    return String(value || '?').trim().slice(0, 2).toUpperCase();
  }

  function score(item) {
    const fields = [item.project_name, item.owner, item.domains, item.license, item.works, item.contact, item.description];
    return Math.round(fields.filter(Boolean).length / fields.length * 100);
  }

  function fingerprint(item) {
    let hash = 2166136261;
    const text = item.registration_code + '|' + item.created_at + '|' + item.owner;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return 'BR-' + (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  async function request(method, body) {
    const url = new URL('/api/rights/submissions', location.origin);
    if (method === 'GET') {
      if (search.value.trim()) url.searchParams.set('search', search.value.trim());
      if (status.value !== 'all') url.searchParams.set('status', status.value);
    }
    const response = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-admin-token': token
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || '请求失败');
    return result;
  }

  function updateMetrics() {
    document.getElementById('adminTotal').textContent = records.length;
    document.getElementById('adminPending').textContent = records.filter(item => item.status === '待审核').length;
    document.getElementById('adminApproved').textContent = records.filter(item => item.status === '已通过').length;
    document.getElementById('adminRejected').textContent = records.filter(item => item.status === '已驳回').length;
  }

  function domains(item) {
    return String(item.domains || '').split(',').map(value => value.trim()).filter(Boolean);
  }

  function recordMarkup(item) {
    const domainList = domains(item);
    return `
      <article class="case-card${item.id === selectedId ? ' is-selected' : ''}" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(item.project_name)} 登记详情">
        <div class="case-card__head">
          <span class="case-card__avatar">${escapeHtml(initials(item.owner))}</span>
          <div class="case-card__title"><span>${escapeHtml(item.registration_code)}</span><h3>${escapeHtml(item.project_name)}</h3></div>
          <i class="case-status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</i>
        </div>
        <div class="case-card__facts">
          <div class="case-card__fact"><small>版权所有者</small><strong>${escapeHtml(item.owner)}</strong></div>
          <div class="case-card__fact"><small>登记类型</small><strong>${escapeHtml(item.record_type)}</strong></div>
          <div class="case-card__fact"><small>提交时间</small><strong>${escapeHtml(new Date(item.created_at).toLocaleDateString('zh-CN'))}</strong></div>
        </div>
        <div class="case-card__bottom">
          <div class="case-card__domains">${domainList.slice(0, 2).map(domain => `<span>${escapeHtml(domain)}</span>`).join('') || '<span>未填写域名</span>'}</div>
          <div class="case-card__score"><span>完整度 ${score(item)}%</span><i style="--score:${score(item)}%"></i></div>
        </div>
      </article>
    `;
  }

  function detailMarkup(item) {
    if (!item) {
      return '<div class="admin-detail__empty"><div><strong>选择一条登记单</strong><p>点击左侧案例卡后，在这里查看完整信息和审核操作。</p></div></div>';
    }
    const domainList = domains(item);
    const embedDomain = domainList[0] || '';
    const embedUrl = `https://rights.bantan.online/site?code=${encodeURIComponent(item.site_code || '')}${embedDomain ? `&domain=${encodeURIComponent(embedDomain)}` : ''}`;
    return `
      <div class="admin-detail__inner">
        <div class="admin-detail__topbar">
          <span>CASE FILE · ${escapeHtml(item.registration_code)}</span>
          <button class="admin-detail__close" type="button" data-close-detail aria-label="关闭详情">×</button>
        </div>
        <div class="admin-detail__hero">
          <div>
            <div class="admin-detail__code">${escapeHtml(item.registration_code)}</div>
            <h2>${escapeHtml(item.project_name)}</h2>
            <p>${escapeHtml(item.status)} · 提交于 ${escapeHtml(new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }))}</p>
          </div>
          <div class="admin-detail__score" data-score="${score(item)}%" style="--score:${score(item)}%"></div>
        </div>
        <section class="admin-detail__section">
          <h3>权利主体</h3>
          <dl class="admin-detail__grid">
            <div><dt>版权所有者</dt><dd>${escapeHtml(item.owner)}</dd></div>
            <div><dt>制作方 / 合作方</dt><dd>${escapeHtml(item.producer || '--')}</dd></div>
            <div><dt>联系邮箱</dt><dd>${escapeHtml(item.contact || '--')}</dd></div>
            <div><dt>联系电话</dt><dd>${escapeHtml(item.phone || '--')}</dd></div>
          </dl>
        </section>
        <section class="admin-detail__section">
          <h3>作品档案</h3>
          <dl class="admin-detail__grid">
            <div><dt>登记类型</dt><dd>${escapeHtml(item.record_type)}</dd></div>
            <div><dt>项目状态</dt><dd>${escapeHtml(item.project_status)}</dd></div>
            <div><dt>许可证</dt><dd>${escapeHtml(item.license)}</dd></div>
            <div><dt>发布日期</dt><dd>${escapeHtml(item.release_date || '--')}</dd></div>
            <div><dt>作品范围</dt><dd>${escapeHtml(item.works || '--')}</dd></div>
            <div><dt>代码仓库</dt><dd>${escapeHtml(item.repository || '--')}</dd></div>
          </dl>
        </section>
        <section class="admin-detail__section">
          <h3>官方域名</h3>
          <div class="case-card__domains">${domainList.map(domain => `<span>${escapeHtml(domain)}</span>`).join('') || '<span>未填写域名</span>'}</div>
        </section>
        <section class="admin-detail__section">
          <h3>官网编号</h3>
          <div class="admin-site-code">${item.site_code ? `
            <strong>${escapeHtml(item.site_code)}</strong>
            <code>&lt;a href="${escapeHtml(embedUrl)}"&gt;官网编号 ${escapeHtml(item.site_code)}&lt;/a&gt;</code>
            <button type="button" data-copy-site="${escapeHtml(item.site_code)}" data-copy-domain="${escapeHtml(embedDomain)}">复制嵌入代码</button>
          ` : '<p>申请审核通过后自动生成官网编号和嵌入代码。</p>'}</div>
        </section>
        <section class="admin-detail__section">
          <h3>作品说明</h3>
          <div class="admin-detail__description">${escapeHtml(item.description || '无补充说明')}</div>
        </section>
        <section class="admin-detail__section">
          <h3>审核意见</h3>
          <textarea class="admin-review-note" id="adminReviewNote" rows="4" placeholder="通过、驳回或其他审核说明。申请人在进度查询中可以看到这里的内容。">${escapeHtml(item.review_note || '')}</textarea>
        </section>
        <section class="admin-detail__section">
          <h3>记录指纹</h3>
          <div class="admin-detail__fingerprint">${escapeHtml(fingerprint(item))}</div>
        </section>
        <section class="admin-detail__section">
          <h3>审核时间轴</h3>
          <div class="admin-detail__timeline">
            <article><strong>登记单已创建</strong><span>${escapeHtml(new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }))}</span></article>
            <article><strong>当前状态：${escapeHtml(item.status)}</strong><span>最后更新：${escapeHtml(new Date(item.updated_at || item.created_at).toLocaleString('zh-CN', { hour12: false }))}</span></article>
          </div>
        </section>
        <div class="admin-detail__sticky-actions">
          ${['审核中', '已通过', '已驳回', '已归档'].map(state => `<button type="button" data-status="${state}">${state}</button>`).join('')}
        </div>
      </div>
    `;
  }

  function openDetail(id) {
    selectedId = id;
    const item = records.find(record => record.id === id);
    detail.innerHTML = detailMarkup(item);
    detail.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    document.body.classList.add('has-admin-detail');
    render();
  }

  function closeDetail() {
    document.body.classList.remove('has-admin-detail');
    detail.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    selectedId = '';
    render();
  }

  function render() {
    summary.textContent = '共读取 ' + records.length + ' 条登记记录。';
    list.innerHTML = records.length
      ? records.map(recordMarkup).join('')
      : '<div class="admin-empty">没有符合条件的登记记录。</div>';
    const selected = records.find(item => item.id === selectedId);
    detail.innerHTML = detailMarkup(selected);
    if (selected) {
      detail.setAttribute('aria-hidden', 'false');
      backdrop.hidden = false;
      document.body.classList.add('has-admin-detail');
    }
    updateMetrics();
  }

  async function load() {
    try {
      const result = await request('GET');
      records = result.items || [];
      if (selectedId && !records.some(item => item.id === selectedId)) selectedId = '';
      login.hidden = true;
      consoleBox.hidden = false;
      sessionStorage.setItem('bantan_rights_admin_token', token);
      render();
    } catch (error) {
      loginStatus.textContent = error.message;
      login.hidden = false;
      consoleBox.hidden = true;
    }
  }

  async function updateStatus(id, nextStatus) {
    const noteField = document.getElementById('adminReviewNote');
    const reviewNote = noteField?.value.trim() || '';
    if (nextStatus === '已驳回' && !reviewNote) {
      noteField?.focus();
      noteField?.classList.add('is-required');
      return;
    }
    await request('PATCH', { id, status: nextStatus, reviewNote });
    await load();
  }

  loginButton?.addEventListener('click', () => {
    token = tokenInput.value.trim();
    if (!token) {
      loginStatus.textContent = '请输入管理密码。';
      return;
    }
    load();
  });

  document.getElementById('adminRefresh')?.addEventListener('click', load);
  document.getElementById('adminLogout')?.addEventListener('click', () => {
    token = '';
    sessionStorage.removeItem('bantan_rights_admin_token');
    consoleBox.hidden = true;
    login.hidden = false;
    tokenInput.value = '';
    closeDetail();
  });

  document.getElementById('adminExport')?.addEventListener('click', () => {
    if (!records.length) return;
    const fields = ['registration_code', 'project_name', 'owner', 'producer', 'domains', 'license', 'contact', 'status', 'created_at'];
    const csv = [fields.join(','), ...records.map(item => fields.map(field => '"' + String(item[field] || '').replace(/"/g, '""') + '"').join(','))].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bantan-rights-registrations.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  });

  search?.addEventListener('input', () => {
    clearTimeout(search._timer);
    search._timer = setTimeout(load, 300);
  });
  status?.addEventListener('change', load);

  list?.addEventListener('click', event => {
    const card = event.target.closest('.case-card');
    if (card) openDetail(card.dataset.id);
  });
  list?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.case-card');
    if (!card) return;
    event.preventDefault();
    openDetail(card.dataset.id);
  });
  detail?.addEventListener('click', async event => {
    if (event.target.closest('[data-close-detail]')) {
      closeDetail();
      return;
    }
    const copyButton = event.target.closest('[data-copy-site]');
    if (copyButton) {
      const code = copyButton.dataset.copySite;
      const domain = copyButton.dataset.copyDomain;
      const url = `https://rights.bantan.online/site?code=${encodeURIComponent(code)}${domain ? `&domain=${encodeURIComponent(domain)}` : ''}`;
      try {
        await navigator.clipboard.writeText(`<a href="${url}">官网编号 ${code}</a>`);
        copyButton.textContent = '已复制';
      } catch (error) {
        copyButton.textContent = '复制失败';
      }
      return;
    }
    const button = event.target.closest('button[data-status]');
    if (!button || !selectedId) return;
    button.disabled = true;
    try {
      await updateStatus(selectedId, button.dataset.status);
      if (selectedId) button.disabled = false;
    } catch (error) {
      button.textContent = error.message;
    }
  });
  backdrop?.addEventListener('click', closeDetail);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('has-admin-detail')) closeDetail();
  });

  if (token) {
    tokenInput.value = token;
    load();
  }
})();
