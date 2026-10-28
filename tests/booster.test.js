const test = require('node:test');
const assert = require('node:assert/strict');

require('../src/data/cards-op01.js');
require('../src/data/boosters.js');
require('../src/booster.js');

const { OPP } = globalThis;
const { createRng, resolvePool, openPack } = OPP.Booster;
const booster = OPP.boosters['OP-01'];
const cards = OPP.sets['OP-01'].cards;

test('chaque pool du booster OP-01 contient des cartes', () => {
  for (const slot of booster.slots) {
    const pools = slot.perBox ? [...slot.perBox.map((e) => e.pool), slot.fill] : [slot.pool];
    for (const pool of pools) assert.ok(resolvePool(cards, pool).length > 0);
  }
});

test('un booster contient 12 cartes distinctes, la plus rare en dernier', () => {
  const rng = createRng(1);
  for (let i = 0; i < 500; i += 1) {
    const pack = openPack('OP-01', rng);
    assert.equal(pack.length, 12);
    assert.equal(new Set(pack.map((c) => c.id)).size, 12);
    assert.deepEqual(pack.slice(0, 7).map((c) => c.rarity), Array(7).fill('C'));
  }
});

test('le tirage est déterministe pour une graine donnée', () => {
  const ids = (seed) => openPack('OP-01', createRng(seed)).map((c) => c.id);
  assert.deepEqual(ids(42), ids(42));
  assert.notDeepEqual(ids(42), ids(43));
});

test('les box toppers ne sortent pas des boosters', () => {
  const rng = createRng(7);
  for (let i = 0; i < 2000; i += 1) {
    assert.ok(openPack('OP-01', rng).every((c) => c.variant !== 'boxTopper'));
  }
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
  assert.ok(Math.abs(perBox('SEC') - 1 / 3) < 0.05, `SEC ${perBox('SEC')}`);
  assert.ok(Math.abs(perBox('parallel') - 2.12) < 0.15, `parallel ${perBox('parallel')}`);
});
