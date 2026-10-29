// Composition des boosters et recharge. Les taux sont des estimations communautaires
// (Bandai ne publie pas de taux officiels) : voir README.md, section « Taux de drop ».
(function (root) {
  const OPP = (root.OPP = root.OPP || {});

  // Un booster gratuit toutes les 6 heures ; jusqu'à 2 boosters en réserve.
  OPP.packTimer = { intervalHours: 6, maxCharges: 2 };

  // Les cartes à partir de la Secret Rare sortent 3 fois plus souvent que dans une
  // vraie boîte, pour rester atteignables à raison d'un booster toutes les 6 heures.
  const RARE_BOOST = 3;

  // Dernière carte du booster, en cartes par boîte de 24 boosters. Une entrée sans
  // carte dans l'extension (pas de manga, par exemple) laisse sa place à `fill`.
  const HITS_PER_BOX = [
    { amount: 5, pool: { rarity: 'L' } },
    { amount: 7, pool: { rarity: 'SR' } },
    { amount: 2, pool: { rarity: 'R' } },
    { amount: 2, pool: { rarity: ['C', 'UC', 'R', 'SR', 'L'], variant: 'parallel' } },
    { amount: RARE_BOOST / 3, pool: { rarity: 'SEC' } },
    { amount: RARE_BOOST / 10, pool: { rarity: 'SEC', variant: 'parallel' } },
    { amount: RARE_BOOST / 6, pool: { variant: 'sp' } },
    { amount: RARE_BOOST / 12, pool: { variant: 'treasure' } },
    { amount: RARE_BOOST / 32, pool: { variant: 'superParallel' } },
    { amount: RARE_BOOST / 48, pool: { variant: 'manga' } },
    { amount: RARE_BOOST / 500, pool: { variant: 'gold' } },
  ];

  // 10 cartes par booster : les cartes rares gardent les chances d'un booster réel, les
  // autres sont des communes et peu communes. Les Extra Boosters n'ont pas
  // de peu communes.
  const TEMPLATES = {
    standard: [
      { count: 6, pool: { rarity: 'C' } },
      { count: 2, pool: { rarity: 'UC' } },
      { count: 1, pool: { rarity: 'R' } },
      { count: 1, perBox: HITS_PER_BOX, fill: { rarity: 'UC' } },
    ],
    extra: [
      { count: 8, pool: { rarity: 'C' } },
      { count: 1, pool: { rarity: 'R' } },
      { count: 1, perBox: HITS_PER_BOX, fill: { rarity: 'C' } },
    ],
  };

  // Couleurs du booster selon la couleur de sa carte vedette.
  const PALETTES = {
    Red: ['#ff7a7a', '#d93a4a'],
    Green: ['#5fd6a4', '#1f9a6c'],
    Blue: ['#6cc3ff', '#2f74d6'],
    Purple: ['#c39bff', '#7a4fd1'],
    Black: ['#8f99ab', '#3a4252'],
    Yellow: ['#ffd36b', '#e09a12'],
  };

  OPP.boosters = OPP.boosters || {};
  OPP.boosterOrder = OPP.setOrder.slice();
  for (const setId of OPP.boosterOrder) {
    const set = OPP.sets[setId];
    const featured = set.cards.find((card) => card.id === set.featured);
    OPP.boosters[setId] = {
      id: setId,
      set: setId,
      name: set.name,
      packsPerBox: 24,
      palette: PALETTES[featured.color.split(' ')[0]] || PALETTES.Blue,
      slots: TEMPLATES[setId.startsWith('EB') ? 'extra' : 'standard'],
    };
  }
})(globalThis);
