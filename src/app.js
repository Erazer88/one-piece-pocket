// Initialisation : état du joueur, navigation entre les écrans et ouverture des boosters.
(function (root) {
  const { OPP, document } = root;
  const { animate, ms } = OPP.Dom;

  const BOOSTER_ID = 'OP-01';
  // Carte dont l'illustration décore le booster.
  const FEATURED_CARD_ID = 'OP01-024';

  const booster = OPP.boosters[BOOSTER_ID];
  const set = OPP.sets[booster.set];
  const storage = OPP.Collection.storage();
  OPP.Sound.init(storage);
  const state = {
    collection: OPP.Collection.load(storage),
    stats: OPP.Collection.loadStats(storage),
  };
  const cardById = new Map(set.cards.map((card) => [card.id, card]));
  const views = { home: OPP.HomeView, collection: OPP.CollectionView, profile: OPP.ProfileView };
  const viewRoot = document.getElementById('view');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const topbarCount = document.getElementById('topbar-count');
  let current = 'home';
  let opening = false;

  const ctx = {
    set,
    state,
    cardById,
    // Les box toppers ne sortent pas des boosters : ils ne comptent pas dans la collection.
    collectible: set.cards.filter((card) => card.variant !== 'boxTopper'),
    featured: cardById.get(FEATURED_CARD_ID),
    packSize: OPP.Booster.packSize(BOOSTER_ID),
    openBooster,
    showCard,
    resetCollection,
  };

  function render(withTransition) {
    const view = views[current].render(ctx);
    viewRoot.replaceChildren(view);
    for (const tab of tabs) tab.setAttribute('aria-current', tab.dataset.tab === current ? 'page' : 'false');
    const progress = OPP.Collection.progress(ctx.collectible, state.collection);
    topbarCount.textContent = `${progress.owned}/${progress.total}`;
    if (withTransition) {
      animate(view, [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: ms(240), easing: 'ease-out' });
    }
  }

  function navigate(name) {
    if (name === current || !views[name]) return;
    current = name;
    OPP.Sound.play('click');
    root.scrollTo(0, 0);
    render(true);
  }

  async function openBooster() {
    if (opening) return;
    opening = true;
    try {
      let again = true;
      while (again) {
        const pack = OPP.Booster.openPack(BOOSTER_ID);
        const newIds = OPP.Collection.record(state.collection, state.stats, pack);
        OPP.Collection.save(storage, state.collection, state.stats);
        render();
        const choice = await OPP.Opening.play({ set, pack, newIds, featured: ctx.featured, showCard });
        again = choice === 'again';
      }
    } finally {
      opening = false;
      render();
    }
  }

  function showCard(card) {
    OPP.Sound.play('place');
    return OPP.Modal.showCard(card, state.collection[card.id] || 0);
  }

  async function resetCollection() {
    const confirmed = await OPP.Modal.confirm({
      title: 'Réinitialiser la collection ?',
      message: 'Toutes tes cartes et statistiques seront effacées de cet appareil.',
      confirmLabel: 'Tout effacer',
      danger: true,
    });
    if (!confirmed) return;
    OPP.Collection.clear(storage);
    state.collection = {};
    state.stats = OPP.Collection.loadStats(storage);
    render();
  }

  for (const tab of tabs) tab.addEventListener('click', () => navigate(tab.dataset.tab));
  OPP.SoundPanel.bindButton(document.getElementById('sound-button'));
  render();
})(globalThis);
