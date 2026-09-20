import { writeFile } from "node:fs/promises";

const PROJECTS = {
  index: "vcWiYF2t5QrebGQEPFzm",
  landing: "iCkkjmbmqGv0zaN2U0Nb"
};

const BACKGROUND_TEXT = {
  title: "BANTAN",
  subtitle: "绊谈 · 连接需求，点亮可能"
};

async function fetchProject(id) {
  const url = `https://assets.unicorn.studio/embeds/${id}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to fetch UnicornStudio project ${id}: ${response.status}`);
  }

  return response.json();
}

function getTextLayers(project) {
  return project.layers.filter((layer) => layer.layerType === "text");
}

function styleBrandText(project, opacity) {
  const [titleLayer, subtitleLayer] = getTextLayers(project);

  if (!titleLayer || !subtitleLayer) {
    throw new Error("Expected two text layers in the UnicornStudio project.");
  }

  titleLayer.textContent = BACKGROUND_TEXT.title;
  titleLayer.fill = ["#f59e0b"];
  titleLayer.data = {
    ...titleLayer.data,
    elementOpacity: opacity.title
  };

  subtitleLayer.textContent = BACKGROUND_TEXT.subtitle;
  subtitleLayer.width = 0.7;
  subtitleLayer.fontSize = 0.022;
  subtitleLayer.lineHeight = 1.25;
  subtitleLayer.fontFamily = '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif';
  subtitleLayer.fontStyle = "regular";
  subtitleLayer.fontWeight = "500";
  subtitleLayer.fill = ["#d6c7b8"];
  delete subtitleLayer.fontCSS;
  subtitleLayer.data = {
    ...subtitleLayer.data,
    elementOpacity: opacity.subtitle
  };

  return [titleLayer, subtitleLayer];
}

function addBrandTextToLanding(landingProject, textLayers, opacity) {
  const backgroundIndex = landingProject.layers.findIndex(
    (layer) => layer.data?.isBackground
  );
  const insertIndex = backgroundIndex >= 0 ? backgroundIndex + 1 : 0;

  const copiedLayers = textLayers.map((layer, index) => ({
    ...structuredClone(layer),
    id: `landing-brand-text-${index + 1}`,
    publicId: index === 0 ? "text" : "text1",
    visible: true,
    data: {
      ...layer.data,
      elementOpacity: index === 0 ? opacity.title : opacity.subtitle
    }
  }));

  landingProject.layers.splice(insertIndex, 0, ...copiedLayers);
}

function writeJson(project, fileName) {
  return writeFile(
    new URL(`../${fileName}`, import.meta.url),
    `${JSON.stringify(project, null, 2)}\n`,
    "utf8"
  );
}

const [indexProject, landingProject] = await Promise.all([
  fetchProject(PROJECTS.index),
  fetchProject(PROJECTS.landing)
]);

const indexTextLayers = styleBrandText(indexProject, {
  title: 0.18,
  subtitle: 0.36
});

addBrandTextToLanding(
  landingProject,
  indexTextLayers.map((layer) => {
    const copy = structuredClone(layer);
    copy.fill = layer.publicId === "text" ? ["#f59e0b"] : ["#d6c7b8"];
    return copy;
  }),
  {
    title: 0.16,
    subtitle: 0.32
  }
);

await Promise.all([
  writeJson(indexProject, "unicorn-index.json"),
  writeJson(landingProject, "unicorn-landing.json")
]);

console.log("Updated unicorn-index.json and unicorn-landing.json");
