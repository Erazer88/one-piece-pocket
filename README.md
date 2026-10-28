# One Piece Pocket

Jeu mobile de collection de cartes One Piece, inspiré de Pokémon TCG Pocket : pas de
combat, on ouvre des boosters pour compléter sa collection.

Prototype web sans framework ni dépendance : ouvrir `index.html` dans un navigateur.

## Jouer

- **Boosters** : touche le booster, puis glisse le doigt sur le haut pour le déchirer.
  Glisse chaque carte pour passer à la suivante. Les cartes brillantes (Leader, SR) et
  exceptionnelles (SEC, parallèles, manga) arrivent face cachée : touche-les pour les
  révéler. « Tout voir » saute directement au récapitulatif.
- **Collection** : cartes obtenues et manquantes, filtres par rareté. Touche une carte
  pour l'afficher en grand et l'incliner.
- **Profil** : statistiques, complétion par rareté, meilleures cartes et
  réinitialisation.

La collection est sauvegardée sur l'appareil (`localStorage`).

## Son

Une playlist de musiques chill d'ambiance mer et pirate démarre au premier toucher
(les navigateurs mobiles bloquent le son avant). Elle baisse pendant l'ouverture d'un
booster. Chaque étape a son bruitage : prise du booster, déchirure, sortie des cartes,
glissement, révélation des cartes rares et récapitulatif. Le bouton haut-parleur en
haut de l'écran coupe la musique ou les effets et passe à la piste suivante.

Ce ne sont pas les musiques officielles de One Piece : elles sont protégées et ne
peuvent pas être publiées dans ce dépôt. Toutes les pistes sont libres de droits
(CC0 ou CC-BY) ; voir [`assets/audio/CREDITS.md`](assets/audio/CREDITS.md). Les
crédits sont aussi affichés dans l'écran Profil.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `scripts/import-cards.mjs` | Importe une extension depuis [optcgapi.com](https://optcgapi.com) et génère `src/data/cards-<set>.js`. |
| `src/data/cards-op01.js` | Cartes de OP-01 « Romance Dawn » (généré, ne pas éditer). |
| `src/data/labels.js` | Libellés, rangs et niveaux d'effet des raretés et variantes. |
| `src/data/boosters.js` | Composition des boosters et taux de drop (déclaratif). |
| `src/data/audio.js` | Playlist, bruitages, volumes et crédits audio. |
| `assets/audio/` | Musiques et bruitages libres de droits (MP3). |
| `src/booster.js` | Tirage d'un booster, pur et déterministe si on lui passe une graine. |
| `src/cards.js` | Niveau d'effet, score de rareté et libellés d'une carte. |
| `src/collection.js` | Collection et statistiques du joueur, sauvegarde. |
| `src/ui/` | Interface : composants de carte, ouverture animée, son, écrans et modales. |
| `src/app.js` | Initialisation et navigation entre les écrans. |

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

Un booster contient 6 cartes, comme un booster japonais : 3 C, 1 UC, 1 R et un slot
« hit ». Bandai ne publie pas de taux officiels. Les cartes rares visent les moyennes
par boîte de 24 boosters observées par la communauté
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

Les tests vérifient la composition d'un booster, le déterminisme par graine, les
moyennes par boîte sur 48 000 boosters simulés et la sauvegarde de la collection.
