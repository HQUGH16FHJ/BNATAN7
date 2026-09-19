(function () {
  'use strict';

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }

  function initialize() {
    document.querySelectorAll('[data-copy-domain]').forEach(button => {
      button.addEventListener('click', async () => {
        const originalLabel = button.textContent;
        try {
          await copyText(button.dataset.copyDomain || '');
          button.textContent = '已复制';
          button.classList.add('is-copied');
          window.setTimeout(() => {
            button.textContent = originalLabel;
            button.classList.remove('is-copied');
          }, 1600);
        } catch (error) {
          button.textContent = '复制失败';
          window.setTimeout(() => {
            button.textContent = originalLabel;
          }, 1600);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
