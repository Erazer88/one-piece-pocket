// Éléments visuels partagés : cartes, dos de carte, booster, barres et particules.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;

  const BURST_COLORS = {
    super: ['#f2c94c', '#ffe7a3', '#f5b83d', '#ffffff'],
    secret: ['#ff8fc2', '#ffd96b', '#7ee8b8', '#7cc8ff', '#c3a2ff', '#ffffff'],
  };

  function cardFace(card, options = {}) {
    const tier = OPP.Cards.tierOf(card);
    return h('div', { class: `card tier-${tier}` },
      h('img', {
        src: OPP.Cards.imageOf(card),
        alt: card.name,
        loading: options.lazy ? 'lazy' : null,
        decoding: 'async',
        draggable: 'false',
      }),
      tier === 'super' || tier === 'secret' ? h('span', { class: 'card-foil', 'aria-hidden': 'true' }) : null,
      options.isNew ? h('span', { class: 'badge-new' }, 'Nouveau') : null,
      options.count > 1 ? h('span', { class: 'badge-count' }, `×${options.count}`) : null,
    );
  }

  function cardBack() {
    return h('div', { class: 'card card-back', 'aria-hidden': 'true' });
  }

  // Carte retournable : face cachée par défaut, `is-face-up` la retourne.
  function flipCard(card, options = {}) {
    return h('div', { class: `flip-card${options.faceUp ? ' is-face-up' : ''}` },
      h('div', { class: 'flip-inner' },
        h('div', { class: 'flip-face flip-front' }, cardFace(card, options)),
        h('div', { class: 'flip-face flip-back' }, cardBack()),
      ),
    );
  }

  // Nom affiché sur le booster, sans le préfixe « Extra Booster: ».
  function packTitle(set) {
    return set.name.replace(/^Extra Booster:\s*/i, '');
  }

  function packElement(booster, options = {}) {
    const set = OPP.sets[booster.set];
    const featured = set.cards.find((card) => card.id === set.featured);
    return h('div', {
      class: 'pack',
      style: { '--pack-a': booster.palette[0], '--pack-b': booster.palette[1] },
    },
      h('div', { class: 'pack-top' }, h('span', { class: 'pack-top-label' }, set.code)),
      h('div', { class: 'pack-body' },
        h('div', { class: 'pack-art' }, h('img', {
          src: OPP.Cards.imageOf(featured),
          alt: '',
          draggable: 'false',
          loading: options.lazy ? 'lazy' : null,
        })),
        h('div', { class: 'pack-title' },
          h('span', { class: 'pack-brand' }, 'One Piece Card Game'),
          h('strong', {}, packTitle(set)),
        ),
        h('div', { class: 'pack-meta' }, `${OPP.Booster.packSize(booster.id)} cartes`),
      ),
      h('div', { class: 'pack-cut', 'aria-hidden': 'true' }),
    );
  }

  function rarityPill(card) {
    return h('span', { class: `rarity-pill tier-${OPP.Cards.tierOf(card)}` }, OPP.Cards.rarityLabel(card));
  }

  function progressBar(ratio, label) {
    const percent = Math.round(ratio * 1000) / 10;
    return h('div', {
      class: 'progress',
      role: 'progressbar',
      'aria-label': label,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(percent),
    }, h('span', { style: { '--value': `${percent}%` } }));
  }

  function burst(layer, x, y, tier) {
    if (OPP.Dom.reducedMotion.matches) return;
    const colors = BURST_COLORS[tier] || BURST_COLORS.super;
    const count = tier === 'secret' ? 60 : 32;
    const reach = tier === 'secret' ? 280 : 180;
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * reach;
      const particle = h('span', {
        class: index % 3 === 0 ? 'particle is-star' : 'particle',
        style: {
          left: `${x}px`,
          top: `${y}px`,
          '--size': `${(index % 3 === 0 ? 10 : 4) + Math.random() * 8}px`,
          '--color': colors[index % colors.length],
        },
      });
      layer.append(particle);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      particle.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.2) rotate(${Math.random() * 360}deg)`, opacity: 0 },
      ], { duration: 700 + Math.random() * 700, easing: 'cubic-bezier(.15, .7, .3, 1)' })
        .finished.then(() => particle.remove(), () => particle.remove());
    }
  }

  // Résout quand toutes les images sont chargées, ou au plus tard après `timeout`.
  function preload(urls, timeout) {
    const loads = urls.map((url) => new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = url;
    }));
    return Promise.race([Promise.all(loads), OPP.Dom.wait(timeout)]);
  }

  OPP.CardView = { cardFace, cardBack, flipCard, packTitle, packElement, rarityPill, progressBar, burst, preload };
})(globalThis);
