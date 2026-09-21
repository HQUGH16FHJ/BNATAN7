(() => {
  const grid = document.getElementById('investorGrid');
  if (!grid) return;

  async function loadInvestors() {
    const endpoint = window.BANTAN_INVESTORS_ENDPOINT;
    if (endpoint) {
      try {
        const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
        if (response.ok) {
          const payload = await response.json();
          const remoteList = Array.isArray(payload) ? payload : payload.investors;
          if (Array.isArray(remoteList)) return remoteList;
        }
      } catch (error) {
        // Fall back to the local data source when the optional endpoint is unavailable.
      }
    }
    return window.BANTAN_INVESTORS;
  }

  function render(list) {
    if (!Array.isArray(list) || !list.length) return;

    const numericAmounts = list.filter((item) => Number.isFinite(item.amount));
    const totalAmount = numericAmounts.reduce((sum, item) => sum + item.amount, 0);

    const total = document.getElementById('investorTotal');
    const count = document.getElementById('investorCount');

    if (total) total.textContent = `${totalAmount} 元`;
    if (count) count.textContent = `${list.length} 位`;

    grid.innerHTML = list.map((item, index) => {
      const initial = item.name.slice(0, 1);
      const amountClass = item.amount === null ? ' is-intention' : '';
      return [
        '<article class="investor-card" data-investor="' + item.name + '">',
        `<span class="investor-rank">${String(index + 1).padStart(2, '0')}</span>`,
        `<span class="investor-avatar" aria-hidden="true">${initial}</span>`,
        `<strong class="investor-name">${item.name}</strong>`,
        `<span class="investor-amount${amountClass}">${item.amountLabel}</span>`,
        '</article>'
      ].join('');
    }).join('');
  }

  loadInvestors().then(render).catch(() => render(window.BANTAN_INVESTORS));
})();
