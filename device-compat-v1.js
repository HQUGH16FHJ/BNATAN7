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

  var pagePath = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  var pageFile = pagePath.split('/').pop() || '';
  var isRightsSurface = location.hostname === 'rights.bantan.online' || pagePath.indexOf('/copyright/') === 0;
  var isRightsAdmin = /\/copyright\/admin(?:\.html)?$/.test(pagePath);
  var isRootIndex = pagePath === '/' || pagePath === '/index' || pagePath === '/index.html';
  var excludedFromArchive = isRootIndex ||
    pageFile === 'landing' ||
    pageFile === 'landing.html' ||
    pageFile === 'admin' ||
    pageFile === 'admin.html' ||
    pageFile === 'create-vip' ||
    pageFile === 'create-vip.html' ||
    pageFile === 'og-image.html' ||
    isRightsAdmin;

  if (!excludedFromArchive) {
    root.classList.add('archive-page');
  }
  if (isRightsSurface && !isRightsAdmin) {
    root.classList.add('archive-page', 'archive-center');
  }

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

  function installScrollRecovery() {
    if (window.__bntScrollRecoveryInstalled) return;
    window.__bntScrollRecoveryInstalled = true;

    var blockers = [
      '.bnt-search-overlay.show',
      '.ai-settings-overlay.show',
      '.modal-overlay.active',
      '.legal-overlay.active',
      '#onboardingRoot:not([hidden])',
      '.article-reader.is-open',
      '.photo-lightbox.is-open',
      '.contact-modal:not([hidden])'
    ];

    function isVisible(element) {
      if (!element) return false;
      var rect = element.getBoundingClientRect();
      var style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 &&
        style.display !== 'none' && style.visibility !== 'hidden' &&
        style.pointerEvents !== 'none';
    }

    function hasVisibleBlocker() {
      return blockers.some(function (selector) {
        return Array.prototype.some.call(document.querySelectorAll(selector), isVisible);
      });
    }

    function isPageLocked() {
      return getComputedStyle(document.documentElement).overflowY === 'hidden' ||
        getComputedStyle(document.body).overflowY === 'hidden';
    }

    function isScrollableTarget(node) {
      for (var element = node; element && element !== document.body; element = element.parentElement) {
        var style = getComputedStyle(element);
        if (/(auto|scroll|overlay)/.test(style.overflowY) &&
            element.scrollHeight > element.clientHeight + 1) {
          return true;
        }
      }
      return false;
    }

    function syncScrollRecovery() {
      if (hasVisibleBlocker()) {
        root.classList.remove('bnt-scroll-recovered');
        return;
      }
      if (isPageLocked()) {
        root.classList.add('bnt-scroll-recovered');
      } else {
        root.classList.remove('bnt-scroll-recovered');
      }
    }

    document.addEventListener('wheel', function (event) {
      syncScrollRecovery();
      if (hasVisibleBlocker() || !isPageLocked() || isScrollableTarget(event.target)) return;
      event.preventDefault();
      root.classList.add('bnt-scroll-recovered');
      window.scrollBy(0, event.deltaY);
    }, { capture: true, passive: false });

    function scheduleSync() {
      syncScrollRecovery();
      setTimeout(syncScrollRecovery, 300);
      setTimeout(syncScrollRecovery, 1200);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleSync, { once: true });
    } else {
      scheduleSync();
    }
    window.addEventListener('pageshow', scheduleSync);
    window.addEventListener('focus', scheduleSync);
    document.addEventListener('visibilitychange', scheduleSync);
    document.addEventListener('pointerdown', scheduleSync, { passive: true });
    document.addEventListener('keydown', scheduleSync);
  }

  installScrollRecovery();
})();
