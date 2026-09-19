(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  root.classList.add("v7-ready");

  const ambient = document.createElement("div");
  ambient.className = "v7-ambient";
  ambient.setAttribute("aria-hidden", "true");
  document.body.prepend(ambient);

  const progress = document.createElement("div");
  progress.className = "v7-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  if (!reducedMotion) {
    const sweep = document.createElement("div");
    sweep.className = "v7-page-sweep";
    sweep.setAttribute("aria-hidden", "true");
    document.body.prepend(sweep);
    window.setTimeout(() => sweep.remove(), 1600);
  }

  const spotlight = document.createElement("div");
  spotlight.className = "v7-spotlight";
  spotlight.setAttribute("aria-hidden", "true");
  document.body.append(spotlight);

  let scrollFrame = 0;
  const updateProgress = () => {
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1,
    );
    const amount = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    progress.style.setProperty("--v7-progress", `${amount * 100}%`);
    scrollFrame = 0;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) {
        return;
      }
      scrollFrame = window.requestAnimationFrame(updateProgress);
    },
    { passive: true },
  );
  updateProgress();

  const revealSelector = [
    ".hero-left",
    ".hero-right",
    ".section-head",
    ".about-grid > *",
    ".brand-story",
    ".bento-item",
    ".bento-cell",
    ".preview-panel",
    ".category-card",
    ".tool-card",
    ".mini-card",
    ".glass-card",
    ".hot-tool-card",
    ".faq-item",
    ".cta-section",
    "footer > .container",
  ].join(",");

  const revealItems = [...document.querySelectorAll(revealSelector)];
  revealItems.forEach((item, index) => {
    if (reducedMotion) {
      item.classList.add("v7-in");
      return;
    }
    item.classList.add("v7-reveal");
    item.style.setProperty("--v7-delay", `${Math.min(index % 8, 7) * 55}ms`);
  });

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("v7-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "120px 0px -36px", threshold: 0.04 },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("v7-in"));
  }

  if (!finePointer || reducedMotion) {
    return;
  }

  let pointerFrame = 0;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  const interactiveSelector = [
    ".bento-item",
    ".bento-cell",
    ".category-card",
    ".tool-card",
    ".mini-card",
    ".glass-card",
    ".hot-tool-card",
    ".faq-item",
  ].join(",");

  document.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pointerFrame) {
        return;
      }
      pointerFrame = window.requestAnimationFrame(() => {
        spotlight.style.left = `${pointerX}px`;
        spotlight.style.top = `${pointerY}px`;

        const card = event.target.closest(interactiveSelector);
        if (card) {
          const rect = card.getBoundingClientRect();
          const x = Math.min(Math.max(pointerX - rect.left, 0), rect.width);
          const y = Math.min(Math.max(pointerY - rect.top, 0), rect.height);
          const nx = x / Math.max(rect.width, 1) - 0.5;
          const ny = y / Math.max(rect.height, 1) - 0.5;
          card.style.setProperty("--v7-mx", `${x}px`);
          card.style.setProperty("--v7-my", `${y}px`);
          card.style.setProperty("--v7-tilt-y", `${nx * 3.1}deg`);
          card.style.setProperty("--v7-tilt-x", `${ny * -3.1}deg`);
        }

        pointerFrame = 0;
      });
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      const card = event.target.closest(interactiveSelector);
      if (!card || card.contains(event.relatedTarget)) {
        return;
      }
      card.style.removeProperty("--v7-tilt-x");
      card.style.removeProperty("--v7-tilt-y");
    },
    { passive: true },
  );

  const heroGrid = document.querySelector(".hero-grid");
  if (heroGrid) {
    heroGrid.addEventListener(
      "pointermove",
      (event) => {
        const rect = heroGrid.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
        const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
        heroGrid.style.transform = [
          "perspective(1500px)",
          `rotateX(${y * -1.15}deg)`,
          `rotateY(${x * 1.4}deg)`,
          "translateY(-2px)",
        ].join(" ");
      },
      { passive: true },
    );

    heroGrid.addEventListener(
      "pointerleave",
      () => {
        heroGrid.style.transform = "";
      },
      { passive: true },
    );
  }

  const magneticSelector = [
    ".nav-cta",
    ".nav-login-btn",
    ".hero-search-btn",
    ".search-btn",
    ".btn",
    ".hero-tag",
    ".theme-toggle",
    ".hamburger",
  ].join(",");

  document.querySelectorAll(magneticSelector).forEach((element) => {
    element.addEventListener(
      "pointermove",
      (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
        const y = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
        element.style.translate = `${x * 7}px ${y * 7}px`;
      },
      { passive: true },
    );

    element.addEventListener(
      "pointerleave",
      () => {
        element.style.translate = "";
      },
      { passive: true },
    );
  });

  const heroTitle = document.querySelector("#hero-title, .hero-title");
  if (heroTitle && !heroTitle.querySelector(".v7-letter")) {
    const textNodes = [];
    const walker = document.createTreeWalker(heroTitle, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.trim()) {
        textNodes.push(node);
      }
    }

    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      [...node.nodeValue].forEach((character) => {
        if (character === "\n") {
          fragment.appendChild(document.createElement("br"));
          return;
        }
        if (/\s/.test(character)) {
          fragment.append(character);
          return;
        }
        const span = document.createElement("span");
        span.className = "v7-letter";
        span.textContent = character;
        fragment.appendChild(span);
      });
      node.replaceWith(fragment);
    });

    heroTitle.classList.add("v7-letters-ready");
  }

  document.addEventListener("click", (event) => {
    const interactive = event.target.closest(
      "a, button, .tool-card, .bento-item, .bento-cell, .category-card, .hero-tag, .hot-tool-card",
    );
    if (!interactive || event.button !== 0) {
      return;
    }

    const pulse = document.createElement("span");
    pulse.className = "v7-click-pulse";
    pulse.style.left = `${event.clientX}px`;
    pulse.style.top = `${event.clientY}px`;
    document.body.append(pulse);
    window.setTimeout(() => pulse.remove(), 760);
  });
})();
