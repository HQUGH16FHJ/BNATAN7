(() => {
  const setText = (name, value) => {
    document.querySelectorAll(`[data-profile="${name}"]`).forEach((element) => {
      element.textContent = value || '';
    });
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function renderList(name, items, render) {
    document.querySelectorAll(`[data-list="${name}"]`).forEach((container) => {
      container.innerHTML = (items || []).map(render).join('');
    });
  }

  function init(profile) {
    setText('name', profile.name);
    setText('owner', profile.owner);
    setText('role', profile.role);
    setText('tagline', profile.tagline);
    setText('status', profile.status);

    renderList('now', profile.now, (item, index) => `
      <article>
        <b>${String(index + 1).padStart(2, '0')}</b>
        <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.desc)}</p></div>
      </article>
    `);

    renderList('stack', profile.stack, (item) => `<span>${escapeHtml(item)}</span>`);

    renderList('devices', profile.devices, (item) => `
      <article class="profile-card"><small>TOOLKIT</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc)}</p></article>
    `);

    renderList('links', profile.links, (item) => {
      const href = item.href ? `href="${escapeHtml(item.href)}"` : '';
      const copy = item.copy ? `<button type="button" data-profile-copy="${escapeHtml(item.value)}">复制</button>` : '';
      return `<article class="profile-card"><small>${escapeHtml(item.label)}</small><h3>${escapeHtml(item.value)}</h3>${copy || `<a ${href}>打开链接</a>`}</article>`;
    });

    renderList('services', profile.services, (item, index) => `
      <article class="profile-card"><small>SERVICE ${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc)}</p></article>
    `);

    renderList('portfolio', profile.portfolio, (item) => `
      <article class="profile-card"><small>${escapeHtml(item.type)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc)}</p><a href="${escapeHtml(item.href)}" target="_blank" rel="noopener">查看项目</a></article>
    `);

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-profile-copy]');
      if (!button) return;
      const value = button.dataset.profileCopy;
      const write = navigator.clipboard?.writeText?.(value) || Promise.resolve();
      write.then(() => {
        const original = button.textContent;
        button.textContent = '已复制';
        setTimeout(() => { button.textContent = original; }, 1400);
      });
    });

    const time = document.getElementById('profileLocalTime');
    if (time) {
      const update = () => {
        time.textContent = new Intl.DateTimeFormat('zh-CN', {
          timeZone: profile.timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(new Date());
      };
      update();
      setInterval(update, 1000);
    }
  }

  fetch('./profile.json?v=1.0.1', { headers: { accept: 'application/json' }, cache: 'no-cache' })
    .then((response) => response.json())
    .then(init)
    .catch(() => {});
})();
