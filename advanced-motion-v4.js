(function () {
  'use strict';

  const path = location.pathname.toLowerCase();
  const page = path.endsWith('/index.html') ? 'index' : path.endsWith('/landing.html') || path.endsWith('/') ? 'landing' : '';
  if (!page) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const features = [
    ['AI 对话', 'DeepSeek · 豆包 · Kimi', '✦'],
    ['全网搜索', '百度 · Bing · Google', '⌕'],
    ['开发者工具', '代码 · 正则 · API', '{}'],
    ['电竞优化', '帧率 · 延迟 · 刷新率', '⌁'],
    ['教育学习', 'GPA · 背诵 · 课表', '∑'],
    ['影音工具', '视频 · 音乐 · 图片', '▶'],
    ['隐私工具', '本地处理 · 不上传', '⌾'],
    ['效率工具', '便签 · 日历 · 倒计时', '◷']
  ];

  function addCursorLight() {
    if (reduced || !window.matchMedia('(hover: hover)').matches) return;
    const light = document.createElement('div');
    light.className = 'am-cursor-light';
    document.body.appendChild(light);
    document.body.classList.add('am-cursor-ready');
    document.addEventListener('pointermove', event => {
      light.style.left = event.clientX + 'px';
      light.style.top = event.clientY + 'px';
    }, { passive: true });
  }

  function addMotionControl(anchor) {
    if (!anchor || anchor.querySelector('.am-motion-control')) return;
    const control = document.createElement('div');
    control.className = 'am-motion-control';
    control.innerHTML = [
      '<span>完整动效</span>',
      '<label class="uiverse-switch" style="width:46px;height:24px;">',
      '  <input type="checkbox" checked>',
      '  <span class="uiverse-switch-track">',
      '    <span class="uiverse-switch-thumb" style="width:16px;height:16px;"></span>',
      '    <span class="uiverse-switch-dot" style="width:9px;height:9px;"></span>',
      '  </span>',
      '</label>'
    ].join('');
    const input = control.querySelector('input');
    const saved = localStorage.getItem('bantan_motion_full');
    const enabled = saved !== '0';
    input.checked = enabled;
    document.body.classList.toggle('am-calm', !enabled);
    input.addEventListener('change', () => {
      const on = input.checked;
      document.body.classList.toggle('am-calm', !on);
      localStorage.setItem('bantan_motion_full', on ? '1' : '0');
    });
    anchor.appendChild(control);
  }

  function addHeroParallax() {
    if (page !== 'landing' || reduced || coarse) return;
    const hero = document.querySelector('.hero');
    const left = document.querySelector('.hero-left');
    const right = document.querySelector('.hero-right');
    if (!hero || !left || !right) return;
    let raf = 0;
    const update = (x, y) => {
      raf = 0;
      left.style.transform = 'translate3d(' + (x * -10) + 'px,' + (y * -8) + 'px,0)';
      right.style.transform = 'translate3d(' + (x * 14) + 'px,' + (y * 10) + 'px,0) rotateY(' + (x * 2) + 'deg)';
    };
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => update(x, y));
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      left.style.transform = '';
      right.style.transform = '';
    });
  }

  function addMarquee() {
    const anchor = document.querySelector('.bnt-site-slider-section') || document.querySelector('#home');
    if (!anchor || document.querySelector('.am-marquee-section')) return;
    const section = document.createElement('section');
    section.className = 'am-marquee-section';
    section.innerHTML = [
      '<div class="container">',
      '  <div class="am-section-head"><div><div class="am-section-title">工具在移动，需求也在流动</div><div class="am-section-desc">React Bits Infinite Moving Cards + Aceternity 结构语言，用于展示绊谈的主要能力。</div></div></div>',
      '  <div class="am-marquee"></div>',
      '</div>'
    ].join('');
    const track = section.querySelector('.am-marquee');
    const renderCard = feature => {
      const card = document.createElement('article');
      card.className = 'am-marquee-card';
      card.innerHTML = '<div><div class="am-marquee-icon">' + feature[2] + '</div><div class="am-marquee-name">' + feature[0] + '</div><div class="am-marquee-desc">' + feature[1] + '</div></div>';
      return card;
    };
    features.forEach(feature => track.appendChild(renderCard(feature)));
    features.forEach(feature => track.appendChild(renderCard(feature)));
    anchor.insertAdjacentElement('afterend', section);
    addMotionControl(section.querySelector('.am-section-head'));
  }

  function initialize() {
    addCursorLight();
    if (page === 'landing') {
      addHeroParallax();
      addMarquee();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
