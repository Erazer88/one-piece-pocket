// Composition des boosters. Les taux sont des estimations communautaires (Bandai ne
// publie pas de taux officiels) : voir README.md, section « Taux de drop ».
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  OPP.boosters = OPP.boosters || {};

  // Une boîte réelle contient 24 boosters : les taux du slot « hit » sont exprimés
  // en cartes par boîte, le reste du slot est complété par `fill`.
  OPP.boosters['OP-01'] = {
    id: 'OP-01',
    set: 'OP-01',
    name: 'Romance Dawn',
    packsPerBox: 24,
    slots: [
      { count: 7, pool: { rarity: 'C' } },
      { count: 3, pool: { rarity: 'UC' } },
      { count: 1, pool: { rarity: 'R' } },
      {
        count: 1,
        perBox: [
          { amount: 5, pool: { rarity: 'L' } },
          { amount: 7, pool: { rarity: 'SR' } },
          { amount: 2, pool: { rarity: 'R' } },
          { amount: 2, pool: { rarity: ['L', 'SR', 'R'], variant: 'parallel' } },
          { amount: 1 / 3, pool: { rarity: 'SEC' } },
          { amount: 1 / 10, pool: { rarity: 'SEC', variant: 'parallel' } },
          { amount: 1 / 48, pool: { variant: 'manga' } },
        ],
        fill: { rarity: 'UC' },
      },
    ],
  };
})(globalThis);
