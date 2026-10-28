// Progression complète du joueur (collection, statistiques, recharge des boosters) telle
// qu'elle est sauvegardée en ligne. Pur : validation et fusion de deux progressions.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const VERSION = 1;

  function empty() {
    return { collection: {}, stats: OPP.Collection.cleanStats(null), timer: null };
  }

  function isEmpty(progress) {
    return !Object.keys(progress.collection).length && !progress.stats.packsOpened;
  }

  function toDocument(progress, now) {
    return {
      version: VERSION,
      collection: progress.collection,
      stats: progress.stats,
      timer: progress.timer,
      updatedAt: now,
    };
  }

  function fromDocument(document) {
    const data = document && typeof document === 'object' ? document : {};
    return {
      collection: OPP.Collection.cleanCollection(data.collection),
      stats: OPP.Collection.cleanStats(data.stats),
      timer: OPP.Collection.cleanTimer(data.timer),
    };
  }

  // La recharge la plus restrictive : moins de boosters, ou une recharge plus récente.
  function stricterTimer(a, b) {
    if (!a || !b) return a || b;
    if (a.charges !== b.charges) return a.charges < b.charges ? a : b;
    return a.since >= b.since ? a : b;
  }

  // Fusionne deux progressions sans rien dupliquer : pour chaque carte, le plus grand
  // nombre d'exemplaires ; pour les statistiques, les plus grandes valeurs.
  function merge(a, b) {
    const collection = { ...a.collection };
    for (const [id, count] of Object.entries(b.collection)) {
      collection[id] = Math.max(collection[id] || 0, count);
    }
    const latest = b.stats.packsOpened > a.stats.packsOpened ? b.stats : a.stats;
    return {
      collection,
      stats: {
        packsOpened: Math.max(a.stats.packsOpened, b.stats.packsOpened),
        cardsPulled: Math.max(a.stats.cardsPulled, b.stats.cardsPulled),
        lastPack: latest.lastPack,
      },
      timer: stricterTimer(a.timer, b.timer),
    };
  }

  OPP.Progress = { empty, isEmpty, toDocument, fromDocument, merge };
})(globalThis);
