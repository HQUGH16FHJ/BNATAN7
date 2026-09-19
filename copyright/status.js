(function () {
  'use strict';

  const form = document.getElementById('statusLookupForm');
  const result = document.getElementById('statusResult');

  function statusMeta(status) {
    return {
      '待审核': { label: '已提交，等待审核', copy: '版权中心已经收到登记申请，审核人会在后台进行处理。', step: 1 },
      '审核中': { label: '正在审核', copy: '登记资料正在核对中，如有问题可能需要补充材料。', step: 2 },
      '已通过': { label: '审核已通过', copy: '登记申请已经通过审核，请保留登记编号。', step: 3 },
      '已驳回': { label: '申请已驳回', copy: '登记申请未通过审核，请查看下方审核意见。', step: 3 },
      '已归档': { label: '申请已归档', copy: '该登记申请已经结束并归档。', step: 3 }
    }[status] || { label: status, copy: '登记状态已更新。', step: 2 };
  }

  function render(item) {
    const meta = statusMeta(item.status);
    result.dataset.state = item.status === '已通过' ? 'approved' : item.status === '已驳回' ? 'rejected' : 'pending';
    result.innerHTML = `
      <div class="status-result__icon">${item.status === '已通过' ? '✓' : item.status === '已驳回' ? '!' : '⌁'}</div>
      <div class="status-result__copy">
        <span>${item.registration_code}</span>
        <h2>${item.project_name}</h2>
        <p>${meta.copy}</p>
        <div class="status-steps">
          ${[1, 2, 3].map(step => `<i class="${step <= meta.step ? 'is-active' : ''}">${step}</i>`).join('')}
        </div>
        <dl>
          <div><dt>当前状态</dt><dd>${item.status}</dd></div>
          <div><dt>提交时间</dt><dd>${new Date(item.created_at).toLocaleString('zh-CN', { hour12: false })}</dd></div>
          <div><dt>最后更新</dt><dd>${new Date(item.updated_at || item.created_at).toLocaleString('zh-CN', { hour12: false })}</dd></div>
        </dl>
        ${item.review_note ? `<div class="status-review-note"><strong>审核意见</strong><p>${String(item.review_note).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))}</p></div>` : ''}
      </div>
    `;
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const code = document.getElementById('statusCode').value.trim();
    const email = document.getElementById('statusEmail').value.trim();
    result.dataset.state = 'loading';
    result.innerHTML = '<div class="status-result__icon">⌁</div><div class="status-result__copy"><span>SEARCHING</span><h2>正在查询</h2><p>正在比对登记编号和邮箱。</p></div>';
    try {
      const url = new URL('/api/rights/status', location.origin);
      url.searchParams.set('code', code);
      url.searchParams.set('email', email);
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '查询失败');
      render(data.item);
    } catch (error) {
      result.dataset.state = 'error';
      result.innerHTML = `<div class="status-result__icon">!</div><div class="status-result__copy"><span>NOT FOUND</span><h2>无法查询</h2><p>${error.message}</p></div>`;
    }
  });
})();
