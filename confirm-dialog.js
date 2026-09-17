(function () {
  'use strict';

  let overlay = null;
  let currentResolve = null;

  function ensureDialog() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'bantan-confirm-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = [
      '<div class="bantan-confirm-card" role="dialog" aria-modal="true" aria-labelledby="bantan-confirm-title">',
      '  <div class="bantan-confirm-icon" aria-hidden="true">?</div>',
      '  <h3 class="bantan-confirm-title" id="bantan-confirm-title">请确认</h3>',
      '  <p class="bantan-confirm-message"></p>',
      '  <div class="bantan-confirm-detail" hidden></div>',
      '  <div class="bantan-confirm-actions">',
      '    <button type="button" class="bantan-confirm-btn cancel">取消</button>',
      '    <button type="button" class="bantan-confirm-btn confirm">确认</button>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    overlay.querySelector('.cancel').addEventListener('click', function () {
      close(false);
    });
    overlay.querySelector('.confirm').addEventListener('click', function () {
      close(true);
    });
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) close(false);
    });
    document.addEventListener('keydown', function (event) {
      if (!overlay.classList.contains('show')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      }
    });
    return overlay;
  }

  function close(result) {
    if (!overlay || !overlay.classList.contains('show')) return;
    overlay.classList.remove('show');
    const resolve = currentResolve;
    currentResolve = null;
    if (resolve) resolve(result);
  }

  function confirm(options) {
    const opts = Object.assign({
      title: '请确认',
      message: '',
      detail: '',
      confirmText: '确认',
      cancelText: '取消',
      tone: 'warning',
      icon: '?'
    }, options || {});

    const dialog = ensureDialog();
    const card = dialog.querySelector('.bantan-confirm-card');
    card.dataset.tone = opts.tone;
    dialog.querySelector('.bantan-confirm-icon').textContent = opts.icon;
    dialog.querySelector('.bantan-confirm-title').textContent = opts.title;
    dialog.querySelector('.bantan-confirm-message').textContent = opts.message;

    const detail = dialog.querySelector('.bantan-confirm-detail');
    detail.textContent = opts.detail || '';
    detail.hidden = !opts.detail;

    dialog.querySelector('.cancel').textContent = opts.cancelText;
    dialog.querySelector('.confirm').textContent = opts.confirmText;
    dialog.classList.add('show');

    return new Promise(function (resolve) {
      currentResolve = resolve;
      setTimeout(function () {
        dialog.querySelector('.cancel').focus();
      }, 120);
    });
  }

  function alert(options) {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    return confirm({
      title: opts.title || '提示',
      message: opts.message || '',
      detail: opts.detail || '',
      confirmText: opts.confirmText || '知道了',
      cancelText: opts.cancelText || '关闭',
      tone: opts.tone || 'info',
      icon: opts.icon || 'i'
    });
  }

  window.BantanDialog = { confirm: confirm, alert: alert, close: close };
})();
