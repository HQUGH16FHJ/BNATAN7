function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=1800',
      'access-control-allow-origin': '*'
    }
  });
}

async function inspect(domain) {
  const url = new URL('https://crt.sh/');
  url.searchParams.set('q', domain);
  url.searchParams.set('output', 'json');
  url.searchParams.set('exclude', 'expired');
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'Bantan-Rights-Certificate-Monitor/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    const now = Date.now();
    const valid = rows
      .filter(row => row.not_after)
      .map(row => ({
        issuer: row.issuer_name || 'Unknown issuer',
        notBefore: row.not_before,
        notAfter: row.not_after,
        commonName: row.common_name || domain,
        fingerprint: row.serial_number || null
      }))
      .filter(row => new Date(row.notAfter).getTime() > now)
      .sort((a, b) => new Date(b.notAfter) - new Date(a.notAfter));
    const latest = valid[0] || null;
    return {
      domain,
      status: latest ? 'valid' : 'unknown',
      latest,
      monitorUrl: `https://crt.sh/?q=${encodeURIComponent(domain)}`,
      sslLabsUrl: `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(domain)}`
    };
  } catch (error) {
    return {
      domain,
      status: 'unknown',
      error: error.message || 'Certificate lookup failed',
      monitorUrl: `https://crt.sh/?q=${encodeURIComponent(domain)}`,
      sslLabsUrl: `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(domain)}`
    };
  }
}

export async function onRequestGet() {
  const domains = ['bantan.online', 'llllkk.online', 'rights.bantan.online'];
  const items = await Promise.all(domains.map(inspect));
  return json({
    ok: true,
    generatedAt: new Date().toISOString(),
    source: 'crt.sh certificate transparency',
    disclaimer: '证书信息用于运维参考，最终以浏览器和证书颁发机构状态为准。',
    items
  });
}
