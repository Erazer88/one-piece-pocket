// Écran profil : statistiques, complétion par rareté et meilleures cartes.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;
  const { cardFace, progressBar } = OPP.CardView;

  const RARITY_ROWS = ['L', 'SEC', 'SR', 'R', 'UC', 'C'];

  function stat(value, label) {
    return h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label));
  }

  function rarityRow(label, cards, collection, tier) {
    const progress = OPP.Collection.progress(cards, collection);
    return h('div', { class: `rarity-row tier-${tier}` },
      h('span', { class: 'rarity-row-label' }, label),
      progressBar(progress.ratio, label),
      h('span', { class: 'rarity-row-count' }, `${progress.owned}/${progress.total}`),
    );
  }

  function render(ctx) {
    const { collection, stats } = ctx.state;
    const cards = ctx.collectible;
    const progress = OPP.Collection.progress(cards, collection);
    const best = cards
      .filter((card) => collection[card.id])
      .sort((a, b) => OPP.Cards.scoreOf(b) - OPP.Cards.scoreOf(a))
      .slice(0, 8);

    return h('section', { class: 'view view-profile' },
      h('header', { class: 'view-header' },
        h('div', {},
          h('h2', { class: 'view-title' }, 'Profil'),
          h('p', { class: 'view-subtitle' }, 'Tes statistiques de collectionneur'),
        ),
      ),
      h('div', { class: 'stat-grid' },
        stat(stats.packsOpened, 'Boosters'),
        stat(stats.cardsPulled, 'Cartes tirées'),
        stat(`${Math.floor(progress.ratio * 100)}%`, 'Complétion'),
      ),
      h('section', { class: 'panel' },
        h('h3', { class: 'panel-title' }, 'Par rareté'),
        h('div', { class: 'rarity-rows' },
          RARITY_ROWS.map((rarity) => rarityRow(
            OPP.rarities[rarity].label,
            cards.filter((card) => card.rarity === rarity && !card.variant),
            collection,
            OPP.rarities[rarity].tier,
          )),
          rarityRow('Parallèles', cards.filter((card) => card.variant), collection, 'secret'),
        ),
      ),
      h('section', { class: 'panel' },
        h('h3', { class: 'panel-title' }, 'Meilleures cartes'),
        best.length
          ? h('div', { class: 'card-strip' }, best.map((card) => h('button', {
            class: 'strip-card',
            type: 'button',
            'aria-label': card.name,
            onclick: () => ctx.showCard(card),
          }, cardFace(card, { lazy: true }))))
          : h('p', { class: 'empty' }, 'Ouvre ton premier booster pour commencer ta collection.'),
      ),
      h('button', { class: 'btn btn-danger btn-block reset-button', type: 'button', onclick: ctx.resetCollection },
        'Réinitialiser la collection'),
    );
  }

  OPP.ProfileView = { render };
})(globalThis);
