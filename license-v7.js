(() => {
  "use strict";

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hero = document.querySelector(".lic-hero");

  document.documentElement.classList.add("license-v7-ready");

  if (hero) {
    const facts = document.createElement("div");
    facts.className = "lic-facts";
    facts.innerHTML = [
      "<span class=\"lic-fact\">MIT License</span>",
      "<span class=\"lic-fact\">SPDX: MIT</span>",
      "<span class=\"lic-fact\">Copyright 2026</span>",
    ].join("");

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "lic-copy";
    copy.textContent = "复制 SPDX 标识";
    copy.setAttribute("aria-label", "复制 MIT 许可证 SPDX 标识");
    copy.addEventListener("click", async () => {
      const value = "SPDX-License-Identifier: MIT";
      try {
        await navigator.clipboard.writeText(value);
        copy.textContent = "已复制 SPDX 标识";
        copy.classList.add("is-copied");
        window.setTimeout(() => {
          copy.textContent = "复制 SPDX 标识";
          copy.classList.remove("is-copied");
        }, 1800);
      } catch {
        copy.textContent = value;
      }
    });

    facts.append(copy);
    hero.append(facts);
  }

  const revealItems = [
    ...document.querySelectorAll(".lic-card, .lic-footer"),
  ];
  revealItems.forEach((item, index) => {
    if (reducedMotion) {
      item.classList.add("lic-in");
      return;
    }
    item.classList.add("lic-reveal");
    item.style.setProperty("--lic-delay", `${Math.min(index, 7) * 60}ms`);
  });

  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("lic-in");
          currentObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "120px 0px -30px", threshold: 0.04 },
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("lic-in"));
  }

  if (!finePointer || reducedMotion) {
    return;
  }

  const spotlight = document.createElement("div");
  spotlight.className = "lic-spotlight";
  spotlight.setAttribute("aria-hidden", "true");
  document.body.append(spotlight);

  let frame = 0;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  document.addEventListener(
    "pointermove",
    (event) => {
      x = event.clientX;
      y = event.clientY;
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        spotlight.style.left = `${x}px`;
        spotlight.style.top = `${y}px`;
        frame = 0;
      });
    },
    { passive: true },
  );
})();
