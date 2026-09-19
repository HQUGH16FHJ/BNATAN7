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

  document.getElementById('printCertificate')?.addEventListener('click', () => window.print());
})();
