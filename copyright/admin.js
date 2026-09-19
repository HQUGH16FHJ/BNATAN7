(function () {
  'use strict';

  const login = document.getElementById('adminLogin');
  const consoleBox = document.getElementById('adminConsole');
  const tokenInput = document.getElementById('adminToken');
  const loginButton = document.getElementById('adminLoginButton');
  const loginStatus = document.getElementById('adminLoginStatus');
  const list = document.getElementById('adminList');
  const detail = document.getElementById('adminDetail');
  const summary = document.getElementById('adminSummary');
  const search = document.getElementById('adminSearch');
  const status = document.getElementById('adminStatus');
  let token = sessionStorage.getItem('bantan_rights_admin_token') || '';
  let records = [];
  let selectedId = '';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
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

  function recordMarkup(item) {
    return `
      <article class="admin-record${item.id === selectedId ? ' is-selected' : ''}" data-id="${escapeHtml(item.id)}" tabindex="0">
        <div class="admin-record__head">
          <div><span>${escapeHtml(item.registration_code)}</span><h3>${escapeHtml(item.project_name)}</h3></div>
          <i data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</i>
        </div>
        <dl>
          <div><dt>版权所有者</dt><dd>${escapeHtml(item.owner)}</dd></div>
          <div><dt>官方域名</dt><dd>${escapeHtml(item.domains || '--')}</dd></div>
          <div><dt>联系邮箱</dt><dd>${escapeHtml(item.contact || '--')}</dd></div>
          <div><dt>提交时间</dt><dd>${escapeHtml(new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }))}</dd></div>
        </dl>
      </article>
    `;
  }

  function detailMarkup(item) {
    if (!item) {
      return '<div class="admin-detail__empty"><div><strong>选择一条登记单</strong><p>点击左侧记录后，在这里查看完整信息和审核操作。</p></div></div>';
    }
    return `
      <div class="admin-detail__code">${escapeHtml(item.registration_code)}</div>
      <h2>${escapeHtml(item.project_name)}</h2>
      <dl class="admin-detail__grid">
        <div><dt>版权所有者</dt><dd>${escapeHtml(item.owner)}</dd></div>
        <div><dt>制作方</dt><dd>${escapeHtml(item.producer || '--')}</dd></div>
        <div><dt>登记类型</dt><dd>${escapeHtml(item.record_type)}</dd></div>
        <div><dt>项目状态</dt><dd>${escapeHtml(item.project_status)}</dd></div>
        <div><dt>官方域名</dt><dd>${escapeHtml(item.domains || '--')}</dd></div>
        <div><dt>许可证</dt><dd>${escapeHtml(item.license)}</dd></div>
        <div><dt>联系邮箱</dt><dd>${escapeHtml(item.contact || '--')}</dd></div>
        <div><dt>联系电话</dt><dd>${escapeHtml(item.phone || '--')}</dd></div>
        <div><dt>发布日期</dt><dd>${escapeHtml(item.release_date || '--')}</dd></div>
        <div><dt>作品范围</dt><dd>${escapeHtml(item.works || '--')}</dd></div>
      </dl>
      <div class="admin-detail__description">${escapeHtml(item.description || '无补充说明')}</div>
      <div class="admin-detail__actions">
        ${['审核中', '已通过', '已驳回', '已归档'].map(state => `<button type="button" data-status="${state}">${state}</button>`).join('')}
      </div>
    `;
  }

  function render() {
    summary.textContent = '共读取 ' + records.length + ' 条登记记录。';
    list.innerHTML = records.length
      ? records.map(recordMarkup).join('')
      : '<div class="admin-empty">没有符合条件的登记记录。</div>';
    const selected = records.find(item => item.id === selectedId);
    detail.innerHTML = detailMarkup(selected);
    updateMetrics();
  }

  async function load() {
    try {
      const result = await request('GET');
      records = result.items || [];
      if (!records.some(item => item.id === selectedId)) {
        selectedId = records[0]?.id || '';
      }
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
    await request('PATCH', { id, status: nextStatus });
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
    const card = event.target.closest('.admin-record');
    if (!card) return;
    selectedId = card.dataset.id;
    render();
  });
  list?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.admin-record');
    if (!card) return;
    event.preventDefault();
    selectedId = card.dataset.id;
    render();
  });
  detail?.addEventListener('click', async event => {
    const button = event.target.closest('button[data-status]');
    if (!button || !selectedId) return;
    button.disabled = true;
    try {
      await updateStatus(selectedId, button.dataset.status);
    } catch (error) {
      button.textContent = error.message;
    }
  });

  if (token) {
    tokenInput.value = token;
    load();
  }
})();
