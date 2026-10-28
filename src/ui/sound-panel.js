// Réglages du son : musique, bruitages et piste en cours.
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
    const nextButton = h('button', {
      class: 'btn btn-ghost btn-block',
      type: 'button',
      onclick: () => OPP.Sound.nextTrack(),
    }, 'Piste suivante');

    function update() {
      const track = OPP.Sound.currentTrack();
      const enabled = OPP.Sound.settings().music;
      nowPlaying.replaceChildren(...(track && enabled
        ? [h('span', {}, 'En écoute'), h('strong', {}, track.title), h('small', {}, track.author)]
        : [h('span', {}, enabled ? 'La musique démarre au premier toucher' : 'Musique coupée')]));
      nextButton.disabled = !track || !enabled;
    }

    const content = h('div', { class: 'sound-panel' },
      h('h3', {}, 'Son'),
      switchRow('Musique d\'ambiance', settings.music, (enabled) => {
        OPP.Sound.setMusicEnabled(enabled);
        OPP.Sound.play('toggle');
      }),
      switchRow('Effets sonores', settings.sfx, (enabled) => {
        OPP.Sound.setSfxEnabled(enabled);
        OPP.Sound.play('toggle');
      }),
      nowPlaying,
      nextButton,
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
