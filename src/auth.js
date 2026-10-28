// Accès au jeu : comptes déclarés dans src/data/accounts.js, session mémorisée sur
// l'appareil et progression rangée par compte. La vérification se fait dans le
// navigateur : c'est un écran d'accès, pas une protection contre un visiteur averti.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const SESSION_KEY = 'opp.session';
  // Progression enregistrée avant l'ajout des comptes : reprise par le premier compte.
  const LEGACY_KEYS = ['opp.collection.v1', 'opp.stats.v1', 'opp.timer.v1', 'opp.booster'];

  function normalize(username) {
    return String(username || '').trim().toLowerCase();
  }

  function findAccount(username) {
    return OPP.accounts.find((account) => account.username === normalize(username)) || null;
  }

  async function hashPassword(username, password) {
    const data = new TextEncoder().encode(`opp:${normalize(username)}:${password}`);
    const digest = await root.crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Renvoie l'identifiant du compte si le mot de passe est bon, sinon null.
  async function check(username, password) {
    const account = findAccount(username);
    if (!account || !password) return null;
    return (await hashPassword(account.username, password)) === account.passwordHash ? account.username : null;
  }

  function loadSession(storage) {
    try {
      const account = findAccount(storage.getItem(SESSION_KEY));
      return account ? account.username : null;
    } catch (error) {
      return null;
    }
  }

  function saveSession(storage, username) {
    try {
      storage.setItem(SESSION_KEY, username);
    } catch (error) {
      // Sans stockage, il faudra se reconnecter à la prochaine visite.
    }
  }

  function clearSession(storage) {
    try {
      storage.removeItem(SESSION_KEY);
    } catch (error) {
      // Rien à effacer.
    }
  }

  function adoptLegacy(storage, scoped) {
    try {
      if (LEGACY_KEYS.some((key) => scoped.getItem(key) !== null)) return;
      for (const key of LEGACY_KEYS) {
        const value = storage.getItem(key);
        if (value === null) continue;
        scoped.setItem(key, value);
        storage.removeItem(key);
      }
    } catch (error) {
      // Stockage indisponible : rien à reprendre.
    }
  }

  // Stockage de la progression d'un compte : mêmes clés, préfixées par l'identifiant.
  function playerStorage(storage, username) {
    const prefix = `opp.player.${normalize(username)}.`;
    const scoped = {
      getItem: (key) => storage.getItem(prefix + key),
      setItem: (key, value) => storage.setItem(prefix + key, value),
      removeItem: (key) => storage.removeItem(prefix + key),
    };
    adoptLegacy(storage, scoped);
    return scoped;
  }

  OPP.Auth = { check, hashPassword, loadSession, saveSession, clearSession, playerStorage };
})(globalThis);
