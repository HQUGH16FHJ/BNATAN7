(() => {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const interactiveSelector =
    ".tool-card, .mini-card, .glass-card, .hud-gauge, .bento-cell, .preview-panel, .preview-row";
  let activeSurface = null;

  document.documentElement.classList.add("v6-visual-ready");

  if (finePointer && !reducedMotion) {
    document.addEventListener(
      "pointermove",
      (event) => {
        const surface = event.target.closest(interactiveSelector);
        if (activeSurface && activeSurface !== surface) {
          activeSurface.style.removeProperty("--v6-mx");
          activeSurface.style.removeProperty("--v6-my");
          activeSurface.style.removeProperty("--v6-tilt-x");
          activeSurface.style.removeProperty("--v6-tilt-y");
        }

        activeSurface = surface;
        if (!surface) {
          return;
        }

        const rect = surface.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
        const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
        const nx = x / Math.max(rect.width, 1) - 0.5;
        const ny = y / Math.max(rect.height, 1) - 0.5;
        surface.style.setProperty("--v6-mx", `${x}px`);
        surface.style.setProperty("--v6-my", `${y}px`);
        surface.style.setProperty("--v6-tilt-y", `${nx * 3.2}deg`);
        surface.style.setProperty("--v6-tilt-x", `${ny * -3.2}deg`);
        surface.style.transform = `perspective(900px) rotateX(var(--v6-tilt-x, 0deg)) rotateY(var(--v6-tilt-y, 0deg)) translateY(-4px) scale(1.012)`;
      },
      { passive: true },
    );

    document.addEventListener("pointerleave", () => {
      if (!activeSurface) {
        return;
      }
      activeSurface.style.transform = "";
      activeSurface.style.removeProperty("--v6-tilt-x");
      activeSurface.style.removeProperty("--v6-tilt-y");
      activeSurface = null;
    });

    const heroGrid = document.querySelector(".hero-grid");
    heroGrid?.addEventListener(
      "pointermove",
      (event) => {
        const rect = heroGrid.getBoundingClientRect();
        heroGrid.style.setProperty(
          "--v6-hero-x",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        heroGrid.style.setProperty(
          "--v6-hero-y",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      },
      { passive: true },
    );
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest(
      ".tool-card, .mini-card, .bento-cell, .preview-panel, .preview-row, .btn, .nav-login-btn, .hero-search-btn, .nav-links a, .nav-cta",
    );
    if (!target || reducedMotion) {
      return;
    }

    const ripple = document.createElement("span");
    ripple.className = "v6-click-ripple";
    ripple.style.left = `${event.clientX}px`;
    ripple.style.top = `${event.clientY}px`;
    document.body.append(ripple);
    window.setTimeout(() => ripple.remove(), 680);
  });

  const cards = [
    ...document.querySelectorAll(
      ".tool-card, .bento-cell, .preview-panel, .preview-row",
    ),
  ];
  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.style.setProperty(
            "--v6-card-index",
            String([...entry.target.parentElement.children].indexOf(entry.target) % 12),
          );
          entry.target.classList.add("v6-card-visible");
          currentObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "180px 0px", threshold: 0.02 },
    );
    cards.forEach((card) => observer.observe(card));
  }

  let lastScroll = window.scrollY;
  let navFrame = null;
  window.addEventListener(
    "scroll",
    () => {
      if (navFrame) {
        return;
      }
      navFrame = window.requestAnimationFrame(() => {
        const nav = document.querySelector(".nav, #navbar");
        if (nav) {
          const current = window.scrollY;
          const movingDown = current > lastScroll && current > 160;
          nav.style.transform = movingDown
            ? "translateY(-12px) scale(0.985)"
            : "translateY(0) scale(1)";
          lastScroll = current;
        }
        navFrame = null;
      });
    },
    { passive: true },
  );
})();
