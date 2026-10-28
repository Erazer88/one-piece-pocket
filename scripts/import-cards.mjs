#!/usr/bin/env node
// Importe les extensions depuis optcgapi.com et génère src/data/cards.js.
// À lancer à la main quand une extension sort :
//   node scripts/import-cards.mjs          (toutes les extensions)
//   node scripts/import-cards.mjs OP-01    (une seule, les autres sont conservées)
// Le jeu ne contacte jamais l'API : il lit uniquement le fichier généré.

import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const API = 'https://optcgapi.com/api';
const IMAGE_BASE = 'https://optcgapi.com/media/static/Card_Images/';
const OUTPUT = new URL('../src/data/cards.js', import.meta.url);
const RARITIES = ['C', 'UC', 'R', 'SR', 'L', 'SEC', 'TR', 'PR'];

// Les Premium Boosters rééditent des cartes des autres extensions.
const EXCLUDED_SETS = new Set(['PRB-01', 'PRB-02']);
// L'API mêle à certaines extensions les cartes d'un autre produit (EB-04).
const EXCLUDED_PREFIXES = { 'OP14-EB04': ['EB04'], 'OP15-EB04': ['EB04'] };

// Variante d'une impression spéciale, dans l'ordre de priorité.
const VARIANT_TAGS = [
  ['gold', /\((?:Gold|Silver|Gold-Stamped Signature)\)/],
  ['superParallel', /\((?:Red )?Super Alternate Art\)/],
  ['manga', /\(Manga\)/],
  ['treasure', /\(TR\)/],
  ['sp', /\((?:SP|SPR|Wanted Poster)\)/],
  ['promo', /\((?:Box Topper|Dash Pack|Gem|Navy|Pandaman Art|Full Art)\)/],
];
const NAME_TAGS = /\s*\((?:\d{3}|Parallel|Alternate Art|Box Topper|Manga|SPR?|TR|Wanted Poster|(?:Red )?Super Alternate Art|Gold|Silver|Gold-Stamped Signature|Dash Pack|Gem|Navy|Pandaman Art|Full Art|[A-Z]+\d*-\d{3})\)|\s+-\s+[A-Z]+\d*-\d{3}/g;

async function fetchJson(path) {
  const response = await fetch(`${API}/${path}`);
  if (!response.ok) throw new Error(`API ${response.status} pour ${path}`);
  return response.json();
}

function tagOf(name) {
  const match = VARIANT_TAGS.find(([, pattern]) => pattern.test(name));
  return match ? match[0] : null;
}

function variantOf(raw, ownPrefix) {
  const tag = tagOf(raw.card_name);
  if (tag) return tag;
  if (raw.rarity === 'TR') return 'treasure';
  // Les réimpressions d'autres extensions (et les promos PR) sont des cartes SP.
  if (raw.rarity === 'PR' || !raw.card_image_id.startsWith(ownPrefix)) return 'sp';
  return 'parallel';
}

function toCard(raw, variant) {
  const card = {
    id: raw.card_image_id,
    name: raw.card_name.replace(NAME_TAGS, '').trim(),
    rarity: raw.rarity,
    type: raw.card_type,
    color: raw.card_color,
  };
  if (variant) card.variant = variant;
  const image = raw.card_image.replace(IMAGE_BASE, '');
  if (image !== `${raw.card_image_id}.jpg`) card.image = image;
  return card;
}

// Une seule entrée par carte. Les cartes de base (sans suffixe _p) étiquetées comme
// variantes sont des doublons ou des promos de l'API : on garde la version normale.
function buildCards(setId, rawCards) {
  const ownPrefix = setId.replace('-', '').slice(0, 4);
  const excluded = EXCLUDED_PREFIXES[setId] || [];
  const byId = new Map();
  for (const raw of rawCards) {
    const id = raw.card_image_id;
    if (excluded.some((prefix) => id.startsWith(prefix))) continue;
    const isPrint = /_p\d+$/.test(id);
    if (!isPrint && !id.startsWith(ownPrefix)) continue;
    const tag = isPrint ? null : tagOf(raw.card_name);
    if (!isPrint && tag === 'promo') continue;
    const previous = byId.get(id);
    if (previous && !(previous.tagged && !tag)) continue;
    byId.set(id, { raw, tagged: Boolean(tag), variant: isPrint ? variantOf(raw, ownPrefix) : null });
  }
  return [...byId.values()]
    .map(({ raw, variant }) => toCard(raw, variant))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
}

// Illustration du booster : la carte de base la plus recherchée (SEC, sinon SR).
function featuredOf(rawCards, cards) {
  const base = new Set(cards.filter((card) => !card.variant).map((card) => card.id));
  for (const rarity of ['SEC', 'SR', 'L']) {
    const candidates = rawCards
      .filter((raw) => raw.rarity === rarity && base.has(raw.card_image_id))
      .sort((a, b) => (b.market_price || 0) - (a.market_price || 0));
    if (candidates.length) return candidates[0].card_image_id;
  }
  return cards[0].id;
}

async function loadExisting() {
  try {
    const context = { globalThis: {} };
    vm.runInNewContext(await readFile(OUTPUT, 'utf8'), context);
    return context.globalThis.OPP;
  } catch (error) {
    return { sets: {}, setOrder: [] };
  }
}

const allSets = (await fetchJson('allSets/')).filter((set) => !EXCLUDED_SETS.has(set.set_id));
const requested = process.argv.slice(2);
const existing = requested.length ? await loadExisting() : { sets: {} };
const sets = {};

for (const { set_id: setId, set_name: name } of allSets) {
  if (requested.length && !requested.includes(setId)) {
    if (existing.sets[setId]) sets[setId] = existing.sets[setId];
    continue;
  }
  const rawCards = await fetchJson(`sets/${setId}/`);
  const cards = buildCards(setId, rawCards);
  const unknown = cards.filter((card) => !RARITIES.includes(card.rarity));
  if (unknown.length) throw new Error(`Rareté inconnue : ${unknown.map((card) => card.id).join(', ')}`);
  // Code affiché : OP14-EB04 devient OP-14.
  const code = setId.replace(/^([A-Z]+)(\d+)-EB\d+$/, '$1-$2');
  sets[setId] = { id: setId, code, name, featured: featuredOf(rawCards, cards), cards };
  const counts = {};
  for (const card of cards) counts[card.variant || card.rarity] = (counts[card.variant || card.rarity] || 0) + 1;
  console.log(`${setId} « ${name} » : ${cards.length} cartes`, counts);
}

const setOrder = allSets.map((set) => set.set_id).filter((setId) => sets[setId]);
const lines = setOrder.map((setId) => {
  const { cards, ...info } = sets[setId];
  return `  OPP.sets[${JSON.stringify(setId)}] = { ...${JSON.stringify(info)}, cards: [\n${cards.map((card) => `    ${JSON.stringify(card)},`).join('\n')}\n  ] };`;
});
await writeFile(OUTPUT, `// Généré par scripts/import-cards.mjs depuis optcgapi.com — ne pas éditer à la main.
// Image d'une carte : ${IMAGE_BASE}<id>.jpg, sauf si \`image\` donne un autre fichier.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  OPP.cardImageBase = ${JSON.stringify(IMAGE_BASE)};
  OPP.setOrder = ${JSON.stringify(setOrder)};
  OPP.sets = OPP.sets || {};
${lines.join('\n')}
})(globalThis);
`);
console.log(`${setOrder.length} extensions → ${OUTPUT.pathname}`);
