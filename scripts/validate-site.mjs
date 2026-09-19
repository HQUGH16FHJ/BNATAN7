import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const requiredFiles = [
  'index.html',
  'landing.html',
  'changelog.html',
  'license.html',
  'explore.html',
  'releases.html',
  'badge.html',
  'share.html',
  'qr.html',
  'copyright/api.html',
  'copyright/ops.html',
  '.well-known/security.txt',
  'sbom.json',
  'checksums.json',
  'manifest.json',
  'sitemap.xml',
  'llms.txt',
  'license.json',
  'changelog.json',
  'feed.xml',
  'functions/api/rights/site-badge.js',
  'functions/api/rights/site-verify.js',
  'functions/api/rights/health.js',
  'functions/api/rights/openapi.js',
  'functions/api/rights/tls.js',
  'scripts/verify-site-codes.mjs'
];

async function exists(file) {
  try {
    await stat(path.join(root, file));
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative));
    else files.push(relative.replaceAll('\\', '/'));
  }
  return files;
}

for (const file of requiredFiles) {
  if (!await exists(file)) failures.push(`Missing required file: ${file}`);
}

const files = await walk('.');

for (const file of files.filter(name => name.endsWith('.json'))) {
  try {
    JSON.parse(await readFile(path.join(root, file), 'utf8'));
  } catch (error) {
    failures.push(`Invalid JSON: ${file}: ${error.message}`);
  }
}

for (const file of files.filter(name => name.endsWith('.js') || name.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`JavaScript syntax error: ${file}\n${result.stderr.trim()}`);
}

for (const file of files.filter(name => name.endsWith('.html') && !name.includes('google') && !name.includes('baidu_verify') && !name.endsWith('og-image.html'))) {
  const html = await readFile(path.join(root, file), 'utf8');
  if (!/<html[\s>]/i.test(html)) failures.push(`Missing html root: ${file}`);
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`Missing title: ${file}`);
  if (!/name=["']viewport["']/i.test(html)) failures.push(`Missing viewport meta: ${file}`);
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
for (const url of [
  'https://bantan.online/releases.html',
  'https://bantan.online/badge.html',
  'https://bantan.online/share.html',
  'https://bantan.online/qr.html',
  'https://rights.bantan.online/api',
  'https://rights.bantan.online/ops'
]) {
  if (!sitemap.includes(url)) failures.push(`Sitemap missing: ${url}`);
}

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue(s):\n`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Site validation passed: ${files.length} files checked.`);
