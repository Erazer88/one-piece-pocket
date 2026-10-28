const test = require('node:test');
const assert = require('node:assert/strict');

require('../src/collection.js');
require('../src/progress.js');

const { Progress } = globalThis.OPP;

function progress(collection, packsOpened, timer = null) {
  return {
    collection,
    stats: { packsOpened, cardsPulled: packsOpened * 6, lastPack: [`last-${packsOpened}`] },
    timer,
  };
}

test('la fusion garde le plus grand nombre d\'exemplaires sans les additionner', () => {
  const merged = Progress.merge(progress({ a: 2, b: 1 }, 3), progress({ b: 4, c: 1 }, 5));
  assert.deepEqual(merged.collection, { a: 2, b: 4, c: 1 });
  assert.deepEqual(merged.stats, { packsOpened: 5, cardsPulled: 30, lastPack: ['last-5'] });
});

test('la fusion garde la recharge la plus restrictive', () => {
  const full = { charges: 2, since: 100 };
  const used = { charges: 0, since: 50 };
  assert.deepEqual(Progress.merge(progress({}, 0, full), progress({}, 0, used)).timer, used);
  assert.deepEqual(Progress.merge(progress({}, 0, { charges: 1, since: 10 }), progress({}, 0, { charges: 1, since: 20 })).timer, { charges: 1, since: 20 });
  assert.deepEqual(Progress.merge(progress({}, 0, null), progress({}, 0, used)).timer, used);
});

test('un document en ligne invalide donne une progression propre', () => {
  const clean = Progress.fromDocument({ collection: { a: 2, b: 'x', c: -1 }, stats: 'n/a', timer: { charges: 'x' } });
  assert.deepEqual(clean, { collection: { a: 2 }, stats: { packsOpened: 0, cardsPulled: 0, lastPack: [] }, timer: null });
  assert.ok(Progress.isEmpty(Progress.fromDocument(null)));
  const document = Progress.toDocument(progress({ a: 1 }, 1, { charges: 1, since: 5 }), 1234);
  assert.equal(document.version, 1);
  assert.deepEqual(Progress.fromDocument(document), progress({ a: 1 }, 1, { charges: 1, since: 5 }));
});
