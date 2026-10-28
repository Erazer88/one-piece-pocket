// Collection du joueur : nombre d'exemplaires par identifiant de carte.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const STORAGE_KEY = 'opp.collection.v1';

  function load(storage) {
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function save(storage, collection) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (error) {
      // Stockage indisponible (navigation privée) : la collection reste en mémoire.
    }
  }

  function add(collection, cards) {
    for (const card of cards) collection[card.id] = (collection[card.id] || 0) + 1;
    return collection;
  }

  OPP.Collection = { load, save, add };
})(globalThis);
