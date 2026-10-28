#!/usr/bin/env node
// Importe la liste des cartes d'une extension depuis optcgapi.com et génère
// src/data/cards-<set>.js. À lancer à la main, une fois par extension :
//   node scripts/import-cards.mjs OP-01
// Le jeu ne contacte jamais l'API : il lit uniquement le fichier généré.

import { writeFile } from 'node:fs/promises';

const API = 'https://optcgapi.com/api/sets';
const RARITY_ORDER = ['C', 'UC', 'R', 'SR', 'L', 'SEC'];

const setId = process.argv[2] || 'OP-01';

function variantOf(raw) {
  if (/Box Topper/i.test(raw.card_name)) return 'boxTopper';
  if (/Manga/i.test(raw.card_name)) return 'manga';
  if (/_p\d+$/.test(raw.card_image_id)) return 'parallel';
  return null;
}

function cleanName(name) {
  return name.replace(/\s*\((?:\d{3}|Parallel|Box Topper|Manga|Alternate Art)\)/g, '').trim();
}

function toCard(raw) {
  return {
    id: raw.card_image_id,
    number: raw.card_set_id,
    name: cleanName(raw.card_name),
    rarity: raw.rarity,
    variant: variantOf(raw),
    type: raw.card_type,
    color: raw.card_color,
    // Les images de Bandai refusent l'affichage depuis un autre site (CORP same-site) :
    // on utilise celles hébergées par l'API.
    image: raw.card_image,
  };
}

function compareCards(a, b) {
  return a.number.localeCompare(b.number) || a.id.localeCompare(b.id);
}

const response = await fetch(`${API}/${setId}/`);
if (!response.ok) throw new Error(`API ${response.status} pour ${setId}`);
const raw = await response.json();
if (!Array.isArray(raw) || raw.length === 0) throw new Error(`Aucune carte pour ${setId}`);

const cards = raw.map(toCard).sort(compareCards);
const unknown = cards.filter((card) => !RARITY_ORDER.includes(card.rarity));
if (unknown.length) throw new Error(`Rareté inconnue : ${unknown.map((c) => c.id).join(', ')}`);

const data = { id: setId, name: raw[0].set_name, cards };
const fileId = setId.toLowerCase().replace(/-/g, '');
const out = new URL(`../src/data/cards-${fileId}.js`, import.meta.url);
const source = `// Généré par scripts/import-cards.mjs depuis optcgapi.com — ne pas éditer à la main.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  OPP.sets = OPP.sets || {};
  OPP.sets[${JSON.stringify(setId)}] = {
    id: ${JSON.stringify(data.id)},
    name: ${JSON.stringify(data.name)},
    cards: [
${cards.map((card) => `      ${JSON.stringify(card)},`).join('\n')}
    ],
  };
})(globalThis);
`;
await writeFile(out, source);

const counts = {};
for (const card of cards) {
  const key = card.variant ? `${card.rarity} ${card.variant}` : card.rarity;
  counts[key] = (counts[key] || 0) + 1;
}
console.log(`${setId} « ${data.name} » : ${cards.length} cartes →`, out.pathname);
console.log(counts);
