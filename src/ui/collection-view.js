// Écran collection : choix de l'extension, filtres par rareté et grille des cartes.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;
  const { cardFace, progressBar } = OPP.CardView;

  const FILTERS = [
    { id: 'all', label: 'Toutes', test: () => true },
    { id: 'L', label: 'Leader', test: (card) => card.rarity === 'L' && !card.variant },
    { id: 'SEC', label: 'SEC', test: (card) => card.rarity === 'SEC' && !card.variant },
    { id: 'SR', label: 'SR', test: (card) => card.rarity === 'SR' && !card.variant },
    { id: 'R', label: 'R', test: (card) => card.rarity === 'R' && !card.variant },
    { id: 'UC', label: 'UC', test: (card) => card.rarity === 'UC' && !card.variant },
    { id: 'C', label: 'C', test: (card) => card.rarity === 'C' && !card.variant },
    { id: 'variant', label: 'Spéciales', test: (card) => Boolean(card.variant) },
  ];
  // Conservé entre deux visites de l'écran pendant la session.
  const filterState = { filter: 'all', ownedOnly: false };

  function tile(card, count, ctx) {
    const tier = OPP.Cards.tierOf(card);
    if (!count) {
      const number = OPP.Cards.numberOf(card);
      return h('div', { class: `tile is-missing tier-${tier}`, 'aria-label': `${number} non obtenue` },
        h('span', { class: 'tile-number' }, number.slice(number.lastIndexOf('-') + 1)),
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
    const setId = ctx.state.collectionSet;
    const set = OPP.sets[setId];
    const cards = ctx.collectibleOf(setId);
    const progress = OPP.Collection.progress(cards, collection);
    const grid = h('div', { class: 'collection-grid' });

    const setChips = OPP.setOrder.map((id) => h('button', {
      class: 'chip set-chip',
      type: 'button',
      'aria-pressed': String(id === setId),
      onclick: () => {
        if (id === setId) return;
        OPP.Sound.play('click');
        ctx.showCollection(id);
      },
    }, OPP.sets[id].code));
    const setRow = h('div', { class: 'chips set-chips' }, setChips);
    requestAnimationFrame(() => {
      const active = setChips[OPP.setOrder.indexOf(setId)];
      setRow.scrollLeft = active.offsetLeft - (setRow.clientWidth - active.offsetWidth) / 2;
    });

    const filterChips = FILTERS.map((filter) => {
      const matching = cards.filter(filter.test);
      const owned = matching.filter((card) => collection[card.id]).length;
      return h('button', {
        class: 'chip',
        type: 'button',
        'data-filter': filter.id,
        onclick: () => {
          filterState.filter = filter.id;
          OPP.Sound.play('click');
          refresh();
        },
      }, filter.label, h('span', { class: 'chip-count' }, `${owned}/${matching.length}`));
    });
    const ownedToggle = h('input', {
      type: 'checkbox',
      class: 'switch',
      checked: filterState.ownedOnly,
      onchange: (event) => {
        filterState.ownedOnly = event.target.checked;
        OPP.Sound.play('toggle');
        refresh();
      },
    });

    function refresh() {
      const filter = FILTERS.find((item) => item.id === filterState.filter);
      const shown = cards.filter(filter.test).filter((card) => !filterState.ownedOnly || collection[card.id]);
      grid.replaceChildren(...shown.map((card) => tile(card, collection[card.id] || 0, ctx)));
      if (!shown.length) grid.append(h('p', { class: 'empty' }, 'Aucune carte ici pour l\'instant.'));
      for (const chip of filterChips) chip.setAttribute('aria-pressed', String(chip.dataset.filter === filterState.filter));
    }

    refresh();
    return h('section', { class: 'view view-collection' },
      h('header', { class: 'view-header' },
        h('h2', { class: 'view-title' }, 'Collection'),
      ),
      setRow,
      h('div', { class: 'set-summary' },
        h('div', {},
          h('p', { class: 'set-summary-code' }, set.code),
          h('h3', { class: 'set-summary-name' }, set.name),
        ),
        h('strong', { class: 'set-summary-count' }, `${progress.owned}`, h('small', {}, ` / ${progress.total}`)),
      ),
      progressBar(progress.ratio, `Collection ${set.name}`),
      h('div', { class: 'chips' }, filterChips),
      h('label', { class: 'toggle' }, h('span', {}, 'Cartes obtenues uniquement'), ownedToggle),
      grid,
    );
  }

  OPP.CollectionView = { render };
})(globalThis);
