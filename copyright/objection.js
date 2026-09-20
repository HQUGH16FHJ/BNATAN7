(() => {
  const form = document.getElementById('objectionForm');
  if (!form) return;

  const preview = {
    ring: document.getElementById('objectionRing'),
    meterTitle: document.getElementById('objectionMeterTitle'),
    meterText: document.getElementById('objectionMeterText'),
    code: document.getElementById('objectionCode'),
    target: document.getElementById('objectionTarget'),
    type: document.getElementById('objectionType'),
    action: document.getElementById('objectionAction'),
    status: document.getElementById('objectionStatus')
  };

  const copyButton = document.getElementById('copyObjection');
  const downloadButton = document.getElementById('downloadObjection');
  const mailButton = document.getElementById('openObjectionMail');
  const storageKey = 'bantan_rights_objection_draft';
  let dossier = null;

  const getValue = (name) => {
    const field = form.elements.namedItem(name);
    if (!field) return '';
    if (field.type === 'checkbox') return field.checked;
    return String(field.value || '').trim();
  };

  const readForm = () => ({
    recordCode: getValue('recordCode'),
    targetDomain: getValue('targetDomain'),
    projectName: getValue('projectName'),
    claimantName: getValue('claimantName'),
    contactEmail: getValue('contactEmail'),
    claimantType: getValue('claimantType'),
    relationship: getValue('relationship'),
    disputeType: getValue('disputeType'),
    requestedAction: getValue('requestedAction'),
    claimSummary: getValue('claimSummary'),
    evidenceSummary: getValue('evidenceSummary'),
    supportingLinks: getValue('supportingLinks'),
    declaration: Boolean(getValue('declaration'))
  });

  const requiredFields = [
    'recordCode',
    'projectName',
    'claimantName',
    'contactEmail',
    'disputeType',
    'requestedAction',
    'claimSummary',
    'declaration'
  ];

  const randomToken = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const twoDigits = (number) => String(number).padStart(2, '0');

  function createCode() {
    const now = new Date();
    const date = `${twoDigits(now.getFullYear() % 100)}${twoDigits(now.getMonth() + 1)}${twoDigits(now.getDate())}`;
    return `BNT-DISPUTE-${date}-${randomToken()}`;
  }

  function buildDossier() {
    const values = readForm();
    return {
      code: createCode(),
      createdAt: new Date().toISOString(),
      registry: 'Bantan Rights',
      recordCode: values.recordCode,
      targetDomain: values.targetDomain,
      projectName: values.projectName,
      claimant: {
        name: values.claimantName,
        email: values.contactEmail,
        type: values.claimantType,
        relationship: values.relationship
      },
      dispute: {
        type: values.disputeType,
        requestedAction: values.requestedAction,
        claimSummary: values.claimSummary,
        evidenceSummary: values.evidenceSummary,
        supportingLinks: values.supportingLinks
      },
      declaration: values.declaration,
      status: 'draft'
    };
  }

  function buildMailBody(item) {
    return [
      'Bantan Rights 权属异议 / 移除申请',
      `异议编号：${item.code}`,
      `提交时间：${item.createdAt}`,
      '',
      `目标登记编号：${item.recordCode}`,
      `目标域名：${item.targetDomain || '未填写'}`,
      `项目 / 网站名称：${item.projectName}`,
      '',
      `申请人：${item.claimant.name}`,
      `联系邮箱：${item.claimant.email}`,
      `主体类型：${item.claimant.type}`,
      `与登记的关系：${item.claimant.relationship || '未填写'}`,
      '',
      `异议类型：${item.dispute.type}`,
      `请求处理方式：${item.dispute.requestedAction}`,
      '',
      '事实与权利依据：',
      item.dispute.claimSummary,
      '',
      '证据线索：',
      item.dispute.evidenceSummary || '未填写',
      '',
      '相关链接：',
      item.dispute.supportingLinks || '未填写',
      '',
      '本人声明：以上信息由本人或授权主体提交，并理解本站会进行人工核对，不保证异议必然导致移除。'
    ].join('\n');
  }

  function updatePreview() {
    const data = readForm();
    const filled = requiredFields.filter((name) => {
      const value = data[name];
      return value === true || (typeof value === 'string' && value.length > 0);
    }).length;
    const progress = Math.round((filled / requiredFields.length) * 100);

    preview.ring.dataset.progress = `${progress}%`;
    preview.ring.style.setProperty('--progress', `${progress}%`);
    preview.meterTitle.textContent = progress === 100 ? '材料可以生成' : '材料完整度';
    preview.meterText.textContent = progress === 100 ? '请检查内容并生成异议档案。' : `已完成 ${filled} / ${requiredFields.length} 项必填信息。`;
    preview.target.textContent = data.projectName || data.recordCode || '--';
    preview.type.textContent = data.disputeType || '--';
    preview.action.textContent = data.requestedAction || '--';
  }

  function writeDraft(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      // Storage may be unavailable in privacy mode.
    }
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function fillDraft(data) {
    if (!data) return;
    Object.entries(data).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else if (value !== undefined && value !== null) field.value = value;
    });
    updatePreview();
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
  }

  form.addEventListener('input', () => {
    const data = readForm();
    writeDraft(data);
    updatePreview();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    dossier = buildDossier();
    const mailBody = buildMailBody(dossier);
    const subject = `Bantan Rights 权属异议 · ${dossier.code}`;

    preview.code.textContent = dossier.code;
    preview.status.textContent = '待发送';
    copyButton.disabled = false;
    downloadButton.disabled = false;
    mailButton.hidden = false;
    mailButton.href = `mailto:125668039@163.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;

    copyButton.onclick = () => copyText(mailBody).then(() => {
      copyButton.textContent = '已复制';
      setTimeout(() => { copyButton.textContent = '复制邮件材料'; }, 1600);
    });

    downloadButton.onclick = () => {
      const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${dossier.code}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    };

    writeDraft(readForm());
    updatePreview();
  });

  form.addEventListener('reset', () => {
    dossier = null;
    preview.code.textContent = '--';
    preview.status.textContent = '草稿';
    copyButton.disabled = true;
    downloadButton.disabled = true;
    mailButton.hidden = true;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      // Storage may be unavailable in privacy mode.
    }
    requestAnimationFrame(updatePreview);
  });

  const params = new URLSearchParams(window.location.search);
  const presetCode = params.get('code') || '';
  const presetDomain = params.get('domain') || '';
  const presetProject = params.get('project') || '';
  if (presetCode) form.elements.namedItem('recordCode').value = presetCode;
  if (presetDomain) form.elements.namedItem('targetDomain').value = presetDomain;
  if (presetProject) form.elements.namedItem('projectName').value = presetProject;

  const draft = readDraft();
  if (!presetCode && !presetDomain && draft) fillDraft(draft);
  updatePreview();
})();
