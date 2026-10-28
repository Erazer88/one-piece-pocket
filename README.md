# One Piece Pocket

Jeu mobile de collection de cartes One Piece, inspiré de Pokémon TCG Pocket : pas de
combat, on ouvre des boosters pour compléter sa collection.

Prototype web sans framework ni dépendance : ouvrir `index.html` dans un navigateur.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `scripts/import-cards.mjs` | Importe une extension depuis [optcgapi.com](https://optcgapi.com) et génère `src/data/cards-<set>.js`. |
| `src/data/cards-op01.js` | Cartes de OP-01 « Romance Dawn » (généré, ne pas éditer). |
| `src/data/boosters.js` | Composition des boosters et taux de drop (déclaratif). |
| `src/booster.js` | Tirage d'un booster, pur et déterministe si on lui passe une graine. |
| `src/collection.js` | Collection du joueur, sauvegardée dans `localStorage`. |
| `src/app.js` | Page de test : ouvrir un booster et voir la collection. |

## Cartes

Les données viennent de l'API communautaire optcgapi.com, interrogée **uniquement** par
le script d'import (le créateur demande de limiter les appels). Le jeu lit le fichier
généré et ne contacte jamais l'API.

```sh
node scripts/import-cards.mjs OP-01   # régénère src/data/cards-op01.js
```

OP-01 contient 121 cartes de base et 33 variantes :

- `parallel` : illustrations alternatives (L, SR, R, SEC), traitées comme cartes rares ;
- `manga` : Shanks manga, la carte la plus rare ;
- `boxTopper` : 6 cartes C/UC offertes avec les boîtes, absentes des boosters.

Les images sont celles hébergées par l'API (les images du site Bandai bloquent
l'affichage depuis un autre site). Elles ne sont pas copiées dans le dépôt. Les cartes et
illustrations sont la propriété de Bandai, Eiichiro Oda, Shueisha et Toei Animation :
projet de fan non commercial.

## Taux de drop

Un booster contient 12 cartes, comme un booster anglais : 7 C, 3 UC, 1 R et un slot
« hit ». Bandai ne publie pas de taux officiels. Les taux visent les moyennes par
boîte de 24 boosters observées par la communauté
([onepiece.app](https://onepiece.app/set/OP01)) :

| Par boîte (24 boosters) | Visé |
| --- | --- |
| Rare (R) | 26 |
| Super Rare (SR) | 7 |
| Leader (L) | 5 |
| Parallèle L/SR/R | 2 |
| Secret Rare (SEC) | 1 boîte sur 3 |
| SEC parallèle | 1 boîte sur 10 |
| Shanks manga | 1 boîte sur 48 |

Le slot « hit » complète par une UC quand il ne donne pas de carte rare.

## Tests

```sh
node --test
```

Les tests vérifient la composition d'un booster, le déterminisme par graine et les
moyennes par boîte sur 48 000 boosters simulés.
