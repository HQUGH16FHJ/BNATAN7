const GONE_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>页面已删除 · 绊谈 Bantan</title>
  <style>
    :root { color-scheme: dark; }
    body {
      display: grid;
      min-height: 100vh;
      margin: 0;
      place-items: center;
      color: #fff7ed;
      background: #0a0805;
      font-family: "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif;
    }
    main {
      width: min(560px, calc(100% - 40px));
      padding: 40px;
      border: 1px solid rgba(245, 158, 11, .18);
      border-radius: 16px;
      background: rgba(28, 22, 14, .72);
    }
    span { color: #f59e0b; font-size: 12px; letter-spacing: .14em; }
    h1 { margin: 18px 0 12px; font-size: clamp(2rem, 8vw, 4rem); line-height: 1; }
    p { margin: 0; color: #d6c7b8; line-height: 1.8; }
    a { display: inline-flex; margin-top: 26px; color: #f59e0b; }
  </style>
</head>
<body>
  <main>
    <span>410 · GONE</span>
    <h1>这个页面已经删除</h1>
    <p>原来的制作方站点已停用，不会再恢复。搜索引擎和浏览器会自动移除这条旧记录。</p>
    <a href="https://bantan.online/">返回绊谈主站 →</a>
  </main>
</body>
</html>`;

export async function onRequest() {
  return new Response(GONE_HTML, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}
