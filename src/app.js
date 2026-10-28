// Initialisation : état du joueur, recharge des boosters, navigation et ouverture.
(function (root) {
  const { OPP, document } = root;
  const { animate, ms } = OPP.Dom;
  const { Collection, PackTimer } = OPP;

  const SELECTED_KEY = 'opp.booster';
  // « ?test » dans l'adresse : boosters illimités pour essayer les extensions.
  const unlimited = new URLSearchParams(root.location.search).has('test');

  const storage = Collection.storage();
  OPP.Sound.init(storage);

  function savedBooster() {
    try {
      const id = storage.getItem(SELECTED_KEY);
      return OPP.boosters[id] ? id : OPP.boosterOrder[0];
    } catch (error) {
      return OPP.boosterOrder[0];
    }
  }

  const selectedBooster = savedBooster();
  const state = {
    collection: Collection.load(storage),
    stats: Collection.loadStats(storage),
    timer: PackTimer.refresh(Collection.loadTimer(storage), OPP.packTimer, Date.now()),
    selectedBooster,
    collectionSet: selectedBooster,
  };

  const cardById = new Map();
  const collectibleBySet = new Map();
  const allCollectible = new Map();
  for (const setId of OPP.setOrder) {
    const cards = OPP.sets[setId].cards;
    collectibleBySet.set(setId, cards.filter(OPP.Cards.isCollectible));
    for (const card of cards) {
      cardById.set(card.id, card);
      if (OPP.Cards.isCollectible(card)) allCollectible.set(card.id, card);
    }
  }

  const views = { home: OPP.HomeView, collection: OPP.CollectionView, profile: OPP.ProfileView };
  const viewRoot = document.getElementById('view');
  const tabs = [...document.querySelectorAll('[data-tab]')];
  let current = 'home';
  let opening = false;

  const ctx = {
    state,
    cardById,
    allCollectible: [...allCollectible.values()],
    collectibleOf: (setId) => collectibleBySet.get(setId),
    timerInfo,
    selectBooster,
    openBooster,
    showCard,
    showCollection,
    resetCollection,
  };

  function timerInfo() {
    state.timer = PackTimer.refresh(state.timer, OPP.packTimer, Date.now());
    return {
      unlimited,
      charges: state.timer.charges,
      nextAt: PackTimer.nextChargeAt(state.timer, OPP.packTimer),
    };
  }

  function canOpen() {
    return unlimited || timerInfo().charges > 0;
  }

  function render(withTransition) {
    const view = views[current].render(ctx);
    viewRoot.replaceChildren(view);
    for (const tab of tabs) tab.setAttribute('aria-current', tab.dataset.tab === current ? 'page' : 'false');
    if (withTransition) {
      animate(view, [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: ms(220), easing: 'ease-out' });
    }
  }

  function navigate(name) {
    if (name === current || !views[name]) return;
    current = name;
    OPP.Sound.play('click');
    root.scrollTo(0, 0);
    render(true);
  }

  function selectBooster(id) {
    state.selectedBooster = id;
    state.collectionSet = id;
    try {
      storage.setItem(SELECTED_KEY, id);
    } catch (error) {
      // Choix non mémorisé : sans conséquence.
    }
  }

  function showCollection(setId) {
    state.collectionSet = setId;
    if (current === 'collection') render();
    else navigate('collection');
  }

  // Prend un booster dans la réserve ; faux s'il faut attendre la recharge.
  function takePack() {
    if (unlimited) return true;
    const next = PackTimer.consume(state.timer, OPP.packTimer, Date.now());
    if (!next) return false;
    state.timer = next;
    Collection.saveTimer(storage, state.timer);
    return true;
  }

  async function openBooster(boosterId) {
    if (opening || !takePack()) return;
    opening = true;
    try {
      let again = true;
      while (again) {
        const booster = OPP.boosters[boosterId];
        const pack = OPP.Booster.openPack(boosterId);
        const newIds = Collection.record(state.collection, state.stats, pack);
        Collection.save(storage, state.collection, state.stats);
        render();
        const choice = await OPP.Opening.play({ booster, pack, newIds, showCard, canOpenAgain: canOpen });
        again = choice === 'again' && takePack();
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
    Collection.clear(storage);
    state.collection = {};
    state.stats = Collection.loadStats(storage);
    render();
  }

  for (const tab of tabs) tab.addEventListener('click', () => navigate(tab.dataset.tab));
  OPP.SoundPanel.bindButton(document.getElementById('sound-button'));
  // Compte à rebours de la recharge.
  setInterval(() => {
    const view = viewRoot.firstElementChild;
    if (view && views[current].update) views[current].update(ctx, view);
  }, 1000);
  render();
})(globalThis);
