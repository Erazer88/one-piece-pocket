// Libellés et rangs d'affichage des raretés, variantes, couleurs et types de carte.
// `tier` choisit les effets visuels : common, rare, super ou secret.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});

  OPP.rarities = {
    C: { label: 'Commune', rank: 0, tier: 'common' },
    UC: { label: 'Peu commune', rank: 1, tier: 'common' },
    R: { label: 'Rare', rank: 2, tier: 'rare' },
    PR: { label: 'Promo', rank: 2, tier: 'rare' },
    L: { label: 'Leader', rank: 3, tier: 'super' },
    SR: { label: 'Super Rare', rank: 4, tier: 'super' },
    SEC: { label: 'Secret Rare', rank: 6, tier: 'secret' },
    TR: { label: 'Treasure Rare', rank: 6, tier: 'secret' },
  };

  // Impressions spéciales. Les promos ne sortent pas des boosters.
  OPP.variants = {
    parallel: { label: 'Parallèle', bonus: 4, tier: 'secret' },
    sp: { label: 'SP', bonus: 5, tier: 'secret' },
    treasure: { label: 'Trésor', bonus: 6, tier: 'secret' },
    manga: { label: 'Manga', bonus: 8, tier: 'secret' },
    superParallel: { label: 'Super Parallèle', bonus: 9, tier: 'secret' },
    gold: { label: 'Légendaire', bonus: 12, tier: 'secret' },
    promo: { label: 'Promo', bonus: 0, tier: null },
  };

  OPP.colors = { Red: 'Rouge', Green: 'Vert', Blue: 'Bleu', Purple: 'Violet', Black: 'Noir', Yellow: 'Jaune' };

  OPP.cardTypes = { Leader: 'Leader', Character: 'Personnage', Event: 'Événement', Stage: 'Lieu' };
})(globalThis);
