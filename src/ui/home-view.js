// Écran d'accueil : progression, booster à ouvrir et dernier booster obtenu.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;
  const { cardFace, packElement, progressBar } = OPP.CardView;

  function render(ctx) {
    const { set, state } = ctx;
    const progress = OPP.Collection.progress(ctx.collectible, state.collection);
    const pack = packElement(set, ctx.featured, ctx.packSize);
    pack.classList.add('is-floating');
    const lastPack = state.stats.lastPack.map((id) => ctx.cardById.get(id)).filter(Boolean);

    return h('section', { class: 'view view-home' },
      h('div', { class: 'progress-card' },
        h('div', { class: 'progress-card-head' },
          h('span', {}, `Collection ${set.name}`),
          h('strong', {}, `${progress.owned} / ${progress.total}`),
        ),
        progressBar(progress.ratio, 'Progression de la collection'),
      ),
      h('button', {
        class: 'pack-showcase',
        type: 'button',
        'aria-label': `Ouvrir un booster ${set.name}`,
        onclick: ctx.openBooster,
      }, h('span', { class: 'pack-halo', 'aria-hidden': 'true' }), pack),
      h('div', { class: 'pack-caption' },
        h('h2', {}, set.name),
        h('p', {}, `${set.id} · ${ctx.packSize} cartes par booster`),
      ),
      h('button', { class: 'btn btn-primary btn-open', type: 'button', onclick: ctx.openBooster }, 'Ouvrir un booster'),
      lastPack.length
        ? h('section', { class: 'panel' },
          h('h3', { class: 'panel-title' }, 'Dernier booster'),
          h('div', { class: 'card-strip' }, lastPack.map((card) => h('button', {
            class: 'strip-card',
            type: 'button',
            'aria-label': card.name,
            onclick: () => ctx.showCard(card),
          }, cardFace(card, { lazy: true })))),
        )
        : null,
    );
  }

  OPP.HomeView = { render };
})(globalThis);
