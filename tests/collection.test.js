const test = require('node:test');
const assert = require('node:assert/strict');

require('../src/data/cards-op01.js');
require('../src/data/labels.js');
require('../src/cards.js');
require('../src/collection.js');

const { OPP } = globalThis;
const { Collection, Cards } = OPP;
const cards = OPP.sets['OP-01'].cards;
const byId = (id) => cards.find((card) => card.id === id);

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test('record signale les nouvelles cartes et met à jour les statistiques', () => {
  const collection = { 'OP01-001': 1 };
  const stats = Collection.loadStats(fakeStorage());
  const pack = [byId('OP01-001'), byId('OP01-024'), byId('OP01-120_p2')];
  const newIds = Collection.record(collection, stats, pack);
  assert.deepEqual([...newIds], ['OP01-024', 'OP01-120_p2']);
  assert.equal(collection['OP01-001'], 2);
  assert.deepEqual(stats, { packsOpened: 1, cardsPulled: 3, lastPack: ['OP01-001', 'OP01-024', 'OP01-120_p2'] });
});

test('la sauvegarde se recharge et ignore les données corrompues', () => {
  const storage = fakeStorage();
  Collection.save(storage, { 'OP01-001': 2 }, { packsOpened: 3, cardsPulled: 18, lastPack: ['OP01-001'] });
  assert.deepEqual(Collection.load(storage), { 'OP01-001': 2 });
  assert.equal(Collection.loadStats(storage).packsOpened, 3);

  const broken = fakeStorage({ 'opp.collection.v1': '{"OP01-001":"x","OP01-002":-1,"OP01-003":1}', 'opp.stats.v1': 'pas du json' });
  assert.deepEqual(Collection.load(broken), { 'OP01-003': 1 });
  assert.deepEqual(Collection.loadStats(broken), { packsOpened: 0, cardsPulled: 0, lastPack: [] });

  Collection.clear(storage);
  assert.deepEqual(Collection.load(storage), {});
});

test('les niveaux d\'effet suivent la rareté et les variantes', () => {
  assert.equal(Cards.tierOf(byId('OP01-006')), 'common');
  assert.equal(Cards.tierOf(byId('OP01-013')), 'rare');
  assert.equal(Cards.tierOf(byId('OP01-024')), 'super');
  assert.equal(Cards.tierOf(byId('OP01-001')), 'super');
  assert.equal(Cards.tierOf(byId('OP01-121')), 'secret');
  assert.equal(Cards.tierOf(byId('OP01-013_p1')), 'secret');
  assert.ok(Cards.scoreOf(byId('OP01-120_p2')) > Cards.scoreOf(byId('OP01-120_p1')));
  assert.equal(Cards.rarityLabel(byId('OP01-024_p1')), 'Super Rare Parallèle');
  assert.equal(Cards.colorLabel(byId('OP01-002')), 'Vert / Rouge');
});
