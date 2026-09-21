(function () {
  'use strict';

  var root = document.documentElement;
  var coarseQuery = window.matchMedia('(pointer: coarse)');
  var noHoverQuery = window.matchMedia('(hover: none)');
  var userAgent = navigator.userAgent || '';
  var platform = navigator.platform || '';
  var maxTouchPoints = navigator.maxTouchPoints || 0;
  var iPadOS = platform === 'MacIntel' && maxTouchPoints > 1;
  var iOS = /iPhone|iPad|iPod/i.test(userAgent) || iPadOS;
  var mac = /Macintosh|Mac OS X/i.test(userAgent) && !iOS;
  var touch = maxTouchPoints > 0 || coarseQuery.matches || noHoverQuery.matches;

  root.classList.toggle('device-touch', touch);
  root.classList.toggle('device-ios', iOS);
  root.classList.toggle('device-mac', mac);
  root.classList.add('device-compat-ready');

  function updateViewport() {
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight;
    var width = viewport ? viewport.width : window.innerWidth;
    var largeTouch = touch && Math.max(width, height) >= 900;
    root.classList.toggle('device-whiteboard', largeTouch);
    root.style.setProperty('--bnt-viewport-height', Math.round(height) + 'px');
    root.style.setProperty('--bnt-viewport-width', Math.round(width) + 'px');
  }

  updateViewport();
  window.addEventListener('resize', updateViewport, { passive: true });
  window.addEventListener('orientationchange', updateViewport, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', updateViewport, { passive: true });
  }

  function makeTablesScrollable() {
    document.querySelectorAll('table').forEach(function (table) {
      if (table.closest('.bnt-table-scroll')) return;

      var parent = table.parentElement;
      var parentCanScroll = parent && (
        parent.classList.contains('table-wrap') ||
        parent.classList.contains('bnt-table-scroll') ||
        /table-(wrap|scroll)/.test(parent.className || '')
      );
      if (parentCanScroll) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'bnt-table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeTablesScrollable, { once: true });
  } else {
    makeTablesScrollable();
  }
})();
