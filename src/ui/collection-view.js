// Écran collection : filtres par rareté et grille des cartes possédées ou manquantes.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;
  const { cardFace, progressBar } = OPP.CardView;

  const FILTERS = [
    { id: 'all', label: 'Toutes', test: () => true },
    { id: 'L', label: 'Leader', test: (card) => card.rarity === 'L' },
    { id: 'SEC', label: 'SEC', test: (card) => card.rarity === 'SEC' },
    { id: 'SR', label: 'SR', test: (card) => card.rarity === 'SR' },
    { id: 'R', label: 'R', test: (card) => card.rarity === 'R' },
    { id: 'UC', label: 'UC', test: (card) => card.rarity === 'UC' },
    { id: 'C', label: 'C', test: (card) => card.rarity === 'C' },
    { id: 'variant', label: 'Parallèles', test: (card) => Boolean(card.variant) },
  ];
  // Conservé entre deux visites de l'écran pendant la session.
  const filterState = { filter: 'all', ownedOnly: false };

  function tile(card, count, ctx) {
    const tier = OPP.Cards.tierOf(card);
    if (!count) {
      return h('div', { class: `tile is-missing tier-${tier}`, 'aria-label': `${card.number} non obtenue` },
        h('span', { class: 'tile-number' }, card.number.slice(5)),
        h('span', { class: 'tile-rarity' }, card.variant ? `${card.rarity} ✦` : card.rarity),
      );
    }
    return h('button', {
      class: 'tile',
      type: 'button',
      'aria-label': `${card.name}, ${OPP.Cards.rarityLabel(card)}`,
      onclick: () => ctx.showCard(card),
    }, cardFace(card, { lazy: true, count }));
  }

  function render(ctx) {
    const { collection } = ctx.state;
    const progress = OPP.Collection.progress(ctx.collectible, collection);
    const grid = h('div', { class: 'collection-grid' });
    const chips = FILTERS.map((filter) => {
      const cards = ctx.collectible.filter(filter.test);
      const owned = cards.filter((card) => collection[card.id]).length;
      return h('button', {
        class: 'chip',
        type: 'button',
        'data-filter': filter.id,
        onclick: () => {
          filterState.filter = filter.id;
          refresh();
        },
      }, filter.label, h('span', { class: 'chip-count' }, `${owned}/${cards.length}`));
    });
    const ownedToggle = h('input', {
      type: 'checkbox',
      class: 'switch',
      checked: filterState.ownedOnly,
      onchange: (event) => {
        filterState.ownedOnly = event.target.checked;
        refresh();
      },
    });

    function refresh() {
      const filter = FILTERS.find((item) => item.id === filterState.filter);
      const cards = ctx.collectible
        .filter(filter.test)
        .filter((card) => !filterState.ownedOnly || collection[card.id]);
      grid.replaceChildren(...cards.map((card) => tile(card, collection[card.id] || 0, ctx)));
      if (!cards.length) grid.append(h('p', { class: 'empty' }, 'Aucune carte ici pour l\'instant.'));
      for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.filter === filterState.filter));
    }

    refresh();
    return h('section', { class: 'view view-collection' },
      h('header', { class: 'view-header' },
        h('div', {},
          h('h2', { class: 'view-title' }, 'Collection'),
          h('p', { class: 'view-subtitle' }, `${ctx.set.name} · ${ctx.set.id}`),
        ),
        h('strong', { class: 'big-number' }, `${progress.owned}`, h('small', {}, ` / ${progress.total}`)),
      ),
      progressBar(progress.ratio, 'Progression de la collection'),
      h('div', { class: 'chips' }, chips),
      h('label', { class: 'toggle' }, h('span', {}, 'Cartes obtenues uniquement'), ownedToggle),
      grid,
    );
  }

  OPP.CollectionView = { render };
})(globalThis);
