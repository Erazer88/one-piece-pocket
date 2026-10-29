const test = require('node:test');
const assert = require('node:assert/strict');

require('../src/data/cards.js');
require('../src/data/labels.js');
require('../src/data/boosters.js');
require('../src/booster.js');

const { OPP } = globalThis;
const { createRng, resolvePool, openPack } = OPP.Booster;
const booster = OPP.boosters['OP-01'];
const cards = OPP.sets['OP-01'].cards;

test('les slots fixes et le remplissage ont des cartes dans chaque extension', () => {
  for (const boosterId of OPP.boosterOrder) {
    const setCards = OPP.sets[boosterId].cards;
    for (const slot of OPP.boosters[boosterId].slots) {
      const pool = slot.perBox ? slot.fill : slot.pool;
      assert.ok(resolvePool(setCards, pool).length > 0, `${boosterId} ${JSON.stringify(pool)}`);
    }
  }
});

test('un booster contient 10 cartes distinctes, la plus rare en dernier', () => {
  const rng = createRng(1);
  for (let i = 0; i < 500; i += 1) {
    const pack = openPack('OP-01', rng);
    assert.equal(pack.length, 10);
    assert.equal(OPP.Booster.packSize('OP-01'), 10);
    assert.equal(new Set(pack.map((c) => c.id)).size, 10);
    assert.deepEqual(pack.slice(0, 9).map((c) => c.rarity), ['C', 'C', 'C', 'C', 'C', 'C', 'UC', 'UC', 'R']);
    assert.ok(pack.slice(0, 9).every((c) => !c.variant));
  }
});

test('le tirage est déterministe pour une graine donnée', () => {
  const ids = (seed) => openPack('OP-01', createRng(seed)).map((c) => c.id);
  assert.deepEqual(ids(42), ids(42));
  assert.notDeepEqual(ids(42), ids(43));
});

test('chaque extension ouvre des boosters de 10 cartes sans promo', () => {
  const rng = createRng(7);
  for (const boosterId of OPP.boosterOrder) {
    assert.equal(OPP.Booster.packSize(boosterId), 10);
    for (let i = 0; i < 300; i += 1) {
      const pack = openPack(boosterId, rng);
      assert.equal(pack.length, 10, boosterId);
      assert.equal(new Set(pack.map((c) => c.id)).size, 10, boosterId);
      assert.ok(pack.every((c) => c.variant !== 'promo' && OPP.rarities[c.rarity]), boosterId);
    }
  }
});

test('les variantes rares sortent dans les extensions qui en ont', () => {
  const rng = createRng(11);
  const seen = new Set();
  for (let i = 0; i < 24 * 600; i += 1) {
    for (const card of openPack('OP-13', rng)) if (card.variant) seen.add(card.variant);
  }
  for (const variant of ['parallel', 'sp', 'treasure', 'superParallel']) assert.ok(seen.has(variant), variant);
});

test('les moyennes par boîte suivent les taux visés', () => {
  const boxes = 2000;
  const rng = createRng(2024);
  const totals = { L: 0, SR: 0, R: 0, SEC: 0, parallel: 0 };
  for (let i = 0; i < boxes * booster.packsPerBox; i += 1) {
    for (const card of openPack('OP-01', rng)) {
      if (card.variant) totals.parallel += 1;
      else if (card.rarity in totals) totals[card.rarity] += 1;
    }
  }
  const perBox = (key) => totals[key] / boxes;
  assert.ok(Math.abs(perBox('L') - 5) < 0.2, `L ${perBox('L')}`);
  assert.ok(Math.abs(perBox('SR') - 7) < 0.2, `SR ${perBox('SR')}`);
  assert.ok(Math.abs(perBox('R') - 26) < 0.2, `R ${perBox('R')}`);
  // À partir de la Secret Rare, les taux réels sont triplés.
  assert.ok(Math.abs(perBox('SEC') - 1) < 0.08, `SEC ${perBox('SEC')}`);
  assert.ok(Math.abs(perBox('parallel') - (2 + 3 / 10 + 3 / 48)) < 0.15, `parallel ${perBox('parallel')}`);
});
