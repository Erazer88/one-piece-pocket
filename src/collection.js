// Collection du joueur (exemplaires par carte) et statistiques d'ouverture.
// Pur hormis l'accès au stockage passé en paramètre.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const COLLECTION_KEY = 'opp.collection.v1';
  const STATS_KEY = 'opp.stats.v1';
  const TIMER_KEY = 'opp.timer.v1';

  function memoryStorage() {
    const data = new Map();
    return {
      getItem: (key) => (data.has(key) ? data.get(key) : null),
      setItem: (key, value) => data.set(key, String(value)),
      removeItem: (key) => data.delete(key),
    };
  }

  // localStorage peut être absent ou lever une erreur (navigation privée, fichier local).
  function storage() {
    try {
      const local = root.localStorage;
      local.setItem('opp.test', '1');
      local.removeItem('opp.test');
      return local;
    } catch (error) {
      return memoryStorage();
    }
  }

  function read(storage, key) {
    try {
      const saved = JSON.parse(storage.getItem(key) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function write(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Stockage plein ou indisponible : les données restent en mémoire.
    }
  }

  // Validation des données relues (stockage local ou sauvegarde en ligne).
  function cleanCollection(value) {
    const collection = {};
    for (const [id, count] of Object.entries(value && typeof value === 'object' ? value : {})) {
      if (Number.isInteger(count) && count > 0) collection[id] = count;
    }
    return collection;
  }

  function cleanStats(value) {
    const saved = value && typeof value === 'object' ? value : {};
    const count = (number) => (Number.isInteger(number) && number > 0 ? number : 0);
    return {
      packsOpened: count(saved.packsOpened),
      cardsPulled: count(saved.cardsPulled),
      lastPack: Array.isArray(saved.lastPack) ? saved.lastPack.filter((id) => typeof id === 'string') : [],
    };
  }

  function cleanTimer(value) {
    return value && Number.isFinite(value.charges) && Number.isFinite(value.since)
      ? { charges: value.charges, since: value.since }
      : null;
  }

  function load(storage) {
    return cleanCollection(read(storage, COLLECTION_KEY));
  }

  function loadStats(storage) {
    return cleanStats(read(storage, STATS_KEY));
  }

  function save(storage, collection, stats) {
    write(storage, COLLECTION_KEY, collection);
    if (stats) write(storage, STATS_KEY, stats);
  }

  function loadTimer(storage) {
    return cleanTimer(read(storage, TIMER_KEY));
  }

  function saveTimer(storage, timer) {
    write(storage, TIMER_KEY, timer);
  }

  // Efface la collection et les statistiques ; la recharge des boosters est conservée,
  // sauf avec `withTimer` (déconnexion : l'appareil repart comme un nouvel invité).
  function clear(storage, withTimer) {
    for (const key of withTimer ? [COLLECTION_KEY, STATS_KEY, TIMER_KEY] : [COLLECTION_KEY, STATS_KEY]) {
      try {
        storage.removeItem(key);
      } catch (error) {
        // Rien à effacer.
      }
    }
  }

  function add(collection, cards) {
    for (const card of cards) collection[card.id] = (collection[card.id] || 0) + 1;
    return collection;
  }

  // Ajoute un booster ouvert et renvoie les identifiants des cartes jamais obtenues.
  function record(collection, stats, pack) {
    const newIds = new Set(pack.filter((card) => !collection[card.id]).map((card) => card.id));
    add(collection, pack);
    stats.packsOpened += 1;
    stats.cardsPulled += pack.length;
    stats.lastPack = pack.map((card) => card.id);
    return newIds;
  }

  function progress(cards, collection) {
    const owned = cards.filter((card) => collection[card.id]).length;
    return { owned, total: cards.length, ratio: cards.length ? owned / cards.length : 0 };
  }

  OPP.Collection = {
    storage,
    cleanCollection,
    cleanStats,
    cleanTimer,
    load,
    loadStats,
    save,
    loadTimer,
    saveTimer,
    clear,
    add,
    record,
    progress,
  };
})(globalThis);
