# One Piece Pocket

Jeu mobile de collection de cartes One Piece, inspiré de Pokémon TCG Pocket : pas de
combat, on ouvre des boosters pour compléter sa collection.

Jouer : **https://erazer88.github.io/one-piece-pocket/** (GitHub Pages, branche `main`).

Prototype web sans framework ni dépendance : ouvrir `index.html` dans un navigateur.

## Jouer

- **Accueil** : fais défiler les 20 boosters (OP-01 à OP-17 et Extra Boosters EB-01 à
  EB-03), puis touche « Ouvrir ». Un booster gratuit se recharge toutes les 6 heures,
  avec jusqu'à 2 boosters en réserve ; le sablier affiche le compte à rebours.
- **Choix** : 10 boosters identiques tournent sur une roue ; fais-la tourner du doigt et
  touche celui qui te plaît. Le contenu est tiré à l'avance : le choix est visuel.
- **Ouverture** : glisse le doigt sur le haut du booster pour le découper, puis glisse
  chaque carte. Les Leaders et Super Rares arrivent face cachée, comme les cartes
  spéciales (SEC, parallèles, SP, manga…) : touche-les pour les révéler.
- **Collection** : choisis l'extension, filtre par rareté, touche une carte pour
  l'afficher en grand.
- **Profil** : statistiques, meilleures cartes et progression par extension.

Pour essayer les extensions sans attendre, ajoute `?test` à l'adresse : les boosters
deviennent illimités. La collection est sauvegardée sur l'appareil (`localStorage`).

## Accès

Le jeu s'ouvre sur un écran de connexion. Les comptes sont déclarés dans
[`src/data/accounts.js`](src/data/accounts.js) : un identifiant et l'empreinte SHA-256
de son mot de passe (jamais le mot de passe lui-même). Pour ajouter un compte :

```sh
node scripts/hash-password.mjs <identifiant> <mot de passe>
```

puis copier la ligne affichée dans `OPP.accounts`.

- La session est mémorisée sur l'appareil ; « Se déconnecter » (bouton de compte en
  haut à droite ou écran Profil) ramène à l'écran d'accès.
- La progression est enregistrée sur l'appareil, séparément pour chaque compte. Celle
  d'avant l'écran d'accès est reprise par le premier compte qui se connecte.
- La vérification se fait dans le navigateur et le dépôt est public : c'est un écran
  d'accès, pas une protection. Elle demande une page sécurisée (https ou localhost).

## Introduction

À chaque ouverture, l'appli affiche « par amour, pour mini » : un toucher lance la
musique, le texte apparaît, un cœur se dessine, puis un cercle se referme sur lui pour
révéler le menu. Un second toucher passe l'introduction.

## Son

La musique du menu est **Mother Sea** (bande originale de One Piece, Kohei Tanaka),
jouée en boucle à partir du premier toucher (les navigateurs mobiles bloquent le son
avant) et baissée pendant l'ouverture d'un booster. C'est une œuvre protégée, ajoutée
à la demande du propriétaire du dépôt : à retirer si les ayants droit le demandent.

Chaque étape de l'ouverture a son bruitage : prise du booster, déchirure, sortie des
cartes, glissement, révélation des cartes rares et récapitulatif. Les bruitages sont
libres de droits (CC0 ou CC-BY) ; voir [`assets/audio/CREDITS.md`](assets/audio/CREDITS.md).
Le bouton haut-parleur en haut de l'écran coupe la musique ou les effets.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `scripts/import-cards.mjs` | Importe une extension depuis [optcgapi.com](https://optcgapi.com) et génère `src/data/cards-<set>.js`. |
| `src/data/cards.js` | Cartes des 20 extensions (généré, ne pas éditer). |
| `src/data/labels.js` | Libellés, rangs et niveaux d'effet des raretés et variantes. |
| `src/data/boosters.js` | Composition des boosters, taux de drop et recharge (déclaratif). |
| `src/data/audio.js` | Musique, bruitages, volumes et crédits audio. |
| `assets/audio/` | Musique du menu et bruitages (MP3). |
| `src/booster.js` | Tirage d'un booster, pur et déterministe si on lui passe une graine. |
| `src/cards.js` | Niveau d'effet, score de rareté et libellés d'une carte. |
| `src/collection.js` | Collection et statistiques du joueur, sauvegarde. |
| `src/timer.js` | Recharge des boosters gratuits (pur, testé). |
| `src/data/accounts.js` | Comptes autorisés (identifiant et empreinte du mot de passe). |
| `src/auth.js` | Vérification de l'accès, session et progression par compte. |
| `src/ui/` | Interface : introduction, cartes, ouverture animée, son, écrans et modales. |
| `src/app.js` | Initialisation et navigation entre les écrans. |

## Cartes

Les données viennent de l'API communautaire optcgapi.com, interrogée **uniquement** par
le script d'import (le créateur demande de limiter les appels). Le jeu lit le fichier
généré et ne contacte jamais l'API.

```sh
node scripts/import-cards.mjs          # toutes les extensions
node scripts/import-cards.mjs OP-17    # une seule, les autres sont conservées
```

Le script nettoie les données de l'API : doublons, versions promo portant l'identifiant
de la carte de base, cartes d'EB-04 mêlées à OP-14 et OP-15. Les Premium Boosters
(PRB-01, PRB-02) sont exclus : ce sont des rééditions de cartes des autres extensions.

Variantes reconnues : `parallel` (illustration alternative), `sp` (SP, SPR, Wanted
Poster), `treasure`, `manga`, `superParallel` (Super Alternate Art), `gold` (versions
or et argent) et `promo` (box toppers, dash packs… absents des boosters).

Les images viennent de [DotGG](https://onepiece.dotgg.gg), qui publie les visuels sans le
filigrane « SAMPLE » des images officielles (2 910 cartes sur 2 915). Si une image y
manque, le jeu affiche celle de l'API. Aucune image n'est copiée dans le dépôt. Les cartes et
illustrations sont la propriété de Bandai, Eiichiro Oda, Shueisha et Toei Animation :
projet de fan non commercial.

## Taux de drop

Un booster contient 6 cartes, comme un booster japonais : 3 C, 1 UC, 1 R et une
dernière carte tirée selon le tableau ci-dessous (les Extra Boosters, sans peu
communes, ont 4 C). Bandai ne publie pas de taux officiels : les taux partent des
moyennes par boîte de 24 boosters observées par la communauté
([onepiece.app](https://onepiece.app/set/OP01)), appliquées à toutes les extensions.
À partir de la Secret Rare, ils sont **triplés** (`RARE_BOOST` dans
`src/data/boosters.js`) pour rester atteignables avec un booster toutes les 6 heures.

| 6e carte | Par boîte réelle | Dans le jeu | Par booster |
| --- | --- | --- | --- |
| Super Rare (SR) | 7 | 7 | 29,2 % |
| Leader (L) | 5 | 5 | 20,8 % |
| Rare (R) | 2 (+ 24 garanties) | 2 | 8,3 % |
| Parallèle L/SR/R | 2 | 2 | 8,3 % |
| Secret Rare (SEC) | 1 boîte sur 3 | 1 par boîte | 4,2 % (1 sur 24) |
| SP | 1 boîte sur 6 | 1 boîte sur 2 | 2,1 % (1 sur 48) |
| SEC parallèle | 1 boîte sur 10 | 3 boîtes sur 10 | 1,25 % (1 sur 80) |
| Treasure Rare | 1 boîte sur 12 | 1 boîte sur 4 | 1,04 % (1 sur 96) |
| Super Parallèle | 1 boîte sur 32 | 3 boîtes sur 32 | 0,39 % (1 sur 256) |
| Manga | 1 boîte sur 48 | 1 boîte sur 16 | 0,26 % (1 sur 384) |
| Or / argent | 1 boîte sur 500 | 3 boîtes sur 500 | 0,025 % (1 sur 4 000) |
| Peu commune (sinon) | — | — | 24,1 % |

Quand une extension n'a pas une variante (pas de manga, par exemple), la dernière carte
devient une peu commune (une commune dans les Extra Boosters).

## Tests

```sh
node --test
```

Les tests vérifient la composition d'un booster, le déterminisme par graine, les
moyennes par boîte sur 48 000 boosters simulés, l'ouverture de chaque extension, la
recharge des boosters, la sauvegarde de la collection et l'accès par compte.
