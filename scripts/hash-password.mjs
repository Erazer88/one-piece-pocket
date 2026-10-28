#!/usr/bin/env node
// Donne l'entrée à ajouter dans src/data/accounts.js pour un nouveau compte :
//   node scripts/hash-password.mjs <identifiant> <mot de passe>
// Le mot de passe n'est jamais stocké : seule son empreinte SHA-256 l'est.

import { createHash } from 'node:crypto';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage : node scripts/hash-password.mjs <identifiant> <mot de passe>');
  process.exit(1);
}
const name = username.trim().toLowerCase();
const passwordHash = createHash('sha256').update(`opp:${name}:${password}`).digest('hex');
console.log(`{ username: '${name}', passwordHash: '${passwordHash}' },`);
