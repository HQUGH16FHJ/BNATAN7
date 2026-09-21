import { writeFile } from "node:fs/promises";

const PROJECT_ID = "vcWiYF2t5QrebGQEPFzm";
const SOURCE_URL = `https://assets.unicorn.studio/embeds/${PROJECT_ID}`;

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Unable to fetch Unicorn project: ${response.status}`);
}

const project = await response.json();
const textLayers = project.layers.filter((layer) => layer.layerType === "text");

if (textLayers.length < 2) {
  throw new Error("Expected two text layers in the Unicorn project.");
}

const [titleLayer, subtitleLayer] = textLayers;

titleLayer.textContent = "绊谈";
titleLayer.fill = ["#f59e0b"];
titleLayer.fontFamily = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
titleLayer.fontStyle = "normal";
titleLayer.fontWeight = "700";
titleLayer.letterSpacing = 0.06;
delete titleLayer.fontCSS;

subtitleLayer.textContent = "连接需求，点亮可能";
subtitleLayer.fill = ["#d6c7b8"];
subtitleLayer.fontFamily = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
subtitleLayer.fontStyle = "normal";
subtitleLayer.fontWeight = "500";
subtitleLayer.letterSpacing = 0.08;
delete subtitleLayer.fontCSS;

await writeFile(
  new URL("../unicorn-index.json", import.meta.url),
  `${JSON.stringify(project, null, 2)}\n`,
  "utf8"
);

console.log("Updated unicorn-index.json with the Bantan brand text.");
