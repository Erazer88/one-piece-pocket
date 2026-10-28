// Musiques d'ambiance et bruitages. Tous libres de droits : voir assets/audio/CREDITS.md.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const MUSIC = 'assets/audio/music/';
  const SFX = 'assets/audio/sfx/';

  OPP.audio = {
    // Volume de la musique, normal et pendant l'ouverture d'un booster.
    musicVolume: 0.45,
    duckedVolume: 0.15,

    music: [
      {
        title: "A Sailor's Chant",
        author: 'Thimras',
        license: 'CC0',
        url: 'https://opengameart.org/content/a-sailors-chant',
        src: `${MUSIC}sailors-chant.mp3`,
      },
      {
        title: 'Mediterranean Breeze',
        author: 'Eric Matyas (soundimage.org)',
        license: 'CC-BY 3.0',
        url: 'https://opengameart.org/content/mediterranean-breezelooping',
        src: `${MUSIC}mediterranean-breeze.mp3`,
      },
      {
        title: 'Merchants and Sea Salt',
        author: 'NBJDLukasAbsolute',
        license: 'CC0',
        url: 'https://opengameart.org/content/merchants-and-sea-salt',
        src: `${MUSIC}merchants-and-sea-salt.mp3`,
      },
      {
        title: 'Chill lofi inspired',
        author: 'omfgdude, boucle par qubodup',
        license: 'CC0',
        url: 'https://opengameart.org/content/chill-lofi-inspired-loop-edit',
        src: `${MUSIC}chill-lofi.mp3`,
      },
      {
        title: 'Seaside Village',
        author: 'leohpaz',
        license: 'CC-BY 4.0',
        url: 'https://opengameart.org/content/ocean-music-pack',
        src: `${MUSIC}seaside-village.mp3`,
      },
      {
        title: 'Beach Town Guitar Theme',
        author: 'Hitctrl',
        license: 'CC-BY 3.0',
        url: 'https://opengameart.org/content/beach-town-guitar-theme',
        src: `${MUSIC}beach-town-guitar.mp3`,
      },
    ],

    // Plusieurs fichiers pour un son : un est tiré au hasard à chaque lecture.
    sounds: {
      packPickUp: { src: [`${SFX}pack-pick-up.mp3`], volume: 0.7 },
      tear: { src: [`${SFX}pack-tear.mp3`], volume: 0.9 },
      takeOut: { src: [`${SFX}pack-take-out.mp3`], volume: 0.8 },
      slide: { src: [`${SFX}card-slide-1.mp3`, `${SFX}card-slide-2.mp3`, `${SFX}card-slide-3.mp3`], volume: 0.6 },
      place: { src: [`${SFX}card-place.mp3`], volume: 0.6 },
      fan: { src: [`${SFX}card-fan.mp3`], volume: 0.75 },
      shimmer: { src: [`${SFX}shimmer.mp3`], volume: 0.7 },
      chime: { src: [`${SFX}magic-chime.mp3`], volume: 0.8 },
      click: { src: [`${SFX}click.mp3`], volume: 0.35 },
      toggle: { src: [`${SFX}toggle.mp3`], volume: 0.45 },
    },

    soundCredits: [
      {
        title: 'Casino Audio, Interface Sounds',
        author: 'Kenney',
        license: 'CC0',
        url: 'https://kenney.nl/assets/casino-audio',
      },
      {
        title: 'Shimmer glitter magic',
        author: 'qubodup',
        license: 'CC-BY 3.0',
        url: 'https://opengameart.org/content/shimmer-glitter-magic',
      },
      {
        title: 'Life Pickup (Yo Frankie!)',
        author: 'Lamoot',
        license: 'CC-BY 3.0',
        url: 'https://opengameart.org/content/life-pickup-yo-frankie',
      },
    ],
  };
})(globalThis);
