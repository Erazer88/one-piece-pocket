// Règles d'affichage d'une carte : niveau d'effet, score de rareté et libellés.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});

  function tierOf(card) {
    const variant = card.variant && OPP.variants[card.variant];
    return (variant && variant.tier) || OPP.rarities[card.rarity].tier;
  }

  function scoreOf(card) {
    const bonus = card.variant ? OPP.variants[card.variant].bonus : 0;
    return OPP.rarities[card.rarity].rank + bonus;
  }

  function rarityLabel(card) {
    const base = OPP.rarities[card.rarity].label;
    return card.variant ? `${base} ${OPP.variants[card.variant].label}` : base;
  }

  function colorLabel(card) {
    return card.color.split(' ').map((color) => OPP.colors[color] || color).join(' / ');
  }

  function typeLabel(card) {
    return OPP.cardTypes[card.type] || card.type;
  }

  // Images sans le filigrane « SAMPLE » des visuels officiels, hébergées par DotGG
  // (mêmes identifiants que les nôtres). Repli : l'image officielle de l'API.
  const CLEAN_IMAGE_BASE = 'https://static.dotgg.gg/onepiece/card/';

  function imageOf(card) {
    return `${CLEAN_IMAGE_BASE}${card.id}.webp`;
  }

  function fallbackImageOf(card) {
    return OPP.cardImageBase + (card.image || `${card.id}.jpg`);
  }

  // Numéro imprimé sur la carte (OP01-024), sans le suffixe de variante.
  function numberOf(card) {
    return card.id.replace(/_[a-z]\d+$/, '');
  }

  // Les promos (box toppers, dash packs…) ne sortent pas des boosters.
  function isCollectible(card) {
    return card.variant !== 'promo';
  }

  OPP.Cards = {
    tierOf,
    scoreOf,
    rarityLabel,
    colorLabel,
    typeLabel,
    imageOf,
    fallbackImageOf,
    numberOf,
    isCollectible,
  };
})(globalThis);
