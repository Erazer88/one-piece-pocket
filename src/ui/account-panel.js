// Compte du joueur : connexion par e-mail ou Google, état de la sauvegarde en ligne.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h, svgIcon } = OPP.Dom;

  const USER_ICON = '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>';
  const GOOGLE_ICON = `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;

  function timeLabel(timestamp) {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function syncLabel(sync) {
    switch (sync.status) {
      case 'pending':
      case 'saving':
        return 'Sauvegarde en cours…';
      case 'saved':
        return `Progression sauvegardée à ${timeLabel(sync.at)}`;
      case 'error':
        return sync.message;
      default:
        return '';
    }
  }

  function avatar(user) {
    if (user && user.photo) {
      return h('img', { class: 'avatar', src: user.photo, alt: '', referrerpolicy: 'no-referrer' });
    }
    const letter = user && (user.name || user.email || '').trim().charAt(0).toUpperCase();
    return h('span', { class: 'avatar' }, letter || svgIcon(USER_ICON));
  }

  function signedOut(account, show) {
    const email = h('input', {
      class: 'field',
      type: 'email',
      name: 'email',
      placeholder: 'Adresse e-mail',
      autocomplete: 'email',
      required: true,
    });
    const password = h('input', {
      class: 'field',
      type: 'password',
      name: 'password',
      placeholder: 'Mot de passe (6 caractères min.)',
      autocomplete: 'current-password',
      minlength: '6',
      required: true,
    });
    const google = h('button', { class: 'btn btn-google btn-block', type: 'button' });
    google.innerHTML = GOOGLE_ICON;
    google.append('Continuer avec Google');
    google.addEventListener('click', () => show.run(account.signInWithGoogle));

    const form = h('form', { class: 'account-form', novalidate: true },
      email,
      password,
      h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Se connecter'),
      h('button', {
        class: 'btn btn-ghost btn-block',
        type: 'button',
        onclick: () => {
          password.autocomplete = 'new-password';
          if (show.check(email, password)) show.run(() => account.createAccount(email.value.trim(), password.value));
        },
      }, 'Créer un compte'),
      h('button', {
        class: 'link-button',
        type: 'button',
        onclick: () => {
          if (!email.value.trim()) return show.message('Entre ton adresse e-mail ci-dessus.', 'error');
          show.run(() => account.resetPassword(email.value.trim()), 'E-mail de réinitialisation envoyé.');
        },
      }, 'Mot de passe oublié ?'),
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (show.check(email, password)) show.run(() => account.signInWithEmail(email.value.trim(), password.value));
    });

    return [
      h('h3', {}, 'Sauvegarde ta progression'),
      h('p', { class: 'account-intro' },
        'Sans compte, ta collection n\'est enregistrée que sur cet appareil. Connecte-toi pour la retrouver partout.'),
      google,
      h('div', { class: 'divider' }, h('span', {}, 'ou')),
      form,
    ];
  }

  function signedIn(account, user, show) {
    return [
      h('div', { class: 'account-head' },
        avatar(user),
        h('div', {},
          h('strong', {}, user.name || user.email),
          user.name ? h('small', {}, user.email) : null,
        ),
      ),
      h('p', { class: 'sync-line', 'data-sync': '' }),
      h('button', {
        class: 'btn btn-ghost btn-block',
        type: 'button',
        onclick: () => show.run(account.signOut),
      }, 'Se déconnecter'),
      h('p', { class: 'account-note' }, 'Ta collection reste sauvegardée sur ton compte.'),
    ];
  }

  function open(account) {
    const body = h('div', { class: 'account-panel' });
    const message = h('p', { class: 'form-message', role: 'status' });
    let shownUid;

    const show = {
      message(text, kind) {
        message.textContent = text || '';
        message.className = `form-message${kind ? ` is-${kind}` : ''}`;
      },
      check(email, password) {
        if (!email.value.trim() || !email.checkValidity()) {
          show.message('Adresse e-mail invalide.', 'error');
          return false;
        }
        if (password.value.length < 6) {
          show.message('Le mot de passe doit contenir au moins 6 caractères.', 'error');
          return false;
        }
        return true;
      },
      // Lance une action du compte en bloquant les boutons, puis affiche le résultat.
      async run(action, success) {
        const buttons = [...body.querySelectorAll('button')];
        buttons.forEach((button) => { button.disabled = true; });
        show.message('');
        try {
          await action();
          if (success) show.message(success, 'success');
        } catch (error) {
          show.message(OPP.Cloud.messageOf(error), 'error');
        } finally {
          buttons.forEach((button) => { button.disabled = false; });
        }
      },
    };

    function update() {
      const { configured, user, sync } = account.info();
      const uid = configured ? (user ? user.uid : null) : 'off';
      // Le formulaire n'est redessiné que si le joueur change, pour garder la saisie.
      if (uid !== shownUid) {
        shownUid = uid;
        if (!configured) {
          body.replaceChildren(
            h('h3', {}, 'Sauvegarde en ligne'),
            h('p', { class: 'account-intro' },
              'La connexion n\'est pas encore configurée sur ce jeu. Ta collection est enregistrée sur cet appareil.'),
          );
        } else {
          body.replaceChildren(...(user ? signedIn(account, user, show) : signedOut(account, show)), message);
        }
      }
      const line = body.querySelector('[data-sync]');
      if (line) {
        line.textContent = syncLabel(sync);
        line.classList.toggle('is-error', sync.status === 'error');
      }
    }

    const unsubscribe = account.subscribe(update);
    update();
    OPP.Modal.open(body, 'modal-sheet').closed.then(unsubscribe);
  }

  // Bouton de la barre du haut : avatar une fois connecté, point de couleur selon la
  // sauvegarde (orange en cours, rouge en erreur).
  function bindButton(button, account) {
    const update = () => {
      const { user, sync } = account.info();
      button.replaceChildren(avatar(user));
      button.dataset.sync = user ? sync.status : 'off';
      button.setAttribute('aria-label', user ? `Compte : ${user.email || user.name}` : 'Se connecter');
    };
    account.subscribe(update);
    update();
    button.addEventListener('click', () => open(account));
  }

  OPP.AccountPanel = { open, bindButton, avatar, syncLabel };
})(globalThis);
