import { mkdir, readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('changelog.json', 'utf8'));
await mkdir('docs/og', { recursive: true });

for (const release of data.versions || []) {
  const title = escapeXml(`v${release.version} · ${release.title}`);
  const changes = (release.changes || []).slice(0, 3).map((change, index) =>
    `<text x="82" y="${392 + index * 52}" fill="#d6c7b8" font-family="Microsoft YaHei, sans-serif" font-size="28">✓ ${escapeXml(change)}</text>`
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="82%" cy="8%" r="70%">
      <stop stop-color="#38bdf8" stop-opacity=".25"/>
      <stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#090704"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="42" y="42" width="1116" height="546" rx="32" fill="#15100b" stroke="#f59e0b" stroke-opacity=".38" stroke-width="2"/>
  <rect x="78" y="78" width="72" height="72" rx="21" fill="#f59e0b"/>
  <text x="114" y="130" text-anchor="middle" fill="#090704" font-family="Microsoft YaHei, sans-serif" font-size="42" font-weight="900">绊</text>
  <text x="178" y="108" fill="#d6c7b8" font-family="Microsoft YaHei, sans-serif" font-size="24" font-weight="700">BANTAN · RELEASE CENTER</text>
  <text x="178" y="143" fill="#38bdf8" font-family="Consolas, monospace" font-size="20" font-weight="700">${escapeXml(release.date)}</text>
  <text x="82" y="270" fill="#fff7ed" font-family="Microsoft YaHei, sans-serif" font-size="52" font-weight="900">${title.slice(0, 30)}</text>
  ${changes}
  <text x="82" y="548" fill="#f59e0b" font-family="Microsoft YaHei, sans-serif" font-size="24" font-weight="800">bantan.online/releases</text>
</svg>`;
  await writeFile(`docs/og/release-v${release.version}.svg`, svg, 'utf8');
}

function escapeXml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }[char]));
}

console.log(`Generated ${(data.versions || []).length} release OG SVG file(s).`);
