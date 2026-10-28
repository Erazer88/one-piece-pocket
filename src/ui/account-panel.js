// Compte connecté : bouton de la barre du haut et fenêtre de déconnexion.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h } = OPP.Dom;

  function avatar(username) {
    return h('span', { class: 'avatar', 'aria-hidden': 'true' }, username.charAt(0).toUpperCase());
  }

  function open(username, signOut) {
    let modal = null;
    const content = h('div', { class: 'account-panel' },
      h('div', { class: 'account-head' },
        avatar(username),
        h('div', {}, h('strong', {}, username), h('small', {}, 'Connecté')),
      ),
      h('p', { class: 'account-note' }, 'Ta progression est enregistrée sur cet appareil, dans ton compte.'),
      h('button', {
        class: 'btn btn-ghost btn-block',
        type: 'button',
        onclick: () => {
          modal.close();
          signOut();
        },
      }, 'Se déconnecter'),
    );
    modal = OPP.Modal.open(content, 'modal-sheet');
  }

  function bindButton(button, username, onClick) {
    button.replaceChildren(avatar(username));
    button.setAttribute('aria-label', `Compte ${username}`);
    button.addEventListener('click', onClick);
  }

  OPP.AccountPanel = { open, bindButton, avatar };
})(globalThis);
