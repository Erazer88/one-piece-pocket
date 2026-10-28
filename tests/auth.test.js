const test = require('node:test');
const assert = require('node:assert/strict');

require('../src/data/accounts.js');
require('../src/auth.js');

const { Auth } = globalThis.OPP;

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test('le compte mini se connecte avec son mot de passe et lui seul', async () => {
  assert.equal(await Auth.check('mini', 'pipi'), 'mini');
  assert.equal(await Auth.check('  Mini ', 'pipi'), 'mini');
  assert.equal(await Auth.check('mini', 'Pipi'), null);
  assert.equal(await Auth.check('mini', ''), null);
  assert.equal(await Auth.check('inconnu', 'pipi'), null);
});

test('la session ne retient qu\'un compte existant', () => {
  const storage = fakeStorage();
  assert.equal(Auth.loadSession(storage), null);
  Auth.saveSession(storage, 'mini');
  assert.equal(Auth.loadSession(storage), 'mini');
  storage.setItem('opp.session', 'supprime');
  assert.equal(Auth.loadSession(storage), null);
  Auth.clearSession(storage);
  assert.equal(storage.getItem('opp.session'), null);
});

test('la progression d\'avant les comptes est reprise une seule fois', () => {
  const storage = fakeStorage({ 'opp.collection.v1': '{"OP01-001":2}', 'opp.settings.v1': '{}' });
  const mini = Auth.playerStorage(storage, 'mini');
  assert.equal(mini.getItem('opp.collection.v1'), '{"OP01-001":2}');
  assert.equal(storage.getItem('opp.collection.v1'), null);
  assert.equal(storage.getItem('opp.settings.v1'), '{}');
  mini.setItem('opp.stats.v1', '{}');
  assert.equal(storage.getItem('opp.player.mini.opp.stats.v1'), '{}');
  // Un autre compte ne récupère pas la progression de mini.
  assert.equal(Auth.playerStorage(storage, 'autre').getItem('opp.collection.v1'), null);
});
