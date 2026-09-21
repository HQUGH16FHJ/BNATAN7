(() => {
  if (document.getElementById('site-certification')) return;

  const isRights = location.hostname === 'rights.bantan.online'
    || location.pathname.includes('/copyright/');
  const code = isRights ? 'BNT-SITE-2026-003' : 'BNT-SITE-2026-001';
  const domain = isRights ? 'rights.bantan.online' : 'bantan.online';
  const label = isRights ? '版权中心官网编号' : '官网编号';

  const existing = Array.from(document.querySelectorAll('a')).some((link) => {
    const href = link.getAttribute('href') || '';
    const image = link.querySelector('img');
    return href.includes(code) || (image && (image.getAttribute('src') || '').includes(`code=${code}`));
  });
  if (existing) return;

  const aside = document.createElement('aside');
  aside.id = 'site-certification';
  aside.setAttribute('aria-label', '官方认证与官网编号');
  aside.innerHTML = `
    <style>
      #site-certification {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        width: min(calc(100% - 32px), 1140px);
        margin: 26px auto 0;
        padding: 13px 16px calc(13px + env(safe-area-inset-bottom));
        border: 1px solid rgba(245, 158, 11, .13);
        border-radius: 14px;
        color: #d6c7b8;
        background: rgba(12, 10, 8, .72);
        font: 10px/1.5 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      #site-certification a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: inherit;
        text-decoration: none;
      }
      #site-certification img {
        display: inline-block;
        width: 150px;
        height: 34px;
        vertical-align: middle;
      }
      #site-certification strong { color: #f59e0b; }
      @media (max-width: 560px) {
        #site-certification {
          align-items: flex-start;
          flex-direction: column;
          width: min(calc(100% - 24px), 1140px);
        }
        #site-certification img { width: 140px; height: 32px; }
      }
    </style>
    <a href="https://rights.bantan.online/site?code=${code}&domain=${domain}" target="_blank" rel="noopener">
      <img src="https://rights.bantan.online/api/rights/site-badge?code=${code}&domain=${domain}&v=20260921-1"
           width="150" height="34" loading="lazy" decoding="async"
           alt="绊谈官方认证 ${code}">
    </a>
    <span>${label} <strong>${code}</strong> · Bantan Rights 私有登记</span>
  `;

  const mount = () => document.body.appendChild(aside);
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
