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

  function updateCompleteness() {
    const checks = [
      Boolean(value('projectName')),
      Boolean(value('owner')),
      Boolean(value('recordType')),
      Boolean(value('license')),
      works().length > 0,
      Boolean(value('domains')),
      Boolean(value('description')),
      document.getElementById('declareRights').checked
    ];
    const percent = Math.round(checks.filter(Boolean).length / checks.length * 100);
    const ring = document.getElementById('submissionRing');
    const meterText = document.getElementById('submissionMeterText');
    if (ring) {
      ring.style.setProperty('--progress', percent + '%');
      ring.dataset.progress = percent + '%';
    }
    if (meterText) {
      meterText.textContent = percent === 100
        ? '资料已完整，可以正式提交。'
        : percent >= 60
          ? '主体和作品信息已基本完整。'
          : '继续填写必填项和作品范围。';
    }
  }

  function paint(data, status, message) {
    currentData = data;
    currentSummary = summary(data, status);
    preview.querySelector('h2').textContent = data.projectName + ' · 登记申请';
    preview.querySelector('p').textContent = message;
    document.getElementById('previewCode').textContent = data.registrationCode;
    document.getElementById('previewOwner').textContent = data.owner;
    document.getElementById('previewLicense').textContent = data.license;
    document.getElementById('previewStatus').textContent = status;
    document.getElementById('previewWorks').textContent = data.works.join('、') || '--';
    copyButton.disabled = false;
    sendLink.hidden = false;
    sendLink.textContent = '复制并打开 QQ 邮箱';
    sendLink.href = 'https://mail.qq.com/';
    sendLink.target = '_blank';
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

  async function sendQQNotification(data) {
    const response = await fetch('https://formsubmit.co/ajax/1429616034@qq.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        _subject: 'Bantan Rights 版权登记申请 · ' + data.projectName,
        _template: 'table',
        _captcha: 'false',
        _replyto: data.contact || 'noreply@bantan.online',
        登记编号: data.registrationCode,
        项目名称: data.projectName,
        登记类型: data.recordType,
        项目状态: data.projectStatus,
        版权所有者: data.owner,
        制作方: data.producer,
        官方域名: data.domains,
        代码仓库: data.repository,
        许可证: data.license,
        发布日期: data.releaseDate,
        作品范围: data.works.join('、'),
        联系邮箱: data.contact,
        联系电话: data.phone,
        作品说明: data.description,
        管理后台: 'https://rights.bantan.online/admin'
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) throw new Error(result.message || '邮件通知失败');
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
      let emailSent = Boolean(result.emailSent);
      if (!emailSent) {
        try {
          await sendQQNotification(data);
          emailSent = true;
        } catch (error) {}
      }
      paint(data, result.status || '待审核', emailSent
        ? '登记单已保存，QQ 邮件通知已提交。首次使用请到 QQ 邮箱点击激活邮件。'
        : '登记单已保存到数据库。点击“复制并打开 QQ 邮箱”，登记摘要会复制到剪贴板。');
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
    ['previewCode', 'previewOwner', 'previewLicense', 'previewWorks'].forEach(id => {
      document.getElementById(id).textContent = '--';
    });
    document.getElementById('previewStatus').textContent = '草稿';
    updateCompleteness();
  });

  form?.addEventListener('input', updateCompleteness);
  form?.addEventListener('change', updateCompleteness);
  updateCompleteness();

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

  sendLink?.addEventListener('click', async () => {
    if (!currentSummary) return;
    try {
      await navigator.clipboard.writeText(currentSummary);
    } catch (error) {}
  });

  printButton?.addEventListener('click', () => {
    if (!currentSummary) {
      form.reportValidity();
      return;
    }
    window.print();
  });
})();
