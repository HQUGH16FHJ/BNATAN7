(function () {
  'use strict';

  const sources = {
    idle: 'xiaobantan-v2.svg',
    thinking: 'xiaobantan-thinking.svg',
    happy: 'xiaobantan-happy.svg',
    alert: 'xiaobantan-alert.svg'
  };
  let resetTimer = null;

  function mascotImages() {
    return Array.from(new Set([
      document.getElementById('ai-fab')?.querySelector('img'),
      document.querySelector('.ai-avatar img'),
      document.querySelector('.boot-mascot'),
      document.querySelector('.brand-story-character img'),
      document.querySelector('.bnt-404-mascot')
    ].filter(Boolean)));
  }

  function setMascotState(state, resetAfter) {
    const source = sources[state] || sources.idle;
    mascotImages().forEach(image => {
      image.classList.add('mascot-state-image');
      image.dataset.mascotState = state;
      if (image.getAttribute('src') !== source) image.setAttribute('src', source);
    });
    clearTimeout(resetTimer);
    if (resetAfter) {
      resetTimer = setTimeout(() => setMascotState('idle'), resetAfter);
    }
  }

  function initialize() {
    setMascotState(navigator.onLine ? 'idle' : 'alert');
    window.addEventListener('offline', () => setMascotState('alert'));
    window.addEventListener('online', () => setMascotState('happy', 1800));

    document.addEventListener('click', event => {
      if (event.target.closest('#ai-fab, #ai-send-btn')) {
        setMascotState('thinking', 1800);
      } else if (event.target.closest('.ai-quick-btn, .ai-welcome-item')) {
        setMascotState('happy', 1200);
      }
    }, true);

    const messages = document.getElementById('ai-messages');
    if (messages && 'MutationObserver' in window) {
      const observer = new MutationObserver(() => {
        if (!document.getElementById('ai-send-btn')?.disabled) setMascotState('happy', 1100);
      });
      observer.observe(messages, { childList: true, subtree: true, characterData: true });
    }
  }

  window.BantanMascot = { setState: setMascotState };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
