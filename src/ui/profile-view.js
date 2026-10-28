// Écran profil : statistiques, complétion par extension et meilleures cartes.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;
  const { cardFace, progressBar } = OPP.CardView;

  function stat(value, label) {
    return h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label));
  }

  function setRow(setId, ctx) {
    const set = OPP.sets[setId];
    const progress = OPP.Collection.progress(ctx.collectibleOf(setId), ctx.state.collection);
    return h('button', {
      class: 'set-row',
      type: 'button',
      onclick: () => {
        OPP.Sound.play('click');
        ctx.showCollection(setId);
      },
    },
      h('span', { class: 'set-row-code' }, set.code),
      h('span', { class: 'set-row-name' }, set.name),
      h('span', { class: 'set-row-count' }, `${progress.owned}/${progress.total}`),
      progressBar(progress.ratio, set.name),
    );
  }

  function creditList(items) {
    return h('ul', { class: 'credits' }, items.map((item) => h('li', {},
      h('a', { href: item.url, target: '_blank', rel: 'noopener' }, item.title),
      h('span', {}, ` — ${item.author} · ${item.license}`),
    )));
  }

  function render(ctx) {
    const { collection, stats } = ctx.state;
    const cards = ctx.allCollectible;
    const progress = OPP.Collection.progress(cards, collection);
    const best = cards
      .filter((card) => collection[card.id])
      .sort((a, b) => OPP.Cards.scoreOf(b) - OPP.Cards.scoreOf(a))
      .slice(0, 10);

    return h('section', { class: 'view view-profile' },
      h('header', { class: 'view-header' }, h('h2', { class: 'view-title' }, 'Profil')),
      h('div', { class: 'stat-grid' },
        stat(stats.packsOpened, 'Boosters'),
        stat(progress.owned, 'Cartes'),
        stat(`${Math.floor(progress.ratio * 1000) / 10}%`, 'Complétion'),
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
      h('section', { class: 'panel' },
        h('h3', { class: 'panel-title' }, 'Extensions'),
        h('div', { class: 'set-rows' }, OPP.setOrder.map((setId) => setRow(setId, ctx))),
      ),
      h('section', { class: 'panel' },
        h('h3', { class: 'panel-title' }, 'Crédits audio'),
        h('p', { class: 'credits-intro' }, 'Musiques et sons libres de droits.'),
        creditList(OPP.audio.music),
        creditList(OPP.audio.soundCredits),
      ),
      h('button', { class: 'btn btn-danger btn-block reset-button', type: 'button', onclick: ctx.resetCollection },
        'Réinitialiser la collection'),
    );
  }

  OPP.ProfileView = { render };
})(globalThis);
