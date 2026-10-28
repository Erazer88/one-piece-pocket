const test = require('node:test');
const assert = require('node:assert/strict');

require('../src/timer.js');

const { PackTimer } = globalThis.OPP;
const config = { intervalHours: 6, maxCharges: 2 };
const HOUR = 3600 * 1000;
const T0 = Date.UTC(2026, 9, 28, 12);

test('un nouveau joueur commence avec la réserve pleine', () => {
  assert.deepEqual(PackTimer.refresh(null, config, T0), { charges: 2, since: T0 });
  assert.equal(PackTimer.nextChargeAt(PackTimer.refresh(null, config, T0), config), null);
});

test('chaque booster ouvert se recharge en 6 heures', () => {
  let state = PackTimer.consume(null, config, T0);
  assert.deepEqual(state, { charges: 1, since: T0 });
  state = PackTimer.consume(state, config, T0 + HOUR);
  assert.deepEqual(state, { charges: 0, since: T0 });
  assert.equal(PackTimer.consume(state, config, T0 + 5 * HOUR), null);
  assert.equal(PackTimer.nextChargeAt(state, config), T0 + 6 * HOUR);

  const later = PackTimer.refresh(state, config, T0 + 7 * HOUR);
  assert.deepEqual(later, { charges: 1, since: T0 + 6 * HOUR });
  assert.equal(PackTimer.formatRemaining(PackTimer.nextChargeAt(later, config) - (T0 + 7 * HOUR)), '05:00:00');
});

test('la réserve plafonne à 2 boosters', () => {
  const empty = { charges: 0, since: T0 };
  assert.deepEqual(PackTimer.refresh(empty, config, T0 + 30 * HOUR), { charges: 2, since: T0 + 30 * HOUR });
});

test('une horloge reculée ou une sauvegarde invalide ne bloque pas le joueur', () => {
  assert.deepEqual(PackTimer.refresh({ charges: 0, since: T0 + 10 * HOUR }, config, T0), { charges: 0, since: T0 });
  assert.deepEqual(PackTimer.refresh({ charges: 'x' }, config, T0), { charges: 2, since: T0 });
});

test('le compte à rebours s\'affiche en heures, minutes et secondes', () => {
  assert.equal(PackTimer.formatRemaining(5 * HOUR + 7 * 60000 + 3000), '05:07:03');
  assert.equal(PackTimer.formatRemaining(-5), '00:00:00');
});
