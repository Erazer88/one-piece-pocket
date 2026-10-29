// Réglages du son : musique du menu et bruitages.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;

  const ICONS = {
    on: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    off: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 5M22 9l-5 5"/>',
  };

  function switchRow(label, checked, onChange) {
    return h('label', { class: 'toggle sound-row' },
      h('span', {}, label),
      h('input', {
        type: 'checkbox',
        class: 'switch',
        checked,
        onchange: (event) => onChange(event.target.checked),
      }),
    );
  }

  function open() {
    const settings = OPP.Sound.settings();
    const nowPlaying = h('div', { class: 'now-playing' });

    // Musique du menu : un fichier audio du téléphone, gardé sur l'appareil.
    const menuStatus = h('p', { class: 'menu-music-status' });
    const fileInput = h('input', {
      type: 'file',
      accept: 'audio/*',
      hidden: true,
      onchange: async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        menuStatus.textContent = 'Import…';
        try {
          await OPP.Sound.setMenuMusic(file);
          menuStatus.textContent = '';
        } catch (error) {
          menuStatus.textContent = 'Import impossible sur ce navigateur.';
        }
        event.target.value = '';
      },
    });
    const menuButton = h('button', { class: 'btn btn-ghost btn-block', type: 'button', onclick: () => fileInput.click() });
    const clearButton = h('button', {
      class: 'link-button',
      type: 'button',
      onclick: () => OPP.Sound.clearMenuMusic(),
    }, 'Retirer la musique');

    function update() {
      const music = OPP.Sound.menuMusic();
      const enabled = OPP.Sound.settings().music;
      nowPlaying.replaceChildren(...(music
        ? [h('span', {}, enabled ? 'Musique du menu' : 'Musique coupée'), h('strong', {}, music.title)]
        : [h('span', {}, 'Aucune musique : importe un fichier audio de ton téléphone.')]));
      menuButton.textContent = music ? 'Changer la musique' : 'Importer une musique';
      clearButton.hidden = !music;
    }

    const content = h('div', { class: 'sound-panel' },
      h('h3', {}, 'Son'),
      switchRow('Musique', settings.music, (enabled) => {
        OPP.Sound.setMusicEnabled(enabled);
        OPP.Sound.play('toggle');
      }),
      switchRow('Effets sonores', settings.sfx, (enabled) => {
        OPP.Sound.setSfxEnabled(enabled);
        OPP.Sound.play('toggle');
      }),
      nowPlaying,
      h('div', { class: 'menu-music' }, menuButton, clearButton, menuStatus, fileInput),
    );
    const unsubscribe = OPP.Sound.subscribe(update);
    update();
    OPP.Modal.open(content, 'modal-sheet').closed.then(unsubscribe);
  }

  // Bouton haut-parleur de la barre du haut, barré quand tout le son est coupé.
  function bindButton(button) {
    const icon = OPP.Dom.svgIcon('');
    button.replaceChildren(icon);
    const update = () => {
      const { music, sfx } = OPP.Sound.settings();
      icon.innerHTML = music || sfx ? ICONS.on : ICONS.off;
    };
    OPP.Sound.subscribe(update);
    update();
    button.addEventListener('click', open);
  }

  OPP.SoundPanel = { open, bindButton };
})(globalThis);
