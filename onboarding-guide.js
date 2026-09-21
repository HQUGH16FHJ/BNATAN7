(() => {
  if (document.getElementById('onboardingRoot')) return;

  const isIndex = Boolean(document.getElementById('search_input') && !document.getElementById('heroSearch'));
  const storageKey = `bantan_onboarding_v1_${isIndex ? 'index' : 'landing'}`;
  const forceStart = new URLSearchParams(location.search).get('guide') === '1';

  const steps = isIndex ? [
    { kicker: 'BANTAN GUIDE', title: '欢迎回到万能枢纽', text: '用 30 秒了解搜索、AI、用户中心和常用入口。' },
    { target: '#search_input', kicker: 'STEP 01', title: '从这里开始搜索', text: '输入关键词即可搜索站内资源；按 F 可以快速聚焦搜索框。' },
    { target: '#search_engine', kicker: 'STEP 02', title: '切换搜索引擎', text: '百度、Bing、Google 和豆包可以在这里切换，搜索结果会跳到对应网站。' },
    { target: '#ai-fab', kicker: 'STEP 03', title: '需要帮助就找小绊谈', text: '点击右下角的 AI 助手，可以提问、推荐工具和排查常见问题。' },
    { target: '#nav-user-btn', kicker: 'STEP 04', title: '这里是你的用户中心', text: '登录后可以查看头像、VIP、余额、收藏和账号设置。' },
    { kicker: 'READY', title: '可以开始使用了', text: '之后想重新查看，点击左下角的“新手指导”即可。' }
  ] : [
    { kicker: 'BANTAN GUIDE', title: '欢迎来到绊谈', text: '用 30 秒了解搜索、工具分类、投资人和登录入口。' },
    { target: '#heroSearch', kicker: 'STEP 01', title: '先试试搜索', text: '输入关键词后按回车，可以直接搜索全网或查找工具。' },
    { target: '#tools', kicker: 'STEP 02', title: '浏览精选工具', text: '这里整理了高频工具和常用入口，点击卡片即可访问。' },
    { target: '#categories', kicker: 'STEP 03', title: '按分类寻找', text: 'AI、开发、教育、影音、电竞等分类都在这里。' },
    { target: '#investors', kicker: 'STEP 04', title: '查看投资人记录', text: '页面底部记录了项目投资人和投资金额。' },
    { target: '.nav-cta', kicker: 'STEP 05', title: '登录后解锁全部功能', text: '注册登录即可进入万能枢纽，使用完整工具集合。' },
    { kicker: 'READY', title: '介绍完成', text: '之后想重新查看，点击左下角的“新手指导”即可。' }
  ];

  const launch = document.createElement('button');
  launch.id = 'onboardingLauncher';
  launch.type = 'button';
  launch.setAttribute('aria-label', '打开新手指导');
  launch.innerHTML = '<span>?</span><span>新手指导</span>';

  const root = document.createElement('div');
  root.id = 'onboardingRoot';
  root.hidden = true;
  root.innerHTML = `
    <div class="onboarding-backdrop" data-onboarding-close></div>
    <div class="onboarding-highlight" aria-hidden="true"></div>
    <section class="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
      <div class="onboarding-kicker"></div>
      <h2 id="onboardingTitle"></h2>
      <p class="onboarding-copy"></p>
      <div class="onboarding-meta">
        <span class="onboarding-progress"></span>
        <span class="onboarding-dots" aria-hidden="true"></span>
      </div>
      <div class="onboarding-actions">
        <button type="button" class="onboarding-prev">上一步</button>
        <button type="button" class="onboarding-next is-primary">下一步</button>
        <button type="button" class="onboarding-skip" data-onboarding-close>跳过</button>
      </div>
    </section>
  `;

  document.body.append(launch, root);

  const card = root.querySelector('.onboarding-card');
  const highlight = root.querySelector('.onboarding-highlight');
  const kicker = root.querySelector('.onboarding-kicker');
  const title = root.querySelector('#onboardingTitle');
  const copy = root.querySelector('.onboarding-copy');
  const progress = root.querySelector('.onboarding-progress');
  const dots = root.querySelector('.onboarding-dots');
  const prev = root.querySelector('.onboarding-prev');
  const next = root.querySelector('.onboarding-next');

  let current = -1;
  let raf = 0;

  function isCompleted() {
    try {
      return localStorage.getItem(storageKey) === 'done';
    } catch (error) {
      return false;
    }
  }

  function markCompleted() {
    try {
      localStorage.setItem(storageKey, 'done');
    } catch (error) {
      // Privacy mode may block storage; the guide still works for this session.
    }
  }

  function targetElement(step) {
    return step.target ? document.querySelector(step.target) : null;
  }

  function position() {
    const step = steps[current];
    const target = targetElement(step);
    if (!target) {
      highlight.style.opacity = '0';
      card.style.left = '';
      card.style.top = '';
      card.style.right = '';
      card.style.bottom = '';
      return;
    }

    const rect = target.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width + 16, 48), window.innerWidth - 24);
    const height = Math.min(Math.max(rect.height + 16, 48), window.innerHeight - 24);
    highlight.style.opacity = '1';
    highlight.style.left = `${Math.max(8, rect.left - 8)}px`;
    highlight.style.top = `${Math.max(8, rect.top - 8)}px`;
    highlight.style.width = `${width}px`;
    highlight.style.height = `${height}px`;

    if (window.innerWidth <= 640) {
      card.style.left = '';
      card.style.top = '';
      card.style.right = '';
      card.style.bottom = '';
      return;
    }

    const cardWidth = 360;
    const cardHeight = Math.max(card.getBoundingClientRect().height, 210);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - cardWidth - 16);
    const preferredTop = rect.bottom + 14;
    const top = preferredTop + cardHeight < window.innerHeight - 16
      ? preferredTop
      : Math.max(16, rect.top - cardHeight - 14);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.right = '';
    card.style.bottom = '';
  }

  function schedulePosition() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(position);
  }

  function showStep(index) {
    current = index;
    const step = steps[current];
    const target = targetElement(step);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(schedulePosition, 360);
    } else {
      schedulePosition();
    }

    kicker.textContent = step.kicker;
    title.textContent = step.title;
    copy.textContent = step.text;
    progress.textContent = `${current + 1} / ${steps.length}`;
    dots.innerHTML = steps.map((_, i) => `<i class="${i === current ? 'is-active' : ''}"></i>`).join('');
    prev.disabled = current === 0;
    next.textContent = current === steps.length - 1 ? '完成' : '下一步';
    root.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close(mark = true) {
    if (mark) markCompleted();
    root.hidden = true;
    current = -1;
    document.body.style.overflow = '';
  }

  function start() {
    showStep(0);
  }

  launch.addEventListener('click', start);
  root.querySelectorAll('[data-onboarding-close]').forEach((element) => {
    element.addEventListener('click', () => close(true));
  });
  prev.addEventListener('click', () => {
    if (current > 0) showStep(current - 1);
  });
  next.addEventListener('click', () => {
    if (current < steps.length - 1) showStep(current + 1);
    else close(true);
  });
  document.addEventListener('keydown', (event) => {
    if (root.hidden) return;
    if (event.key === 'Escape') close(true);
    if (event.key === 'ArrowRight') next.click();
    if (event.key === 'ArrowLeft') prev.click();
  });
  window.addEventListener('resize', schedulePosition, { passive: true });
  window.addEventListener('scroll', schedulePosition, { passive: true });

  if (forceStart || !isCompleted()) {
    window.setTimeout(start, isIndex ? 2300 : 1500);
  }
})();
