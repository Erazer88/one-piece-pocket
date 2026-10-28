// Initialisation : état du joueur, recharge des boosters, navigation, ouverture et
// sauvegarde en ligne.
(function (root) {
  const { OPP, document } = root;
  const { animate, ms } = OPP.Dom;
  const { Collection, PackTimer } = OPP;

  const SELECTED_KEY = 'opp.booster';
  // Compte auquel appartient la progression enregistrée sur l'appareil.
  const OWNER_KEY = 'opp.owner';
  const SYNC_DELAY = 800;
  const SYNC_RETRY_DELAY = 30000;
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
    user: null,
    sync: { status: 'off', at: null, message: '' },
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
  let syncTimer = 0;
  let syncing = false;
  let changes = 0;
  const accountListeners = new Set();

  const account = {
    info: () => ({ configured: OPP.Cloud.isConfigured(), user: state.user, sync: state.sync }),
    subscribe(listener) {
      accountListeners.add(listener);
      return () => accountListeners.delete(listener);
    },
    signInWithGoogle: OPP.Cloud.signInWithGoogle,
    signInWithEmail: OPP.Cloud.signInWithEmail,
    createAccount: OPP.Cloud.createAccount,
    resetPassword: OPP.Cloud.resetPassword,
    signOut: OPP.Cloud.signOut,
  };

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
    account,
    openAccount: () => OPP.AccountPanel.open(account),
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
        markChanged();
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
    if (state.user) {
      OPP.Cloud.overwrite(state.user.uid, currentProgress())
        .then(() => setSync('saved'), (error) => setSync('error', OPP.Cloud.messageOf(error)));
    }
  }

  // ---------- Sauvegarde en ligne ----------

  function owner() {
    try {
      return storage.getItem(OWNER_KEY);
    } catch (error) {
      return null;
    }
  }

  function setOwner(uid) {
    try {
      if (uid) storage.setItem(OWNER_KEY, uid);
      else storage.removeItem(OWNER_KEY);
    } catch (error) {
      // Sans stockage, la progression n'est liée au compte que pour la session.
    }
  }

  function setSync(status, message) {
    state.sync = { status, at: status === 'saved' ? Date.now() : state.sync.at, message: message || '' };
    for (const listener of accountListeners) listener();
  }

  function currentProgress() {
    return { collection: state.collection, stats: state.stats, timer: state.timer };
  }

  function applyProgress(progress) {
    state.collection = progress.collection;
    state.stats = progress.stats;
    state.timer = PackTimer.refresh(progress.timer, OPP.packTimer, Date.now());
    Collection.save(storage, state.collection, state.stats);
    Collection.saveTimer(storage, state.timer);
  }

  // À appeler après chaque changement local : l'envoi est regroupé et différé.
  function markChanged() {
    changes += 1;
    if (!state.user) return;
    clearTimeout(syncTimer);
    if (!syncing) setSync('pending');
    syncTimer = setTimeout(syncNow, SYNC_DELAY);
  }

  async function syncNow() {
    clearTimeout(syncTimer);
    const user = state.user;
    if (!user || syncing) return;
    syncing = true;
    const changesAtStart = changes;
    setSync('saving');
    let merged = null;
    let failure = null;
    try {
      merged = await OPP.Cloud.sync(user.uid, currentProgress());
    } catch (error) {
      failure = error;
    } finally {
      syncing = false;
    }
    if (state.user !== user) return;
    if (!merged) {
      setSync('error', OPP.Cloud.messageOf(failure));
      syncTimer = setTimeout(syncNow, SYNC_RETRY_DELAY);
      return;
    }
    // Garde aussi ce qui a changé pendant l'envoi (un booster ouvert, par exemple).
    const before = JSON.stringify(currentProgress());
    applyProgress(OPP.Progress.merge(currentProgress(), merged));
    setSync('saved');
    if (JSON.stringify(currentProgress()) !== before) render();
    if (changes !== changesAtStart) markChanged();
  }

  function handleUser(user) {
    state.user = user;
    if (user) {
      // Progression d'un autre compte sur l'appareil : on repart de celle du compte.
      // Sinon, la partie jouée en invité est fusionnée avec le compte.
      if (owner() && owner() !== user.uid) applyProgress(OPP.Progress.empty());
      setOwner(user.uid);
      render();
      syncNow();
    } else {
      clearTimeout(syncTimer);
      if (owner()) {
        // Déconnexion : l'appareil repart comme un nouvel invité.
        setOwner(null);
        Collection.clear(storage, true);
        applyProgress(OPP.Progress.empty());
        render();
      }
      setSync('off');
    }
  }

  for (const tab of tabs) tab.addEventListener('click', () => navigate(tab.dataset.tab));
  OPP.SoundPanel.bindButton(document.getElementById('sound-button'));
  OPP.AccountPanel.bindButton(document.getElementById('account-button'), account);
  if (OPP.Cloud.isConfigured()) {
    OPP.Cloud.onUserChange(handleUser).catch((error) => setSync('error', OPP.Cloud.messageOf(error)));
  }
  // Envoie la sauvegarde en attente avant que l'appli passe en arrière-plan.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.sync.status === 'pending') syncNow();
  });
  root.addEventListener('online', () => {
    if (state.user && state.sync.status === 'error') syncNow();
  });
  // Compte à rebours de la recharge.
  setInterval(() => {
    const view = viewRoot.firstElementChild;
    if (view && views[current].update) views[current].update(ctx, view);
  }, 1000);
  render();
})(globalThis);
