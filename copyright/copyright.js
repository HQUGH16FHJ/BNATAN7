(function () {
  'use strict';

  const registry = [
    {
      code: 'BNT-RIGHTS-2026-001',
      name: '绊谈 · 万能枢纽',
      owner: '绊谈 Bantan',
      producer: '绊谈 Bantan',
      license: 'Bantan Proprietary License',
      domains: ['bantan.online', 'www.bantan.online', 'bantan.eu.cc', 'bnatan7.pages.dev'],
      status: 'ACTIVE'
    },
    {
      code: 'BNT-RIGHTS-2026-002',
      name: '刘骐硕个人博客',
      owner: '刘骐硕',
      producer: '绊谈 Bantan（仅制作署名）',
      license: 'Liu Qishuo Proprietary License',
      domains: ['llllkk.online'],
      status: 'ACTIVE'
    },
    {
      code: 'BNT-RIGHTS-2026-003',
      name: 'Bantan Rights',
      owner: '绊谈 Bantan',
      producer: '绊谈 Bantan',
      license: 'Bantan Proprietary License',
      domains: ['rights.bantan.online'],
      status: 'BUILDING'
    }
  ];

  const form = document.getElementById('rightsVerifyForm');
  const input = document.getElementById('rightsVerifyInput');
  const result = document.getElementById('rightsVerifyResult');
  const contactModal = document.getElementById('contactModal');
  const contactCopy = document.getElementById('contactModalCopy');
  let contactReturnFocus = null;

  function normalize(value) {
    return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  function render(record, query) {
    result.dataset.state = record ? 'official' : 'unknown';
    result.querySelector('.verify-console__icon').textContent = record ? '✓' : '!';
    result.querySelector('strong').textContent = record ? record.name : '未找到登记信息';
    result.querySelector('p').textContent = record
      ? '编号 ' + record.code + '｜版权所有者：' + record.owner + '｜许可证：' + record.license + '｜状态：' + record.status
      : '“' + query + '”不在当前版权登记表中，请核对编号或官方域名。';
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) {
      render(null, '空内容');
      return;
    }
    const normalized = normalize(query);
    const record = registry.find(item =>
      item.code.toLowerCase() === query.toLowerCase() ||
      item.domains.some(domain => normalize(domain) === normalized)
    );
    render(record, query);
  });

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = '已复制';
      } catch (error) {
        button.textContent = '复制失败';
      }
      setTimeout(() => { button.textContent = original; }, 1400);
    });
  });

  function openContactModal(intent) {
    if (!contactModal) return;
    contactReturnFocus = document.activeElement;
    contactModal.hidden = false;
    document.body.classList.add('has-contact-modal');
    if (contactCopy) {
      contactCopy.textContent = intent === 'authorize'
        ? '请选择任一渠道发送授权申请。正式申请建议使用邮箱，并写明项目名称、使用场景、授权期限、使用地区和分发范围。'
        : '授权、合作、版权核对和技术支持都可以通过以下渠道联系。';
    }
    requestAnimationFrame(() => {
      const target = intent === 'authorize'
        ? contactModal.querySelector('.contact-modal__primary')
        : contactModal.querySelector('.contact-modal__head [data-contact-close]');
      target?.focus();
    });
  }

  function closeContactModal() {
    if (!contactModal || contactModal.hidden) return;
    contactModal.hidden = true;
    document.body.classList.remove('has-contact-modal');
    contactReturnFocus?.focus?.();
  }

  document.querySelectorAll('[data-contact-open]').forEach(button => {
    button.addEventListener('click', () => openContactModal(button.dataset.contactIntent || ''));
  });

  contactModal?.querySelectorAll('[data-contact-close]').forEach(button => {
    button.addEventListener('click', closeContactModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeContactModal();
  });

  document.getElementById('printCertificate')?.addEventListener('click', () => window.print());
})();
