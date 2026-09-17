(function () {
  'use strict';

  function waitForSearch() {
    const input = document.querySelector('.bnt-search-input');
    const submit = document.querySelector('.bnt-search-submit');
    const modes = document.querySelector('.bnt-search-modes');
    if (!input || !submit || !modes) {
      setTimeout(waitForSearch, 120);
      return;
    }
    integrate(input, submit, modes);
  }

  function integrate(input, submit, modes) {
    if (input.dataset.uiverseReady) return;
    input.dataset.uiverseReady = '1';
    input.classList.add('uiverse-wave-input');

    submit.classList.add('uiverse-search-submit');
    submit.innerHTML = '<span>开始搜索</span><span class="uiverse-arrow" aria-hidden="true">→</span>';

    const row = document.createElement('div');
    row.className = 'uiverse-multi-row';
    row.innerHTML = [
      '<span class="uiverse-multi-label">多站同搜</span>',
      '<label class="uiverse-switch" title="开启后最多可同时选择 3 个网站">',
      '  <input type="checkbox" checked>',
      '  <span class="uiverse-switch-track">',
      '    <span class="uiverse-switch-thumb"></span>',
      '    <span class="uiverse-switch-dot"></span>',
      '  </span>',
      '</label>'
    ].join('');
    modes.insertAdjacentElement('afterend', row);

    row.querySelector('input').addEventListener('change', event => {
      window.BantanSearch?.setMulti?.(event.target.checked);
    });

    submit.addEventListener('click', () => {
      const status = document.getElementById('bnt-search-status');
      if (!status) return;
      const original = status.textContent;
      status.innerHTML = '<span class="uiverse-loader-inline"><span class="uiverse-block-loader"><span></span><span></span><span></span><span></span></span>正在打开搜索结果...</span>';
      setTimeout(() => { status.textContent = original; }, 650);
    }, true);
  }

  waitForSearch();
})();
