// Écran d'accès affiché tant qu'aucun compte n'est connecté.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h, animate, ms } = OPP.Dom;

  // Appelle `onLogin(identifiant)` une fois le bon mot de passe saisi.
  function show(onLogin) {
    const username = h('input', {
      class: 'field',
      type: 'text',
      name: 'username',
      placeholder: 'Identifiant',
      autocomplete: 'username',
      autocapitalize: 'none',
      spellcheck: 'false',
      required: true,
    });
    const password = h('input', {
      class: 'field',
      type: 'password',
      name: 'password',
      placeholder: 'Mot de passe',
      autocomplete: 'current-password',
      required: true,
    });
    const submit = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Se connecter');
    const message = h('p', { class: 'form-message is-error', role: 'alert' });
    const form = h('form', { class: 'login-card', novalidate: true },
      h('img', { class: 'login-logo', src: 'assets/icon.svg', alt: '', width: '64', height: '64' }),
      h('h1', { class: 'login-title' }, h('strong', {}, 'One Piece'), ' Pocket'),
      h('p', { class: 'login-intro' }, 'Connecte-toi pour retrouver ta collection.'),
      username,
      password,
      submit,
      message,
    );
    const screen = h('div', { class: 'login-screen' }, form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!username.value.trim() || !password.value) {
        message.textContent = 'Entre ton identifiant et ton mot de passe.';
        return;
      }
      submit.disabled = true;
      message.textContent = '';
      try {
        const account = await OPP.Auth.check(username.value, password.value);
        if (!account) {
          message.textContent = 'Identifiant ou mot de passe incorrect.';
          animate(form, [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-8px)' },
            { transform: 'translateX(8px)' },
            { transform: 'translateX(0)' },
          ], { duration: ms(280) });
          password.select();
          return;
        }
        OPP.Sound.play('toggle');
        await animate(screen, [{ opacity: 1 }, { opacity: 0 }], { duration: ms(220), fill: 'forwards' });
        screen.remove();
        onLogin(account);
      } catch (error) {
        // crypto.subtle n'existe que sur une page sécurisée (https ou localhost).
        message.textContent = 'Connexion impossible ici : ouvre le jeu depuis son adresse https.';
      } finally {
        submit.disabled = false;
      }
    });

    document.body.append(screen);
    username.focus({ preventScroll: true });
  }

  OPP.LoginView = { show };
})(globalThis);
