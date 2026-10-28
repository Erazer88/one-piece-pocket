// Collection du joueur (exemplaires par carte) et statistiques d'ouverture.
// Pur hormis l'accès au stockage passé en paramètre.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const COLLECTION_KEY = 'opp.collection.v1';
  const STATS_KEY = 'opp.stats.v1';

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

  function load(storage) {
    const collection = {};
    for (const [id, count] of Object.entries(read(storage, COLLECTION_KEY))) {
      if (Number.isInteger(count) && count > 0) collection[id] = count;
    }
    return collection;
  }

  function loadStats(storage) {
    const saved = read(storage, STATS_KEY);
    const count = (value) => (Number.isInteger(value) && value > 0 ? value : 0);
    return {
      packsOpened: count(saved.packsOpened),
      cardsPulled: count(saved.cardsPulled),
      lastPack: Array.isArray(saved.lastPack) ? saved.lastPack.filter((id) => typeof id === 'string') : [],
    };
  }

  function save(storage, collection, stats) {
    write(storage, COLLECTION_KEY, collection);
    if (stats) write(storage, STATS_KEY, stats);
  }

  function clear(storage) {
    for (const key of [COLLECTION_KEY, STATS_KEY]) {
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

  OPP.Collection = { storage, load, loadStats, save, clear, add, record, progress };
})(globalThis);
