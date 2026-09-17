(function () {
  'use strict';

  const STORAGE_KEY = 'bantan_profile_settings_v1';
  const GRADIENTS = {
    sunset: ['#fbbf24', '#fb7185'],
    aurora: ['#38bdf8', '#34d399', '#fbbf24'],
    cosmos: ['#0ea5e9', '#1e293b', '#fb7185'],
    ember: ['#ef4444', '#f59e0b'],
    mono: ['#e2e8f0', '#94a3b8']
  };
  const BORDERS = {
    gold: '金色',
    coral: '珊瑚',
    cyan: '天蓝',
    none: '无边框'
  };
  const PENDANTS = {
    '✦': '星芒',
    '绊': '绊印',
    AI: 'AI',
    '🌌': '宇宙',
    '': '无挂件'
  };
  const DEFAULTS = {
    displayName: '',
    signature: '连接需求，点亮可能',
    avatarData: '',
    imageData: '',
    avatarMode: 'mark',
    gradient: 'sunset',
    border: 'gold',
    pendant: '✦',
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  };

  let studioState = null;
  let originalStudioState = null;

  function getUser() {
    let info = null;
    try {
      info = window._userState && window._userState.info
        ? window._userState.info
        : JSON.parse(localStorage.getItem('bantan_user_info') || 'null');
    } catch (e) {}
    return info || {};
  }

  function getUsername() {
    const user = getUser();
    return user.nickname || user.username || '绊谈用户';
  }

  function getUid() {
    const user = getUser();
    return String(user.uid || user.id || user.userId || 'BANTAN');
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return Object.assign({}, DEFAULTS, saved || {});
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      if (window.showToast) window.showToast('头像数据较大，保存失败');
      return false;
    }
  }

  function hashString(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function escapeXml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function buildMarkDataUrl(settings) {
    const seed = hashString(getUid() + getUsername());
    const colors = GRADIENTS[settings.gradient] || GRADIENTS.sunset;
    const initial = escapeXml(getUsername().slice(0, 1).toUpperCase());
    const angle = seed % 360;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const radius = i % 2 === 0 ? 57 : 34;
      const theta = (Math.PI * 2 * i) / 6 + (seed % 19) / 31;
      points.push([
        Math.round(96 + Math.cos(theta) * radius),
        Math.round(96 + Math.sin(theta) * radius)
      ]);
    }
    const polygon = points.map(point => point.join(',')).join(' ');
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">',
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(' + angle + ' .5 .5)">',
      colors.map((color, index) => '<stop offset="' + Math.round(index / Math.max(1, colors.length - 1) * 100) + '%" stop-color="' + color + '"/>').join(''),
      '</linearGradient></defs>',
      '<rect width="192" height="192" rx="48" fill="url(#g)"/>',
      '<polygon points="' + polygon + '" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="4"/>',
      '<circle cx="96" cy="96" r="38" fill="rgba(8,7,5,.72)" stroke="rgba(255,255,255,.42)" stroke-width="3"/>',
      '<text x="96" y="108" text-anchor="middle" font-family="Microsoft YaHei,PingFang SC,sans-serif" font-size="33" font-weight="900" fill="#fff7ed">' + initial + '</text>',
      '</svg>'
    ].join('');
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function resolveAvatar(settings) {
    if (settings.avatarData) return settings.avatarData;
    return buildMarkDataUrl(settings);
  }

  function applyAvatarToElement(element, settings, fallbackInitial) {
    if (!element) return;
    const config = Object.assign({}, DEFAULTS, settings || loadSettings());
    const avatarUrl = resolveAvatar(config);
    element.classList.add('bantan-avatar-applied');
    element.dataset.gradient = config.gradient;
    element.dataset.avatarBorder = config.border;
    element.dataset.pendant = config.pendant || '';
    element.style.backgroundImage = 'url("' + avatarUrl + '")';
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
    element.textContent = '';
    element.setAttribute('aria-label', (config.displayName || fallbackInitial || getUsername()) + '的头像');
  }

  function applyToPage() {
    const settings = loadSettings();
    const initial = getUsername().slice(0, 1).toUpperCase();
    [
      document.getElementById('nav-user-avatar'),
      document.getElementById('user-avatar'),
      document.getElementById('profile-avatar'),
      document.getElementById('logout-user-avatar')
    ].forEach(element => applyAvatarToElement(element, settings, initial));
    return settings;
  }

  function injectProfileLayout() {
    const card = document.querySelector('#profile-modal-overlay .profile-modal-card');
    if (!card || card.classList.contains('profile-v2')) return;
    card.classList.add('profile-v2');

    const cover = document.createElement('div');
    cover.className = 'profile-v2-cover';
    card.insertBefore(cover, card.firstChild);

    const header = card.querySelector('.profile-header');
    if (header) {
      const hero = document.createElement('div');
      hero.className = 'profile-v2-hero';
      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'profile-v2-avatar-wrap';
      avatarWrap.appendChild(header.querySelector('.profile-avatar'));
      const identity = document.createElement('div');
      identity.className = 'profile-v2-identity';
      identity.innerHTML = [
        '<div class="profile-v2-name-row">',
        '  <span class="profile-v2-name" id="profile-v2-name">用户</span>',
        '  <span class="profile-v2-badge" id="profile-v2-badge">普通用户</span>',
        '</div>',
        '<div class="profile-v2-signature" id="profile-v2-signature">连接需求，点亮可能</div>',
        '<div class="profile-uid" id="profile-uid">UID: --</div>'
      ].join('');
      hero.appendChild(avatarWrap);
      hero.appendChild(identity);
      header.replaceWith(hero);
    }

    const stats = card.querySelector('.profile-stats');
    if (stats) {
      const actions = document.createElement('div');
      actions.className = 'profile-v2-actions';
      actions.innerHTML = [
        '<button type="button" class="profile-v2-action" id="profile-open-avatar"><span class="icon">✦</span>头像工坊</button>',
        '<button type="button" class="profile-v2-action" onclick="openInviteModal();closeProfileModal()"><span class="icon">🎉</span>邀请有礼</button>',
        '<button type="button" class="profile-v2-action" onclick="openRedeemModal();closeProfileModal()"><span class="icon">🎁</span>兑换额度</button>',
        '<button type="button" class="profile-v2-action" onclick="openFeedback();closeProfileModal()"><span class="icon">💬</span>意见反馈</button>',
        '<button type="button" class="profile-v2-action" onclick="exportData();closeProfileModal()"><span class="icon">💾</span>导出数据</button>',
        '<button type="button" class="profile-v2-action" onclick="openLogoutConfirm();closeProfileModal()"><span class="icon">↪</span>退出登录</button>'
      ].join('');
      stats.insertAdjacentElement('afterend', actions);
    }

    const infoList = card.querySelector('.profile-info-list');
    if (infoList) {
      const localCard = document.createElement('div');
      localCard.className = 'profile-v2-local-card';
      localCard.innerHTML = [
        '<div class="profile-v2-local-line">显示名称：<strong id="profile-local-name">--</strong></div>',
        '<div class="profile-v2-local-line">个性签名：<strong id="profile-local-signature">--</strong></div>',
        '<div class="profile-v2-local-line" style="margin-top:5px;color:#8a7e72;">头像配置仅保存在当前浏览器，不会修改账号密码或 VIP 数据。</div>'
      ].join('');
      infoList.insertAdjacentElement('afterend', localCard);
    }

    card.querySelector('#profile-open-avatar').addEventListener('click', openAvatarStudio);
  }

  function populateProfile() {
    injectProfileLayout();
    const info = getUser();
    const settings = loadSettings();
    const name = settings.displayName || info.nickname || info.username || '用户';
    const signature = settings.signature || DEFAULTS.signature;
    const vipNames = ['普通用户', '青铜 VIP', '白银 VIP', '黄金 VIP', '钻石 VIP', '至尊 VIP'];
    const isVip = info.isVip && (!info.vipExpire || info.vipExpire > Date.now());
    const levelName = info.isOwner ? '站长' : (isVip ? (vipNames[info.vipLevel] || 'VIP 用户') : '普通用户');

    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    setText('profile-v2-name', name);
    setText('profile-v2-badge', levelName);
    setText('profile-v2-signature', signature);
    setText('profile-local-name', name);
    setText('profile-local-signature', signature);
    setText('profile-name', name);
    setText('profile-uid', 'UID: ' + getUid());
    applyToPage();
  }

  function openProfile() {
    populateProfile();
    const overlay = document.getElementById('profile-modal-overlay');
    if (overlay) overlay.classList.add('show');
  }

  function injectStudio() {
    if (document.getElementById('avatar-studio-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'avatar-studio-overlay';
    overlay.className = 'ai-settings-overlay modal-overlay-fixed avatar-studio-overlay';
    overlay.innerHTML = [
      '<div class="ai-settings-card avatar-studio-card" role="dialog" aria-modal="true" aria-labelledby="avatar-studio-title">',
      '  <button class="auth-close-btn" type="button" id="avatar-studio-close" aria-label="关闭">✕</button>',
      '  <div class="avatar-studio-head">',
      '    <div><div class="avatar-studio-title" id="avatar-studio-title">头像工坊</div><div class="avatar-studio-subtitle">创作属于你的绊谈身份形象</div></div>',
      '  </div>',
      '  <div class="avatar-studio-grid">',
      '    <div class="avatar-studio-preview-card">',
      '      <div class="avatar-studio-avatar-shell"><div class="avatar-studio-avatar" id="studio-avatar-preview"></div></div>',
      '      <div class="avatar-studio-name" id="studio-preview-name">绊谈用户</div>',
      '      <div class="avatar-studio-signature" id="studio-preview-signature">连接需求，点亮可能</div>',
      '      <div class="avatar-studio-hint">上传图片只会在本地裁剪和保存，不会上传服务器。</div>',
      '    </div>',
      '    <div class="avatar-studio-controls">',
      '      <div class="avatar-control-section">',
      '        <div class="avatar-control-label">头像来源</div>',
      '        <div class="avatar-source-actions">',
      '          <label class="avatar-source-btn">上传图片<input id="avatar-file-input" type="file" accept="image/png,image/jpeg,image/webp"></label>',
      '          <button type="button" class="avatar-source-btn primary" id="avatar-generate-mark">生成绊印头像</button>',
      '        </div>',
      '      </div>',
      '      <div class="avatar-control-section">',
      '        <div class="avatar-control-label">裁剪与缩放</div>',
      '        <div class="avatar-range-row"><span>缩放</span><input id="avatar-zoom" type="range" min="1" max="2.4" step="0.05" value="1"><span id="avatar-zoom-value">1.0×</span></div>',
      '        <div class="avatar-range-row"><span>左右</span><input id="avatar-offset-x" type="range" min="-50" max="50" step="1" value="0"><span id="avatar-offset-x-value">0</span></div>',
      '        <div class="avatar-range-row"><span>上下</span><input id="avatar-offset-y" type="range" min="-50" max="50" step="1" value="0"><span id="avatar-offset-y-value">0</span></div>',
      '      </div>',
      '      <div class="avatar-control-section">',
      '        <div class="avatar-control-label">渐变背景</div>',
      '        <div class="avatar-swatch-list" id="avatar-gradient-list"></div>',
      '      </div>',
      '      <div class="avatar-control-section">',
      '        <div class="avatar-control-label">头像边框</div>',
      '        <div class="avatar-option-list" id="avatar-border-list"></div>',
      '      </div>',
      '      <div class="avatar-control-section">',
      '        <div class="avatar-control-label">身份挂件</div>',
      '        <div class="avatar-option-list" id="avatar-pendant-list"></div>',
      '      </div>',
      '      <div class="avatar-control-section">',
      '        <div class="avatar-control-label">显示名称</div>',
      '        <input class="avatar-text-input" id="avatar-display-name" maxlength="20" placeholder="使用账号昵称">',
      '        <div class="avatar-control-label" style="margin-top:12px;">个性签名</div>',
      '        <input class="avatar-text-input" id="avatar-signature" maxlength="40" placeholder="写一句属于你的话">',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="avatar-studio-actions">',
      '    <button type="button" class="cancel" id="avatar-studio-cancel">取消</button>',
      '    <button type="button" class="save" id="avatar-studio-save">保存头像</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeAvatarStudio();
    });
    document.getElementById('avatar-studio-close').addEventListener('click', closeAvatarStudio);
    document.getElementById('avatar-studio-cancel').addEventListener('click', closeAvatarStudio);
    document.getElementById('avatar-studio-save').addEventListener('click', saveAvatarStudio);
    document.getElementById('avatar-file-input').addEventListener('change', handleAvatarFile);
    document.getElementById('avatar-generate-mark').addEventListener('click', generateAvatarMark);
    document.getElementById('avatar-zoom').addEventListener('input', updateStudioFromControls);
    document.getElementById('avatar-offset-x').addEventListener('input', updateStudioFromControls);
    document.getElementById('avatar-offset-y').addEventListener('input', updateStudioFromControls);
    document.getElementById('avatar-display-name').addEventListener('input', updateStudioFromControls);
    document.getElementById('avatar-signature').addEventListener('input', updateStudioFromControls);
    buildOptionButtons();
  }

  function buildOptionButtons() {
    const gradientList = document.getElementById('avatar-gradient-list');
    Object.entries(GRADIENTS).forEach(([key, colors]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-swatch';
      button.dataset.gradient = key;
      button.title = key;
      button.style.background = 'linear-gradient(135deg,' + colors.join(',') + ')';
      button.addEventListener('click', () => {
        studioState.gradient = key;
        updateStudioUI();
      });
      gradientList.appendChild(button);
    });

    const borderList = document.getElementById('avatar-border-list');
    Object.entries(BORDERS).forEach(([key, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-option';
      button.dataset.border = key;
      button.textContent = label;
      button.addEventListener('click', () => {
        studioState.border = key;
        updateStudioUI();
      });
      borderList.appendChild(button);
    });

    const pendantList = document.getElementById('avatar-pendant-list');
    Object.entries(PENDANTS).forEach(([key, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'avatar-option';
      button.dataset.pendant = key;
      button.textContent = key ? key + ' ' + label : label;
      button.addEventListener('click', () => {
        studioState.pendant = key;
        updateStudioUI();
      });
      pendantList.appendChild(button);
    });
  }

  function openAvatarStudio() {
    injectStudio();
    originalStudioState = loadSettings();
    studioState = Object.assign({}, DEFAULTS, originalStudioState);
    const overlay = document.getElementById('avatar-studio-overlay');
    document.getElementById('avatar-zoom').value = studioState.zoom;
    document.getElementById('avatar-offset-x').value = studioState.offsetX;
    document.getElementById('avatar-offset-y').value = studioState.offsetY;
    document.getElementById('avatar-display-name').value = studioState.displayName || '';
    document.getElementById('avatar-signature').value = studioState.signature || '';
    updateStudioUI();
    overlay.classList.add('show');
  }

  function closeAvatarStudio() {
    const overlay = document.getElementById('avatar-studio-overlay');
    if (overlay) overlay.classList.remove('show');
    if (originalStudioState) studioState = Object.assign({}, originalStudioState);
  }

  function updateStudioFromControls() {
    if (!studioState) return;
    studioState.zoom = parseFloat(document.getElementById('avatar-zoom').value) || 1;
    studioState.offsetX = parseInt(document.getElementById('avatar-offset-x').value, 10) || 0;
    studioState.offsetY = parseInt(document.getElementById('avatar-offset-y').value, 10) || 0;
    studioState.displayName = document.getElementById('avatar-display-name').value.trim();
    studioState.signature = document.getElementById('avatar-signature').value.trim();
    updateStudioUI();
  }

  function updateStudioUI() {
    if (!studioState) return;
    const preview = document.getElementById('studio-avatar-preview');
    const avatarUrl = resolveAvatar(studioState);
    preview.classList.add('bantan-avatar-applied');
    preview.dataset.gradient = studioState.gradient;
    preview.dataset.avatarBorder = studioState.border;
    preview.dataset.pendant = studioState.pendant || '';
    preview.style.backgroundImage = 'url("' + avatarUrl + '")';
    preview.style.backgroundSize = (studioState.avatarMode === 'upload' ? studioState.zoom * 100 : 100) + '%';
    preview.style.backgroundPosition =
      'calc(50% + ' + studioState.offsetX / 2 + '%) calc(50% + ' + studioState.offsetY / 2 + '%)';
    preview.textContent = '';

    document.getElementById('avatar-zoom-value').textContent = studioState.zoom.toFixed(1) + '×';
    document.getElementById('avatar-offset-x-value').textContent = studioState.offsetX;
    document.getElementById('avatar-offset-y-value').textContent = studioState.offsetY;
    document.getElementById('studio-preview-name').textContent = studioState.displayName || getUsername();
    document.getElementById('studio-preview-signature').textContent = studioState.signature || DEFAULTS.signature;

    document.querySelectorAll('#avatar-gradient-list .avatar-swatch').forEach(button => {
      button.classList.toggle('active', button.dataset.gradient === studioState.gradient);
    });
    document.querySelectorAll('#avatar-border-list .avatar-option').forEach(button => {
      button.classList.toggle('active', button.dataset.border === studioState.border);
    });
    document.querySelectorAll('#avatar-pendant-list .avatar-option').forEach(button => {
      button.classList.toggle('active', button.dataset.pendant === (studioState.pendant || ''));
    });
  }

  function generateAvatarMark() {
    studioState.avatarMode = 'mark';
    studioState.imageData = '';
    studioState.avatarData = '';
    updateStudioUI();
  }

  function handleAvatarFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      if (window.showToast) window.showToast('请选择 PNG、JPG 或 WebP 图片');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      if (window.showToast) window.showToast('图片不能超过 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      studioState.avatarMode = 'upload';
      studioState.imageData = String(reader.result || '');
      studioState.avatarData = '';
      studioState.zoom = 1;
      studioState.offsetX = 0;
      studioState.offsetY = 0;
      document.getElementById('avatar-zoom').value = 1;
      document.getElementById('avatar-offset-x').value = 0;
      document.getElementById('avatar-offset-y').value = 0;
      updateStudioUI();
    };
    reader.readAsDataURL(file);
  }

  function renderUploadedAvatar(settings) {
    return new Promise((resolve, reject) => {
      if (!settings.imageData) {
        resolve('');
        return;
      }
      const image = new Image();
      image.onload = function () {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
        const scale = baseScale * settings.zoom;
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        const extraX = Math.max(0, drawWidth - size);
        const extraY = Math.max(0, drawHeight - size);
        const x = (size - drawWidth) / 2 + (settings.offsetX / 100) * extraX / 2;
        const y = (size - drawHeight) / 2 + (settings.offsetY / 100) * extraY / 2;
        context.fillStyle = '#0a0805';
        context.fillRect(0, 0, size, size);
        context.drawImage(image, x, y, drawWidth, drawHeight);
        resolve(canvas.toDataURL('image/webp', 0.86));
      };
      image.onerror = function () {
        reject(new Error('图片读取失败'));
      };
      image.src = settings.imageData;
    });
  }

  async function saveAvatarStudio() {
    if (!studioState) return;
    try {
      if (studioState.avatarMode === 'upload' && studioState.imageData) {
        studioState.avatarData = await renderUploadedAvatar(studioState);
      } else {
        studioState.avatarData = '';
      }
      const settings = Object.assign({}, studioState, { imageData: '' });
      if (!saveSettings(settings)) return;
      closeAvatarStudio();
      populateProfile();
      if (window.showToast) window.showToast('头像与个人资料已保存');
    } catch (error) {
      if (window.showToast) window.showToast(error.message || '头像保存失败');
    }
  }

  function init() {
    injectProfileLayout();
    injectStudio();
    applyToPage();
    if (typeof window.openUserProfile === 'function') {
      window.openUserProfile = openProfile;
    }
    if (typeof window.updateUserUI === 'function') window.updateUserUI();
  }

  window.BantanProfile = {
    open: openProfile,
    openAvatarStudio: openAvatarStudio,
    applyToPage: applyToPage,
    applyAvatarToElement: applyAvatarToElement,
    getSettings: loadSettings,
    saveSettings: saveSettings
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
