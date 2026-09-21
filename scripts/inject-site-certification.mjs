import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([
  "og-image.html",
  "baidu_verify_codeva-YLjTyR5ttz.html",
  "google25175afde3da614f.html"
]);

async function walk(directory) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative));
    else if (entry.name.endsWith(".html")) files.push(relative.replaceAll("\\", "/"));
  }
  return files;
}

const files = await walk(".");
let updated = 0;

for (const file of files) {
  if (ignored.has(path.basename(file))) continue;
  const absolute = path.join(root, file);
  const html = await readFile(absolute, "utf8");
  if (html.includes("site-certification.js")) continue;

  const depth = file.split("/").length - 1;
  const src = `${"../".repeat(depth)}site-certification.js?v=1.0.0`;
  const tag = `<script src="${src}" defer></script>`;
  const bodyIndex = html.toLowerCase().lastIndexOf("</body>");
  if (bodyIndex < 0) continue;
  const next = `${html.slice(0, bodyIndex)}${tag}\n${html.slice(bodyIndex)}`;

  await writeFile(absolute, next, "utf8");
  updated += 1;
}

console.log(`Injected site certification into ${updated} HTML files.`);
