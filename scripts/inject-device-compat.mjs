import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const cssTag = name => `<link rel="stylesheet" href="${name}device-compat-v1.css?v=1.1.2">`;
const jsTag = name => `<script src="${name}device-compat-v1.js?v=1.1.3" defer></script>`;
const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(path));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }

  return files;
}

function updateFile(source, file) {
  if (!/<!doctype html>/i.test(source) || !/<\/head>/i.test(source) || !/<\/body>/i.test(source)) {
    return { changed: false, source };
  }

  const relativePath = relative(root, file);
  const depth = relativePath.split(sep).length - 1;
  const prefix = depth > 0 ? '../' : './';
  let next = source;
  let changed = false;

  next = next.replace(/<meta\s+name=["']viewport["'][^>]*>/i, viewportTag);

  if (!next.includes('device-compat-v1.css')) {
    const headEnd = next.toLowerCase().lastIndexOf('</head>');
    if (headEnd !== -1) {
      next = next.slice(0, headEnd) + `  ${cssTag(prefix)}\n` + next.slice(headEnd);
    }
    changed = true;
  }

  if (!next.includes('device-compat-v1.js')) {
    const bodyEnd = next.toLowerCase().lastIndexOf('</body>');
    if (bodyEnd !== -1) {
      next = next.slice(0, bodyEnd) + `  ${jsTag(prefix)}\n` + next.slice(bodyEnd);
    }
    changed = true;
  }

  if (next !== source) changed = true;
  return { changed, source: next };
}

const files = await collectHtml(root);
const changed = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const result = updateFile(source, file);
  if (!result.changed) continue;
  await writeFile(file, result.source, 'utf8');
  changed.push(relative(root, file));
}

console.log(`Updated ${changed.length} HTML files.`);
for (const file of changed) console.log(file);
