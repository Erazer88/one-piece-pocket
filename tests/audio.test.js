const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const path = require('node:path');

require('../src/data/audio.js');

const { audio } = globalThis.OPP;
const root = path.join(__dirname, '..');

test('chaque musique et bruitage pointe vers un fichier présent et crédité', () => {
  const files = [
    ...audio.music.map((track) => track.src),
    ...Object.values(audio.sounds).flatMap((sound) => sound.src),
  ];
  for (const file of files) assert.ok(existsSync(path.join(root, file)), file);
  for (const item of [...audio.music, ...audio.soundCredits]) {
    assert.ok(item.title && item.author && item.license && item.url, JSON.stringify(item));
  }
  for (const sound of Object.values(audio.sounds)) assert.ok(sound.volume > 0 && sound.volume <= 1);
});
