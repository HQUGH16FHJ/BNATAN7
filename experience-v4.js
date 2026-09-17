(function () {
  'use strict';

  const PATH = location.pathname.toLowerCase();
  const PAGE = PATH.endsWith('/license.html')
    ? 'license'
    : PATH.endsWith('/changelog.html')
      ? 'changelog'
      : PATH.endsWith('/404.html')
        ? '404'
        : PATH.endsWith('/about.html')
          ? 'about'
        : PATH.endsWith('/index.html')
          ? 'index'
          : 'landing';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PROVIDERS = [
    { id: 'baidu', name: '百度', desc: '中文综合搜索', icon: '百', mode: 'web', color: 'linear-gradient(135deg,#2563eb,#38bdf8)', url: 'https://www.baidu.com/s?wd={q}' },
    { id: 'bing', name: 'Bing', desc: '国际综合搜索', icon: 'B', mode: 'web', color: 'linear-gradient(135deg,#0ea5e9,#22c55e)', url: 'https://cn.bing.com/search?q={q}' },
    { id: 'google', name: 'Google', desc: '全球网页搜索', icon: 'G', mode: 'web', color: 'linear-gradient(135deg,#4285f4,#ea4335)', url: 'https://www.google.com/search?q={q}' },
    { id: 'sogou', name: '搜狗', desc: '微信内容搜索', icon: '搜', mode: 'web', color: 'linear-gradient(135deg,#fb923c,#ef4444)', url: 'https://www.sogou.com/web?query={q}' },
    { id: 'zhihu', name: '知乎', desc: '知识与经验', icon: '知', mode: 'community', color: 'linear-gradient(135deg,#1677ff,#60a5fa)', url: 'https://www.zhihu.com/search?type=content&q={q}' },
    { id: 'weibo', name: '微博', desc: '实时热点', icon: '微', mode: 'community', color: 'linear-gradient(135deg,#f97316,#ef4444)', url: 'https://s.weibo.com/weibo?q={q}' },
    { id: 'douban', name: '豆瓣', desc: '书影音评论', icon: '豆', mode: 'community', color: 'linear-gradient(135deg,#22c55e,#15803d)', url: 'https://www.douban.com/search?q={q}' },
    { id: 'xiaohongshu', name: '小红书', desc: '生活经验', icon: '红', mode: 'community', color: 'linear-gradient(135deg,#ef4444,#fb7185)', url: 'https://www.xiaohongshu.com/search_result?keyword={q}' },
    { id: 'bilibili', name: 'B站', desc: '视频与教程', icon: 'B', mode: 'video', color: 'linear-gradient(135deg,#fb7299,#38bdf8)', url: 'https://search.bilibili.com/all?keyword={q}' },
    { id: 'douyin', name: '抖音', desc: '短视频搜索', icon: '抖', mode: 'video', color: 'linear-gradient(135deg,#111827,#22d3ee)', url: 'https://www.douyin.com/search/{q}' },
    { id: 'youtube', name: 'YouTube', desc: '全球视频', icon: 'YT', mode: 'video', color: 'linear-gradient(135deg,#ef4444,#991b1b)', url: 'https://www.youtube.com/results?search_query={q}' },
    { id: 'github', name: 'GitHub', desc: '代码与项目', icon: 'GH', mode: 'dev', color: 'linear-gradient(135deg,#334155,#64748b)', url: 'https://github.com/search?q={q}&type=repositories' },
    { id: 'stackoverflow', name: 'Stack', desc: '开发问答', icon: 'SO', mode: 'dev', color: 'linear-gradient(135deg,#f59e0b,#f97316)', url: 'https://stackoverflow.com/search?q={q}' },
    { id: 'mdn', name: 'MDN', desc: 'Web 文档', icon: 'MD', mode: 'dev', color: 'linear-gradient(135deg,#0f766e,#22c55e)', url: 'https://developer.mozilla.org/zh-CN/search?q={q}' },
    { id: 'npm', name: 'npm', desc: 'Node 包', icon: 'np', mode: 'dev', color: 'linear-gradient(135deg,#dc2626,#f87171)', url: 'https://www.npmjs.com/search?q={q}' },
    { id: 'taobao', name: '淘宝', desc: '商品搜索', icon: '淘', mode: 'shopping', color: 'linear-gradient(135deg,#f97316,#fb7185)', url: 'https://s.taobao.com/search?q={q}' },
    { id: 'jd', name: '京东', desc: '数码与家电', icon: 'JD', mode: 'shopping', color: 'linear-gradient(135deg,#dc2626,#f87171)', url: 'https://search.jd.com/Search?keyword={q}' },
    { id: 'steam', name: 'Steam', desc: '游戏搜索', icon: 'ST', mode: 'shopping', color: 'linear-gradient(135deg,#0f172a,#38bdf8)', url: 'https://store.steampowered.com/search/?term={q}' },
    { id: 'deepseek', name: 'DeepSeek', desc: 'AI 问答', icon: 'DS', mode: 'ai', color: 'linear-gradient(135deg,#2563eb,#0ea5e9)', url: 'https://chat.deepseek.com/', copyQuery: true },
    { id: 'doubao', name: '豆包', desc: 'AI 助手', icon: '豆', mode: 'ai', color: 'linear-gradient(135deg,#2563eb,#60a5fa)', url: 'https://www.doubao.com/chat/', copyQuery: true },
    { id: 'kimi', name: 'Kimi', desc: '长文本 AI', icon: 'K', mode: 'ai', color: 'linear-gradient(135deg,#111827,#8b5cf6)', url: 'https://kimi.moonshot.cn/', copyQuery: true },
    { id: 'chatgpt', name: 'ChatGPT', desc: '通用 AI', icon: 'AI', mode: 'ai', color: 'linear-gradient(135deg,#0f766e,#34d399)', url: 'https://chatgpt.com/', copyQuery: true }
  ];
  const MODES = [
    ['web', '综合搜索'],
    ['community', '社区热点'],
    ['video', '视频内容'],
    ['dev', '开发资源'],
    ['shopping', '购物平台'],
    ['ai', 'AI 助手'],
    ['site', '站内工具']
  ];
  const QUICK = ['AI 写作', '游戏掉帧', 'PDF 转换', '在线翻译', 'Python 教程', '前端动画', '显卡驱动', '免费字体'];
  const state = {
    mode: 'web',
    selected: ['baidu'],
    multi: true,
    query: '',
    overlay: null,
    input: null,
    providerGrid: null,
    status: null
  };

  function addAmbient() {
    if (document.querySelector('.bnt-ambient')) return;
    const ambient = document.createElement('div');
    ambient.className = 'bnt-ambient';
    ambient.setAttribute('aria-hidden', 'true');
    ambient.innerHTML = '<div class="bnt-ambient-grid"></div><div class="bnt-ambient-beam"></div><div class="bnt-ambient-beam second"></div>';
    document.body.insertBefore(ambient, document.body.firstChild);
  }

  function ensureUnicornFallback() {
    const background = document.querySelector('.unicorn-bg');
    if (!background) return;
    const activateFallback = () => {
      if (!background.querySelector('canvas')) background.classList.add('fallback');
    };
    setTimeout(activateFallback, 4200);
    window.addEventListener('online', () => {
      setTimeout(() => {
        if (background.querySelector('canvas')) background.classList.remove('fallback');
      }, 900);
    }, { passive: true });
  }

  function addProgress() {
    if (document.querySelector('.bnt-page-progress')) return;
    const progress = document.createElement('div');
    progress.className = 'bnt-page-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.transform = 'scaleX(' + ratio + ')';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function addReveal() {
    if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;
    const selectors = [
      '.section-head', '.bento-cell', '.category-card', '.stat-item', '.preview-row',
      '.faq-item', '.featured-version', '.version-card', '.compact-version',
      '.highlight-item', '.lic-card', '.lic-info-grid', '.panel'
    ];
    const elements = Array.from(document.querySelectorAll(selectors.join(',')));
    elements.forEach((element, index) => {
      if (element.classList.contains('bnt-reveal')) return;
      element.classList.add('bnt-reveal');
      element.style.transitionDelay = Math.min(index % 8, 5) * 0.055 + 's';
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('bnt-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -45px 0px' });
    elements.forEach(element => observer.observe(element));
  }

  function addTilt() {
    if (REDUCED_MOTION || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.bento-cell, .category-card, .version-card, .featured-version, .lic-card').forEach(card => {
      card.classList.add('bnt-tilt');
      card.classList.add('bnt-spotlight');
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--bnt-mx', Math.round((x + 0.5) * 100) + '%');
        card.style.setProperty('--bnt-my', Math.round((y + 0.5) * 100) + '%');
        card.style.transform = 'perspective(900px) rotateX(' + (-y * 2.5) + 'deg) rotateY(' + (x * 3) + 'deg) translateY(-3px)';
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  function addMagneticButtons() {
    if (REDUCED_MOTION || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.nav-cta, .search-btn, .btn-primary, .bnt-search-submit, .profile-v2-action').forEach(button => {
      button.classList.add('bnt-magnetic');
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.transform = 'translate(' + (x * 7) + 'px,' + (y * 5) + 'px)';
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  function addClickSpark() {
    if (REDUCED_MOTION) return;
    const colors = ['#38bdf8', '#f59e0b', '#fb7185', '#34d399'];
    document.addEventListener('pointerdown', event => {
      const target = event.target.closest('button, a, .bento-cell, .tool-card, .version-card, .lic-card');
      if (!target) return;
      for (let i = 0; i < 6; i++) {
        const spark = document.createElement('span');
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.35;
        const distance = 18 + Math.random() * 24;
        spark.className = 'bnt-spark';
        spark.style.left = event.clientX + 'px';
        spark.style.top = event.clientY + 'px';
        spark.style.color = colors[i % colors.length];
        spark.style.background = colors[i % colors.length];
        spark.style.setProperty('--spark-x', Math.cos(angle) * distance + 'px');
        spark.style.setProperty('--spark-y', Math.sin(angle) * distance + 'px');
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 700);
      }
    }, { passive: true });
  }

  function addTracingBeam() {
    if (PAGE !== 'changelog' && PAGE !== 'license') return;
    const page = document.querySelector('.page') || document.querySelector('.lic-container');
    if (!page || page.querySelector('.bnt-tracing-beam')) return;
    const beam = document.createElement('div');
    beam.className = 'bnt-tracing-beam';
    if (getComputedStyle(page).position === 'static') page.style.position = 'relative';
    page.appendChild(beam);
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = page.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      beam.style.transform = 'translateX(-50%) scaleY(' + progress + ')';
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function addPageTransitions() {
    if (REDUCED_MOTION) return;
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      event.preventDefault();
      document.body.classList.add('bnt-page-exit');
      setTimeout(() => { location.href = url.href; }, 220);
    });
  }

  function addMobileDock() {
    if (document.querySelector('.bnt-mobile-dock')) return;
    if (PAGE !== 'landing' && PAGE !== 'index') return;
    const dock = document.createElement('nav');
    dock.className = 'bnt-mobile-dock';
    dock.setAttribute('aria-label', '移动端快捷导航');
    if (PAGE === 'landing') {
      dock.innerHTML = [
        '<button type="button" data-action="home" class="active"><span class="icon">⌂</span>首页</button>',
        '<button type="button" data-action="search"><span class="icon">⌕</span>搜索</button>',
        '<button type="button" data-action="tools"><span class="icon">▦</span>工具</button>',
        '<button type="button" data-action="ai"><span class="icon">✦</span>AI</button>',
        '<button type="button" data-action="login"><span class="icon">○</span>我的</button>'
      ].join('');
    } else {
      dock.innerHTML = [
        '<button type="button" data-action="home" class="active"><span class="icon">⌂</span>首页</button>',
        '<button type="button" data-action="search"><span class="icon">⌕</span>搜索</button>',
        '<button type="button" data-action="tools"><span class="icon">▦</span>工具</button>',
        '<button type="button" data-action="ai"><span class="icon">✦</span>AI</button>',
        '<button type="button" data-action="profile"><span class="icon">○</span>我的</button>'
      ].join('');
    }
    dock.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      dock.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
      const action = button.dataset.action;
      if (action === 'search') {
        window.BantanSearch.open();
      } else if (action === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (PAGE === 'index' && typeof window.navigate === 'function') window.navigate('home');
      } else if (action === 'tools') {
        if (PAGE === 'index' && typeof window.navigate === 'function') window.navigate('tools');
        else document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
      } else if (action === 'ai') {
        if (PAGE === 'index' && typeof window.toggleAIPanel === 'function') window.toggleAIPanel();
        else if (typeof window.openAuthModal === 'function') window.openAuthModal();
      } else if (action === 'profile') {
        if (typeof window.openUserProfile === 'function') window.openUserProfile();
        else if (typeof window.openAuthModal === 'function') window.openAuthModal();
      } else if (action === 'login' && typeof window.openAuthModal === 'function') {
        window.openAuthModal();
      }
    });
    document.body.appendChild(dock);
  }

  function getRecent() {
    try {
      return JSON.parse(localStorage.getItem('bantan_universal_recent') || '[]').slice(0, 8);
    } catch (e) {
      return [];
    }
  }

  function setRecent(query) {
    if (!query) return;
    const items = getRecent().filter(item => item !== query);
    items.unshift(query);
    try {
      localStorage.setItem('bantan_universal_recent', JSON.stringify(items.slice(0, 8)));
    } catch (e) {}
  }

  function providersForMode(mode) {
    return mode === 'site' ? [] : PROVIDERS.filter(provider => provider.mode === mode);
  }

  function ensureSearch() {
    if (state.overlay) return state.overlay;
    const overlay = document.createElement('div');
    overlay.className = 'bnt-search-overlay';
    overlay.innerHTML = [
      '<div class="bnt-search-panel" role="dialog" aria-modal="true" aria-labelledby="bnt-search-title">',
      '  <div class="bnt-search-topbar">',
      '    <div class="bnt-search-brand"><div class="bnt-search-brand-mark">绊</div><div><div class="bnt-search-title" id="bnt-search-title">万能枢纽搜索</div><div class="bnt-search-subtitle">一次输入，搜索全网与站内工具</div></div></div>',
      '    <button type="button" class="bnt-search-close" aria-label="关闭">✕</button>',
      '  </div>',
      '  <div class="bnt-search-input-row">',
      '    <span class="bnt-search-input-icon">⌕</span>',
      '    <input class="bnt-search-input" id="bnt-search-input" autocomplete="off" placeholder="输入关键词，选择网站后开始搜索">',
      '    <button type="button" class="bnt-search-submit">开始搜索</button>',
      '  </div>',
      '  <div class="bnt-search-modes"></div>',
      '  <div class="bnt-search-body">',
      '    <div class="bnt-search-section-title"><span id="bnt-provider-title">选择搜索网站</span><span id="bnt-provider-count"></span></div>',
      '    <div class="bnt-provider-grid"></div>',
      '    <div class="bnt-search-section-title">快速搜索</div>',
      '    <div class="bnt-search-quick" id="bnt-search-quick"></div>',
      '    <div class="bnt-search-section-title">最近搜索</div>',
      '    <div class="bnt-search-quick" id="bnt-search-recent"></div>',
      '    <div class="bnt-search-status" id="bnt-search-status">可同时选择最多 3 个网站进行多站同搜。</div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);
    state.overlay = overlay;
    state.input = overlay.querySelector('.bnt-search-input');
    state.providerGrid = overlay.querySelector('.bnt-provider-grid');
    state.status = overlay.querySelector('.bnt-search-status');

    overlay.querySelector('.bnt-search-close').addEventListener('click', closeSearch);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeSearch();
    });
    overlay.querySelector('.bnt-search-submit').addEventListener('click', runSearch);
    state.input.addEventListener('input', () => {
      state.query = state.input.value.trim();
    });
    state.input.addEventListener('keydown', event => {
      if (event.key === 'Enter') runSearch();
    });
    buildModes(overlay.querySelector('.bnt-search-modes'));
    renderProviders();
    renderQuick();
    renderRecent();
    return overlay;
  }

  function buildModes(container) {
    MODES.forEach(([id, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bnt-search-mode' + (id === state.mode ? ' active' : '');
      button.dataset.mode = id;
      button.textContent = label;
      button.addEventListener('click', () => {
        state.mode = id;
        state.selected = id === 'site' ? [] : [providersForMode(id)[0]?.id].filter(Boolean);
        container.querySelectorAll('.bnt-search-mode').forEach(item => item.classList.toggle('active', item === button));
        renderProviders();
        state.input.placeholder = id === 'site'
          ? '搜索绊谈站内工具、功能与命令'
          : '输入关键词，选择网站后开始搜索';
        state.status.textContent = id === 'site'
          ? '站内搜索会定位到绊谈工具导航。'
          : '可同时选择最多 3 个网站进行多站同搜。';
      });
      container.appendChild(button);
    });
  }

  function renderProviders() {
    if (!state.providerGrid) return;
    state.providerGrid.innerHTML = '';
    const providers = providersForMode(state.mode);
    if (state.mode === 'site') {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'bnt-provider active';
      card.innerHTML = '<span class="bnt-provider-icon" style="--provider-color:linear-gradient(135deg,#f59e0b,#fb7185)">绊</span><span><span class="bnt-provider-name">绊谈工具导航</span><span class="bnt-provider-desc">搜索站内功能</span></span>';
      state.providerGrid.appendChild(card);
      return;
    }
    providers.forEach(provider => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'bnt-provider' + (state.selected.includes(provider.id) ? ' active' : '');
      card.dataset.provider = provider.id;
      card.innerHTML = '<span class="bnt-provider-icon" style="--provider-color:' + provider.color + '">' + provider.icon + '</span><span><span class="bnt-provider-name">' + provider.name + '</span><span class="bnt-provider-desc">' + provider.desc + '</span></span>';
      card.addEventListener('click', () => {
        if (!state.multi) {
          state.selected = [provider.id];
          renderProviders();
          return;
        }
        const index = state.selected.indexOf(provider.id);
        if (index >= 0) {
          if (state.selected.length > 1) state.selected.splice(index, 1);
        } else {
          if (state.selected.length >= 3) {
            state.status.textContent = '最多选择 3 个网站。';
            return;
          }
          state.selected.push(provider.id);
        }
        renderProviders();
      });
      state.providerGrid.appendChild(card);
    });
  }

  function renderQuick() {
    const container = document.getElementById('bnt-search-quick');
    if (!container) return;
    container.innerHTML = '';
    QUICK.forEach(query => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bnt-search-chip';
      button.textContent = query;
      button.addEventListener('click', () => {
        state.input.value = query;
        state.query = query;
        state.input.focus();
      });
      container.appendChild(button);
    });
  }

  function renderRecent() {
    const container = document.getElementById('bnt-search-recent');
    if (!container) return;
    const recent = getRecent();
    container.innerHTML = '';
    if (!recent.length) {
      const empty = document.createElement('span');
      empty.className = 'bnt-search-chip';
      empty.textContent = '暂无记录';
      container.appendChild(empty);
      return;
    }
    recent.forEach(query => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bnt-search-chip';
      button.textContent = query;
      button.addEventListener('click', () => {
        state.input.value = query;
        state.query = query;
      });
      container.appendChild(button);
    });
  }

  function openSearch(options) {
    const overlay = ensureSearch();
    const opts = options || {};
    if (typeof opts.query === 'string') {
      state.query = opts.query;
      state.input.value = opts.query;
    }
    if (opts.mode) {
      state.mode = opts.mode;
      state.selected = opts.mode === 'site' ? [] : [providersForMode(opts.mode)[0]?.id].filter(Boolean);
      document.querySelectorAll('.bnt-search-mode').forEach(item => item.classList.toggle('active', item.dataset.mode === state.mode));
      renderProviders();
    }
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => state.input.focus(), 120);
  }

  function closeSearch() {
    if (!state.overlay) return;
    state.overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  function setMulti(enabled) {
    state.multi = enabled !== false;
    if (!state.multi && state.selected.length > 1) {
      state.selected = state.selected.slice(-1);
      renderProviders();
    }
    if (state.status) {
      state.status.textContent = state.multi
        ? '可同时选择最多 3 个网站进行多站同搜。'
        : '当前为单站搜索，选择新网站会替换原网站。';
    }
  }

  function siteSearch(query) {
    if (PAGE === 'landing') {
      if (typeof window.setPendingSearch === 'function') window.setPendingSearch(query);
      if (typeof window.openAuthModal === 'function') window.openAuthModal();
    } else {
      if (typeof window.navigate === 'function') window.navigate('nav');
      const navInput = document.getElementById('nav-tool-search');
      if (navInput) {
        navInput.value = query;
        if (typeof window.filterNavTools === 'function') window.filterNavTools();
      }
      const toolInput = document.getElementById('tool-search');
      if (toolInput) {
        toolInput.value = query;
        if (typeof window.filterTools === 'function') window.filterTools();
      }
    }
    closeSearch();
  }

  async function runSearch() {
    const query = state.input.value.trim();
    if (!query) {
      state.status.textContent = '请先输入搜索内容。';
      state.input.focus();
      return;
    }
    state.query = query;
    setRecent(query);
    renderRecent();
    if (state.mode === 'site') {
      siteSearch(query);
      return;
    }
    const selected = PROVIDERS.filter(provider => state.selected.includes(provider.id));
    if (!selected.length) {
      state.status.textContent = '请至少选择一个网站。';
      return;
    }
    const copyPromises = [];
    for (const provider of selected) {
      const url = provider.url.includes('{q}')
        ? provider.url.replace('{q}', encodeURIComponent(query))
        : provider.url;
      window.open(url, '_blank', 'noopener,noreferrer');
      if (provider.copyQuery && navigator.clipboard) {
        copyPromises.push(navigator.clipboard.writeText(query).catch(() => {}));
      }
    }
    if (copyPromises.length) await Promise.all(copyPromises);
    state.status.textContent = '已打开 ' + selected.length + ' 个网站。';
    closeSearch();
  }

  function installSearch() {
    ensureSearch();
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'bnt-search-trigger';
    trigger.innerHTML = '<span class="bnt-search-trigger-icon">⌕</span><span>全网搜索</span><kbd>Ctrl K</kbd>';
    trigger.addEventListener('click', () => openSearch());
    document.body.appendChild(trigger);
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopImmediatePropagation();
        openSearch();
      } else if (event.key === 'Escape' && state.overlay?.classList.contains('show')) {
        closeSearch();
      }
    }, true);
    if (typeof window.doSearch === 'function') {
      window.doSearch = function () {
        const input = document.getElementById('heroSearch') || document.getElementById('search_input');
        openSearch({ query: input ? input.value.trim() : '' });
      };
    }
    window.BantanSearch = { open: openSearch, close: closeSearch, setMulti: setMulti };
  }

  function enhanceChangelog() {
    if (PAGE !== 'changelog') return;
    const page = document.querySelector('.page');
    const header = document.querySelector('.page-header');
    const versions = Array.from(document.querySelectorAll('.featured-version, .version-card, .compact-version'));
    if (!page || !header || !versions.length) return;
    const changeCount = document.querySelectorAll('.change-item, .highlight-item, .compact-items li').length;
    const latestDate = document.querySelector('.version-date')?.textContent.trim() || '--';
    const meta = document.createElement('div');
    meta.className = 'bnt-archive-meta';
    meta.innerHTML = [
      '<div class="bnt-archive-stat"><div class="bnt-archive-stat-value">' + versions.length + '</div><div class="bnt-archive-stat-label">已记录版本</div></div>',
      '<div class="bnt-archive-stat"><div class="bnt-archive-stat-value">' + changeCount + '</div><div class="bnt-archive-stat-label">更新条目</div></div>',
      '<div class="bnt-archive-stat"><div class="bnt-archive-stat-value">' + latestDate + '</div><div class="bnt-archive-stat-label">最近发布</div></div>'
    ].join('');
    header.insertAdjacentElement('afterend', meta);

    const toolbar = document.createElement('div');
    toolbar.className = 'bnt-release-toolbar';
    toolbar.innerHTML = [
      '<input class="bnt-release-search" type="search" placeholder="搜索版本号、功能或修复内容" aria-label="搜索更新日志">',
      '<button class="bnt-filter-chip active" type="button" data-filter="all">全部</button>',
      '<button class="bnt-filter-chip" type="button" data-filter="add">新增</button>',
      '<button class="bnt-filter-chip" type="button" data-filter="improve">优化</button>',
      '<button class="bnt-filter-chip" type="button" data-filter="fix">修复</button>'
    ].join('');
    meta.insertAdjacentElement('afterend', toolbar);
    const search = toolbar.querySelector('.bnt-release-search');
    let activeFilter = 'all';
    const applyFilter = () => {
      const query = search.value.trim().toLowerCase();
      versions.forEach(version => {
        const text = version.textContent.toLowerCase();
        const queryMatch = !query || text.includes(query);
        const filterMatch = activeFilter === 'all'
          || text.includes({ add: '新增', improve: '优化', fix: '修复' }[activeFilter]);
        version.classList.toggle('bnt-archive-hidden', !(queryMatch && filterMatch));
      });
    };
    search.addEventListener('input', applyFilter);
    toolbar.querySelectorAll('.bnt-filter-chip').forEach(button => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.filter;
        toolbar.querySelectorAll('.bnt-filter-chip').forEach(item => item.classList.toggle('active', item === button));
        applyFilter();
      });
    });

    const tools = document.createElement('nav');
    tools.className = 'bnt-changelog-tools';
    tools.setAttribute('aria-label', '版本快速导航');
    versions.forEach((version, index) => {
      const number = version.querySelector('.version-number, .card-version, .compact-version-num')?.textContent.trim() || ('版本 ' + (index + 1));
      if (!version.id) version.id = 'version-' + number.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      const link = document.createElement('a');
      link.href = '#' + version.id;
      link.textContent = number;
      if (index === 0) link.classList.add('active');
      tools.appendChild(link);
    });
    toolbar.insertAdjacentElement('afterend', tools);
    const links = Array.from(tools.querySelectorAll('a'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0.05 });
    versions.forEach(version => observer.observe(version));
  }

  function enhanceLicense() {
    if (PAGE !== 'license') return;
    const container = document.querySelector('.lic-container');
    const hero = document.querySelector('.lic-hero');
    const cards = Array.from(document.querySelectorAll('.lic-card'));
    if (!container || !hero || !cards.length) return;
    if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
    const seal = document.createElement('div');
    seal.className = 'bnt-license-seal';
    seal.setAttribute('aria-hidden', 'true');
    hero.appendChild(seal);
    const index = document.createElement('nav');
    index.className = 'bnt-license-index';
    index.setAttribute('aria-label', '许可证章节');
    cards.forEach((card, cardIndex) => {
      const title = card.querySelector('.lic-card-title')?.textContent.trim() || ('章节 ' + (cardIndex + 1));
      if (!card.id) card.id = 'license-section-' + (cardIndex + 1);
      const link = document.createElement('a');
      link.href = '#' + card.id;
      link.textContent = title;
      if (cardIndex === 0) link.classList.add('active');
      index.appendChild(link);
    });
    hero.insertAdjacentElement('afterend', index);
    const toolbar = document.createElement('div');
    toolbar.className = 'bnt-license-toolbar';
    toolbar.innerHTML = [
      '<span style="font-size:10px;color:#7f8b9d;font-weight:800;letter-spacing:.08em;">用途模式</span>',
      '<button class="bnt-license-mode active" type="button" data-mode="personal">个人使用</button>',
      '<button class="bnt-license-mode" type="button" data-mode="study">学习教学</button>',
      '<button class="bnt-license-mode" type="button" data-mode="team">小圈子</button>',
      '<button class="bnt-license-mode" type="button" data-mode="commercial">商业用途</button>',
      '<button class="bnt-archive-action" type="button" data-action="print">打印 / PDF</button>',
      '<button class="bnt-archive-action" type="button" data-action="copy">复制链接</button>'
    ].join('');
    index.insertAdjacentElement('afterend', toolbar);
    const note = document.createElement('div');
    note.className = 'bnt-archive-note';
    note.textContent = '用途模式只用于高亮相关条款，不替代完整许可正文。';
    toolbar.insertAdjacentElement('afterend', note);

    const tableRows = Array.from(document.querySelectorAll('.lic-table tbody tr'));
    const highlightRows = mode => {
      const keywords = {
        personal: ['个人', '学习', '朋友', '分享'],
        study: ['学习', '教学', '教育', '个人'],
        team: ['个人', '熟人', '小圈子', '内部'],
        commercial: ['商业', '盈利', '售卖', '公开发布', '复制本站']
      }[mode] || [];
      tableRows.forEach(row => {
        const text = row.textContent;
        const active = keywords.some(keyword => text.includes(keyword));
        const denied = mode === 'commercial' && active && /不允许|禁止|不可/.test(text);
        row.classList.toggle('bnt-license-table-row-active', active && !denied);
        row.classList.toggle('bnt-license-table-row-deny', denied);
      });
    };
    toolbar.querySelectorAll('.bnt-license-mode').forEach(button => {
      button.addEventListener('click', () => {
        toolbar.querySelectorAll('.bnt-license-mode').forEach(item => item.classList.toggle('active', item === button));
        highlightRows(button.dataset.mode);
      });
    });
    toolbar.querySelector('[data-action="print"]').addEventListener('click', () => window.print());
    toolbar.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        if (window.showToast) window.showToast('许可链接已复制');
      } catch (error) {}
    });
    highlightRows('personal');

    const links = Array.from(index.querySelectorAll('a'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-18% 0px -65% 0px', threshold: 0.05 });
    cards.forEach(card => observer.observe(card));
  }

  function enhance404() {
    if (PAGE !== '404') return;
    const main = document.querySelector('main');
    const code = document.querySelector('.code');
    const actions = document.querySelector('.actions');
    if (!main || !code) return;
    const mascot = document.createElement('img');
    mascot.className = 'bnt-404-mascot';
    mascot.src = 'xiaobantan-v2.svg';
    mascot.alt = '迷航的小绊谈';
    code.insertAdjacentElement('beforebegin', mascot);
    if (actions) {
      const search = document.createElement('button');
      search.type = 'button';
      search.className = 'secondary';
      search.textContent = '搜索全网';
      search.addEventListener('click', () => window.BantanSearch?.open());
      actions.appendChild(search);
    }
  }

  function addSiteSlider() {
    if (PAGE !== 'landing' && PAGE !== 'index') return;
    if (document.querySelector('.bnt-site-slider-section')) return;
    const anchor = document.querySelector('#home') || document.querySelector('.hero') || document.querySelector('#main-container');
    if (!anchor) return;
    const section = document.createElement('section');
    section.className = 'bnt-site-slider-section';
    section.innerHTML = [
      '<div class="container">',
      '  <div class="bnt-site-slider-head">',
      '    <div><div class="bnt-site-slider-title">一站直达全网</div><div class="bnt-site-slider-desc">横向滑动或拖拽，快速进入常用网站搜索</div></div>',
      '    <div class="bnt-site-slider-controls"><button type="button" data-dir="-1" aria-label="向左">←</button><button type="button" data-dir="1" aria-label="向右">→</button></div>',
      '  </div>',
      '  <div class="bnt-site-slider-track"></div>',
      '</div>'
    ].join('');
    const track = section.querySelector('.bnt-site-slider-track');
    PROVIDERS.filter(provider => !provider.copyQuery).slice(0, 16).forEach(provider => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'bnt-site-slide';
      card.innerHTML = '<div><span class="bnt-site-slide-icon" style="--provider-color:' + provider.color + '">' + provider.icon + '</span><div class="bnt-site-slide-name">' + provider.name + '</div><div class="bnt-site-slide-desc">' + provider.desc + '</div></div>';
      card.addEventListener('click', () => {
        const cleanUrl = provider.url.split('?')[0].replace('{q}', '');
        window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      });
      track.appendChild(card);
    });
    section.querySelectorAll('[data-dir]').forEach(button => {
      button.addEventListener('click', () => {
        track.scrollBy({ left: Number(button.dataset.dir) * Math.max(260, track.clientWidth * 0.72), behavior: 'smooth' });
      });
    });
    let dragging = false;
    let dragMoved = false;
    let autoPaused = false;
    let startX = 0;
    let startScroll = 0;
    track.addEventListener('pointerdown', event => {
      dragging = true;
      dragMoved = false;
      autoPaused = true;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('dragging');
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove', event => {
      if (!dragging) return;
      if (Math.abs(event.clientX - startX) > 4) dragMoved = true;
      track.scrollLeft = startScroll - (event.clientX - startX);
    });
    track.addEventListener('pointerup', () => {
      dragging = false;
      track.classList.remove('dragging');
    });
    track.addEventListener('click', event => {
      if (dragMoved) {
        event.preventDefault();
        event.stopImmediatePropagation();
        dragMoved = false;
      }
    }, true);
    track.addEventListener('pointerenter', () => { autoPaused = true; });
    track.addEventListener('pointerleave', () => { autoPaused = false; });
    track.addEventListener('focusin', () => { autoPaused = true; });
    track.addEventListener('focusout', () => { autoPaused = false; });
    if (!REDUCED_MOTION) {
      let direction = 1;
      setInterval(() => {
        if (autoPaused || document.hidden || track.scrollWidth <= track.clientWidth + 8) return;
        const max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= max - 2) direction = -1;
        if (track.scrollLeft <= 2) direction = 1;
        track.scrollBy({ left: direction * 180, behavior: 'smooth' });
      }, 4200);
    }
    anchor.insertAdjacentElement('afterend', section);
  }

  function initialize() {
    document.documentElement.classList.add('bnt-v4-ready');
    document.body.classList.add('bnt-page-' + PAGE);
    addAmbient();
    ensureUnicornFallback();
    addProgress();
    addReveal();
    addTilt();
    addMagneticButtons();
    addClickSpark();
    addPageTransitions();
    addMobileDock();
    installSearch();
    addSiteSlider();
    enhanceChangelog();
    enhanceLicense();
    addTracingBeam();
    enhance404();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
