// Tirage des boosters. Pur : ne dépend ni du DOM ni du stockage.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});

  // Générateur pseudo-aléatoire déterministe (mulberry32) pour les tests et les replays.
  function createRng(seed) {
    let state = seed >>> 0;
    return function rng() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Un filtre sans `variant` ne vise que les cartes de base (pas de parallèle).
  function matches(card, pool) {
    const rarities = pool.rarity == null ? null : [].concat(pool.rarity);
    if (rarities && !rarities.includes(card.rarity)) return false;
    return (card.variant || null) === (pool.variant || null);
  }

  const poolCache = new WeakMap();

  function resolvePool(cards, pool) {
    const cached = poolCache.get(pool);
    if (cached && cached.cards === cards) return cached.result;
    const result = cards.filter((card) => matches(card, pool));
    if (result.length === 0) throw new Error(`Pool vide : ${JSON.stringify(pool)}`);
    poolCache.set(pool, { cards, result });
    return result;
  }

  function pickPool(slot, packsPerBox, rng) {
    if (!slot.perBox) return slot.pool;
    let roll = rng() * packsPerBox;
    for (const entry of slot.perBox) {
      roll -= entry.amount;
      if (roll < 0) return entry.pool;
    }
    return slot.fill;
  }

  // Évite les doublons dans un même booster tant que le pool le permet.
  function pickCard(cards, drawn, rng) {
    const fresh = cards.filter((card) => !drawn.has(card.id));
    const choices = fresh.length ? fresh : cards;
    return choices[Math.floor(rng() * choices.length)];
  }

  function openPack(boosterId, rng = Math.random) {
    const booster = OPP.boosters[boosterId];
    if (!booster) throw new Error(`Booster inconnu : ${boosterId}`);
    const cards = OPP.sets[booster.set].cards;
    const drawn = new Set();
    const pack = [];
    for (const slot of booster.slots) {
      for (let i = 0; i < slot.count; i += 1) {
        const pool = resolvePool(cards, pickPool(slot, booster.packsPerBox, rng));
        const card = pickCard(pool, drawn, rng);
        drawn.add(card.id);
        pack.push(card);
      }
    }
    return pack;
  }

  OPP.Booster = { createRng, resolvePool, openPack };
})(globalThis);
