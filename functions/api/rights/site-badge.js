import { normalizeDomain } from './site-code.js';

function escapeXml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }[char]));
}

function svgResponse(svg, status = 200) {
  return new Response(svg, {
    status,
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
      'x-content-type-options': 'nosniff'
    }
  });
}

export async function onRequestGet(context) {
  const db = context.env.RIGHTS_DB;
  if (!db) return svgResponse('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="64"><text x="16" y="38" fill="#fff">数据库未绑定</text></svg>', 500);

  const url = new URL(context.request.url);
  const code = String(url.searchParams.get('code') || '').trim().toUpperCase();
  const domain = normalizeDomain(url.searchParams.get('domain'));
  const requestedTheme = String(url.searchParams.get('theme') || 'dark').toLowerCase();
  const themeName = ['dark', 'amber', 'light', 'mono'].includes(requestedTheme) ? requestedTheme : 'dark';
  if (!code || !domain) return svgResponse('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="64"><text x="16" y="38" fill="#fff">缺少验证参数</text></svg>', 400);

  const record = await db.prepare(`
    SELECT site_code, domain, project_name, owner, dns_verified_at, badge_enabled
    FROM site_registry
    WHERE site_code = ? AND lower(domain) = ?
    LIMIT 1
  `).bind(code, domain).first();
  if (!record || !record.badge_enabled) return svgResponse('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="64"><text x="16" y="38" fill="#fff">未找到认证记录</text></svg>', 404);

  const verified = Boolean(record.dns_verified_at);
  const themes = {
    dark: {
      background: '#0c0a08',
      title: '#fff7ed',
      sub: '#d6c7b8',
      accent: verified ? '#34d399' : '#f59e0b',
      border: verified ? '#34d399' : '#f59e0b'
    },
    amber: {
      background: '#251507',
      title: '#fff7ed',
      sub: '#f8d9a5',
      accent: '#fbbf24',
      border: '#fbbf24'
    },
    light: {
      background: '#f7f0e3',
      title: '#1b1712',
      sub: '#675b4e',
      accent: verified ? '#24734e' : '#a45c1f',
      border: verified ? '#24734e' : '#a45c1f'
    },
    mono: {
      background: '#111111',
      title: '#ffffff',
      sub: '#c7c7c7',
      accent: '#ffffff',
      border: '#ffffff'
    }
  };
  const theme = themes[themeName];
  const accent = theme.accent;
  const border = theme.border;
  const status = verified ? 'DOMAIN VERIFIED' : 'CODE VERIFIED';
  const title = escapeXml(record.project_name);
  const codeText = escapeXml(record.site_code);
  const domainText = escapeXml(record.domain);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="72" viewBox="0 0 320 72" role="img" aria-labelledby="title desc">
  <title id="title">绊谈官方认证 ${codeText}</title>
  <desc id="desc">${title}，${domainText}，${status}</desc>
  <rect x="1" y="1" width="318" height="70" rx="16" fill="${theme.background}" stroke="${border}" stroke-opacity=".48"/>
  <rect x="14" y="14" width="44" height="44" rx="12" fill="${accent}" fill-opacity=".13" stroke="${accent}" stroke-opacity=".3"/>
  <path d="M36 22l13 7v14l-13 7-13-7V29l13-7Z" fill="none" stroke="${accent}" stroke-width="2"/>
  <path d="m29 36 5 5 10-11" fill="none" stroke="${accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="72" y="28" fill="${theme.title}" font-family="Arial, sans-serif" font-size="13" font-weight="700">绊谈官方认证</text>
  <text x="72" y="46" fill="${theme.sub}" font-family="Consolas, monospace" font-size="10">${codeText}</text>
  <text x="72" y="60" fill="${accent}" font-family="Arial, sans-serif" font-size="8" font-weight="700" letter-spacing=".6">${status} · ${domainText}</text>
</svg>`;
  return svgResponse(svg);
}
