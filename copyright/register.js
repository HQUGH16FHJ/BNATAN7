(function () {
  'use strict';

  const form = document.getElementById('registrationForm');
  const preview = document.getElementById('registrationPreview');
  const copyButton = document.getElementById('copyRegistration');
  const sendLink = document.getElementById('sendRegistration');
  const printButton = document.getElementById('registerPrint');
  let currentSummary = '';
  let currentData = null;

  function value(name) {
    const field = form.elements[name];
    return field?.value?.trim() || '';
  }

  function works() {
    return Array.from(form.querySelectorAll('input[name="works"]:checked')).map(item => item.value);
  }

  function localCode() {
    const date = new Date();
    const stamp = String(date.getFullYear()).slice(-2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    return 'BNT-REG-' + stamp + '-' + String(Date.now()).slice(-4);
  }

  function buildData() {
    return {
      registrationCode: localCode(),
      projectName: value('projectName'),
      recordType: value('recordType'),
      projectStatus: value('projectStatus'),
      owner: value('owner'),
      producer: value('producer') || '--',
      domains: value('domains') || '--',
      repository: value('repository') || '--',
      license: value('license'),
      releaseDate: value('releaseDate') || '--',
      contact: value('contact') || '--',
      phone: value('phone') || '--',
      works: works(),
      description: value('description') || '--',
      declared: document.getElementById('declareRights').checked
    };
  }

  function summary(data, status) {
    return [
      '版权登记单',
      '登记编号：' + data.registrationCode,
      '登记状态：' + status,
      '项目名称：' + data.projectName,
      '登记类型：' + data.recordType,
      '项目状态：' + data.projectStatus,
      '版权所有者：' + data.owner,
      '制作方/合作方：' + data.producer,
      '官方域名：' + data.domains,
      '代码仓库：' + data.repository,
      '许可证：' + data.license,
      '发布日：' + data.releaseDate,
      '作品范围：' + data.works.join('、'),
      '联系邮箱：' + data.contact,
      '电话：' + data.phone,
      '作品说明：' + data.description
    ].join('\n');
  }

  function paint(data, status, message) {
    currentData = data;
    currentSummary = summary(data, status);
    preview.querySelector('h2').textContent = data.projectName + ' · 登记申请';
    preview.querySelector('p').textContent = message;
    preview.querySelector('dl').innerHTML = [
      '<div><dt>登记编号</dt><dd>' + data.registrationCode + '</dd></div>',
      '<div><dt>版权所有者</dt><dd>' + data.owner + '</dd></div>',
      '<div><dt>许可证</dt><dd>' + data.license + '</dd></div>',
      '<div><dt>登记状态</dt><dd>' + status + '</dd></div>',
      '<div><dt>作品范围</dt><dd>' + data.works.join('、') + '</dd></div>'
    ].join('');
    copyButton.disabled = false;
    sendLink.hidden = false;
    sendLink.textContent = '发送邮件通知';
    sendLink.href = 'mailto:1429616034@qq.com?subject=' + encodeURIComponent('版权登记申请 · ' + data.projectName) + '&body=' + encodeURIComponent(currentSummary);
  }

  async function submitRegistration(data) {
    const response = await fetch('/api/rights/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || '服务器提交失败');
    return result;
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = buildData();
    paint(data, '正在提交', '正在写入版权中心数据库，请稍候。');
    preview.classList.add('is-processing');
    preview.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const result = await submitRegistration(data);
      data.registrationCode = result.registrationCode;
      paint(data, result.status || '待审核', result.emailSent
        ? '登记单已保存到数据库，邮件通知也已发送。'
        : '登记单已保存到数据库。可在管理后台查看，也可以点击“发送邮件通知”。');
      try {
        localStorage.setItem('bantan_rights_registration_draft', JSON.stringify(data));
      } catch (error) {}
    } catch (error) {
      paint(data, '本地草稿', '数据库暂时无法提交，已保留本地草稿。请复制摘要或发送邮件通知。');
    } finally {
      preview.classList.remove('is-processing');
    }
  });

  form?.addEventListener('reset', () => {
    currentSummary = '';
    currentData = null;
    copyButton.disabled = true;
    sendLink.hidden = true;
    preview.querySelector('h2').textContent = '登记单尚未生成';
    preview.querySelector('p').textContent = '填写左侧表单并点击“生成登记单”，这里会显示登记编号、权利摘要和打印信息。';
    preview.querySelector('dl').innerHTML = '<div><dt>登记编号</dt><dd>--</dd></div><div><dt>版权所有者</dt><dd>--</dd></div><div><dt>许可证</dt><dd>--</dd></div><div><dt>登记状态</dt><dd>草稿</dd></div>';
  });

  copyButton?.addEventListener('click', async () => {
    if (!currentSummary) return;
    const original = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(currentSummary);
      copyButton.textContent = '已复制';
    } catch (error) {
      copyButton.textContent = '复制失败';
    }
    setTimeout(() => { copyButton.textContent = original; }, 1400);
  });

  printButton?.addEventListener('click', () => {
    if (!currentSummary) {
      form.reportValidity();
      return;
    }
    window.print();
  });
})();
