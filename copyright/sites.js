(function () {
  'use strict';

  const search = document.getElementById('siteSearch');
  const filters = document.getElementById('siteFilters');
  const cards = Array.from(document.querySelectorAll('.directory-card'));
  const empty = document.getElementById('siteEmpty');
  let activeFilter = 'all';

  function apply() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const queryMatch = !query || card.dataset.search.toLowerCase().includes(query);
      const filterMatch = activeFilter === 'all' || card.dataset.status === activeFilter || card.dataset.owner === activeFilter;
      const show = queryMatch && filterMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    empty.hidden = visible !== 0;
  }

  search?.addEventListener('input', apply);
  filters?.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    activeFilter = button.dataset.filter;
    filters.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
    apply();
  });
})();
