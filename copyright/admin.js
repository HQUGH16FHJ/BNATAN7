(function () {
  'use strict';

  const login = document.getElementById('adminLogin');
  const consoleBox = document.getElementById('adminConsole');
  const tokenInput = document.getElementById('adminToken');
  const loginButton = document.getElementById('adminLoginButton');
  const loginStatus = document.getElementById('adminLoginStatus');
  const list = document.getElementById('adminList');
  const summary = document.getElementById('adminSummary');
  const search = document.getElementById('adminSearch');
  const status = document.getElementById('adminStatus');
  let token = sessionStorage.getItem('bantan_rights_admin_token') || '';
  let records = [];

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

  function render() {
    summary.textContent = '共读取 ' + records.length + ' 条登记记录。';
    list.innerHTML = records.length ? records.map(item => `
      <article class="admin-record" data-id="${escapeHtml(item.id)}">
        <div class="admin-record__head">
          <div><span>${escapeHtml(item.registration_code)}</span><h3>${escapeHtml(item.project_name)}</h3></div>
          <i>${escapeHtml(item.status)}</i>
        </div>
        <dl>
          <div><dt>版权所有者</dt><dd>${escapeHtml(item.owner)}</dd></div>
          <div><dt>官方域名</dt><dd>${escapeHtml(item.domains || '--')}</dd></div>
          <div><dt>联系邮箱</dt><dd>${escapeHtml(item.contact || '--')}</dd></div>
          <div><dt>提交时间</dt><dd>${escapeHtml(new Date(item.created_at).toLocaleString('zh-CN', { hour12: false }))}</dd></div>
        </dl>
        <details><summary>查看完整登记内容</summary><pre>${escapeHtml([
          '登记类型：' + item.record_type,
          '项目状态：' + item.project_status,
          '制作方：' + (item.producer || '--'),
          '代码仓库：' + (item.repository || '--'),
          '许可证：' + item.license,
          '发布日期：' + (item.release_date || '--'),
          '电话：' + (item.phone || '--'),
          '作品范围：' + (item.works || '--'),
          '作品说明：' + (item.description || '--')
        ].join('\n'))}</pre></details>
        <div class="admin-record__actions">
          ${['审核中', '已通过', '已驳回', '已归档'].map(state => `<button type="button" data-status="${state}">${state}</button>`).join('')}
        </div>
      </article>
    `).join('') : '<div class="admin-empty">没有符合条件的登记记录。</div>';
  }

  async function load() {
    try {
      const result = await request('GET');
      records = result.items || [];
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

  loginButton?.addEventListener('click', () => {
    token = tokenInput.value.trim();
    if (!token) {
      loginStatus.textContent = '请输入管理密钥。';
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
  search?.addEventListener('input', () => {
    clearTimeout(search._timer);
    search._timer = setTimeout(load, 300);
  });
  status?.addEventListener('change', load);
  list?.addEventListener('click', async event => {
    const button = event.target.closest('button[data-status]');
    const card = event.target.closest('.admin-record');
    if (!button || !card) return;
    button.disabled = true;
    try {
      await request('PATCH', { id: card.dataset.id, status: button.dataset.status });
      await load();
    } catch (error) {
      button.textContent = error.message;
    }
  });

  if (token) {
    tokenInput.value = token;
    load();
  }
})();
