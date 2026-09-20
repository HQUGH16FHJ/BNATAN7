(() => {
  const nodes = document.querySelectorAll('[data-canvas-text]');
  if (!nodes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palette = [
    'rgba(245, 158, 11, 1)',
    'rgba(56, 189, 248, 1)',
    'rgba(251, 191, 36, 0.9)',
    'rgba(56, 189, 248, 0.82)',
    'rgba(245, 158, 11, 0.72)',
    'rgba(139, 92, 246, 0.72)',
    'rgba(56, 189, 248, 0.62)',
    'rgba(251, 113, 133, 0.58)',
    'rgba(245, 158, 11, 0.42)',
    'rgba(56, 189, 248, 0.3)'
  ];

  function initialize(root) {
    const fallback = root.querySelector('[data-canvas-text-fallback]');
    const canvas = root.querySelector('[data-canvas-text-canvas]');
    if (!fallback || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const text = root.getAttribute('data-canvas-text') || fallback.textContent || '';
    const duration = Number(root.dataset.canvasTextDuration || 18);
    const lineGap = Number(root.dataset.canvasTextLineGap || 5);
    const lineWidth = Number(root.dataset.canvasTextLineWidth || 1.2);
    const curveIntensity = Number(root.dataset.canvasTextCurve || 24);
    const backgroundColor = root.dataset.canvasTextBackground || '#070a0f';

    let width = 0;
    let height = 0;
    let dpr = 1;
    let font = '';
    let frameId = 0;
    let resizeId = 0;
    let running = false;
    let startTime = performance.now();

    function measure() {
      const rect = fallback.getBoundingClientRect();
      const style = window.getComputedStyle(fallback);
      width = Math.max(1, Math.ceil(rect.width));
      height = Math.max(1, Math.ceil(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    }

    function draw(now) {
      if (!width || !height || !font) return;

      const elapsed = Math.max(0, now - startTime) / 1000;
      const phase = reduceMotion ? 0 : (elapsed / duration) * Math.PI * 2;
      const lines = Math.floor(height / lineGap) + 10;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent || height * 0.72;
      const descent = metrics.actualBoundingBoxDescent || height * 0.18;
      const baseline = (height + ascent - descent) / 2;

      ctx.fillStyle = '#000000';
      ctx.fillText(text, 0, baseline);

      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'source-atop';
      for (let index = 0; index < lines; index += 1) {
        const y = index * lineGap;
        const curveA = Math.sin(phase) * curveIntensity;
        const curveB = Math.sin(phase + 0.62) * curveIntensity * 0.62;

        ctx.strokeStyle = palette[index % palette.length];
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(width * 0.33, y + curveA, width * 0.66, y + curveB, width, y);
        ctx.stroke();
      }
    }

    function frame(now) {
      draw(now);
      if (!reduceMotion && running) frameId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion || document.hidden) return;
      running = true;
      startTime = performance.now();
      frameId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    }

    function resize() {
      stop();
      measure();
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      root.classList.add('is-ready');
      draw(performance.now());
      start();
    }

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeId);
        resizeId = requestAnimationFrame(resize);
      });
      resizeObserver.observe(fallback);
    } else {
      window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeId);
        resizeId = requestAnimationFrame(resize);
      }, { passive: true });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(resize).catch(resize);
    } else {
      resize();
    }
  }

  nodes.forEach(initialize);
})();
