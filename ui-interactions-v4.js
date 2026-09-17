(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let preview = null;
  let tooltip = null;

  function addPressFeedback() {
    document.querySelectorAll('button, a.button, .btn, .tool-card, .mini-card, .bento-cell, .version-card, .lic-card').forEach(element => {
      element.classList.add('ui-pressable');
    });
  }

  function addClickCore() {
    if (reduced) return;
    document.addEventListener('pointerdown', event => {
      if (!event.target.closest('button, a, .tool-card, .mini-card, .bento-cell, .version-card, .lic-card')) return;
      const core = document.createElement('span');
      core.className = 'ui-click-core';
      core.style.left = event.clientX + 'px';
      core.style.top = event.clientY + 'px';
      document.body.appendChild(core);
      setTimeout(() => core.remove(), 520);
    }, { passive: true });
  }

  function addFocusGrids() {
    document.querySelectorAll('.tool-grid, .mini-grid, .bento-grid').forEach(grid => {
      grid.classList.add('ui-focus-grid');
      grid.addEventListener('pointerover', event => {
        const card = event.target.closest('.tool-card, .mini-card, .bento-cell');
        if (!card || !grid.contains(card)) return;
        grid.classList.add('ui-has-focus');
        grid.querySelectorAll('.ui-card-focused').forEach(item => item.classList.remove('ui-card-focused'));
        card.classList.add('ui-card-focused');
      });
      grid.addEventListener('pointerleave', () => {
        grid.classList.remove('ui-has-focus');
        grid.querySelectorAll('.ui-card-focused').forEach(item => item.classList.remove('ui-card-focused'));
      });
    });
  }

  function getPreview() {
    if (preview) return preview;
    preview = document.createElement('div');
    preview.className = 'ui-link-preview';
    document.body.appendChild(preview);
    return preview;
  }

  function getTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.className = 'ui-pro-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function positionFloating(element, target) {
    const rect = target.getBoundingClientRect();
    const width = 280;
    let left = rect.left + rect.width / 2 - width / 2;
    let top = rect.bottom + 10;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    if (top + 150 > window.innerHeight) top = rect.top - 150 - 10;
    element.style.left = left + 'px';
    element.style.top = Math.max(12, top) + 'px';
  }

  function addLinkPreviews() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.tool-card[href], .preview-row[href]').forEach(card => {
      card.addEventListener('pointerenter', () => {
        const url = new URL(card.href, location.href);
        if (url.origin === location.origin) return;
        const name = card.querySelector('.name, .preview-name')?.textContent.trim() || card.textContent.trim().slice(0, 24);
        const desc = card.querySelector('.desc, .preview-desc')?.textContent.trim() || '打开外部工具网站';
        const box = getPreview();
        box.innerHTML = '<div class="ui-link-preview-domain">' + url.hostname.replace(/^www\./, '') + '</div><div class="ui-link-preview-title">' + name + '</div><div class="ui-link-preview-desc">' + desc + '</div>';
        positionFloating(box, card);
        box.classList.add('show');
      });
      card.addEventListener('pointerleave', () => preview?.classList.remove('show'));
      card.addEventListener('click', () => preview?.classList.remove('show'));
    });
  }

  function addProTooltips() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.tool-card:not([href]), .mini-card').forEach(card => {
      card.addEventListener('pointerenter', () => {
        const title = card.querySelector('.title, .name')?.textContent.trim() || card.textContent.trim().slice(0, 24);
        const desc = card.querySelector('.desc, .result')?.textContent.trim() || '点击使用该工具';
        const box = getTooltip();
        box.innerHTML = '<div class="ui-pro-tooltip-title">' + title + '</div><div class="ui-pro-tooltip-desc">' + desc.slice(0, 90) + '</div>';
        positionFloating(box, card);
        box.classList.add('show');
      });
      card.addEventListener('pointerleave', () => tooltip?.classList.remove('show'));
    });
  }

  function addStatefulFeedback() {
    document.addEventListener('click', event => {
      const button = event.target.closest('#avatar-studio-save, #logout-confirm-btn, .auth-submit-btn, .logout-btn.confirm, .bnt-search-submit');
      if (!button || button.classList.contains('ui-loading')) return;
      button.classList.add('ui-stateful');
      const label = document.createElement('span');
      label.className = 'ui-state-label';
      label.textContent = button.textContent.trim();
      label.dataset.original = label.textContent;
      button.textContent = '';
      button.appendChild(label);
      button.classList.add('ui-loading');
      setTimeout(() => {
        button.classList.remove('ui-loading');
        button.classList.add('ui-success');
        label.textContent = '已完成';
        setTimeout(() => {
          button.classList.remove('ui-success');
          label.textContent = label.dataset.original || label.textContent;
        }, 900);
      }, 650);
    }, true);
  }

  function addCopyFeedback() {
    document.addEventListener('click', event => {
      const button = event.target.closest('.copy-btn, [onclick*="copy"], .mini-contact');
      if (!button) return;
      const original = button.textContent;
      button.classList.add('ui-copy-copied');
      if (/复制/.test(original)) button.textContent = '已复制';
      setTimeout(() => {
        button.classList.remove('ui-copy-copied');
        button.textContent = original;
      }, 1200);
    });
  }

  function addProgressFeedback() {
    document.querySelectorAll('.stat-bar, .loader-bar, .loader-bar-fill, .rt-progress').forEach(element => {
      element.classList.add('ui-progress-shimmer');
    });
  }

  function addPointerHighlights() {
    document.querySelectorAll('.lic-section, .faq-question, .change-text, .info-row').forEach(element => {
      element.classList.add('ui-pointer-highlight');
    });
  }

  function addExpandableCards() {
    document.querySelectorAll('.change-item, .highlight-item, .lic-info-item').forEach(card => {
      card.classList.add('ui-expandable');
      card.addEventListener('click', () => {
        const expanded = card.classList.contains('ui-expanded');
        card.parentElement?.querySelectorAll('.ui-expanded').forEach(item => item.classList.remove('ui-expanded'));
        if (!expanded) card.classList.add('ui-expanded');
      });
    });
  }

  function initialize() {
    addPressFeedback();
    addClickCore();
    addFocusGrids();
    addLinkPreviews();
    addProTooltips();
    addStatefulFeedback();
    addCopyFeedback();
    addProgressFeedback();
    addPointerHighlights();
    addExpandableCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
