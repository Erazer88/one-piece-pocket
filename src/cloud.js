// Sauvegarde en ligne avec Firebase (Authentication + Firestore). Le SDK n'est chargé
// que si src/data/cloud-config.js est rempli. Une progression par joueur : players/{uid}.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const SDK_VERSION = '10.14.1';
  const SDK_PARTS = ['app', 'auth', 'firestore'];

  const MESSAGES = {
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/missing-password': 'Entre ton mot de passe.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse : connecte-toi.',
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
    'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
    'auth/user-not-found': 'Aucun compte avec cette adresse.',
    'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
    'auth/network-request-failed': 'Pas de connexion internet.',
    'auth/popup-closed-by-user': 'Connexion Google annulée.',
    'auth/cancelled-popup-request': 'Connexion Google annulée.',
    'auth/unauthorized-domain': 'Ce site n\'est pas autorisé dans la configuration Firebase.',
    'auth/operation-not-allowed': 'Ce mode de connexion n\'est pas activé dans Firebase.',
    unavailable: 'Serveur injoignable. Nouvel essai bientôt.',
    'permission-denied': 'Accès refusé par le serveur.',
  };

  let ready = null;

  function isConfigured() {
    const config = OPP.cloudConfig;
    return Boolean(config && config.apiKey && config.projectId);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(Object.assign(new Error(src), { code: 'auth/network-request-failed' }));
      document.head.append(script);
    });
  }

  // Charge le SDK et initialise Firebase une seule fois ; un échec permet de réessayer.
  function start() {
    if (!ready) {
      ready = (async () => {
        if (!root.firebase) {
          for (const part of SDK_PARTS) {
            await loadScript(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-${part}-compat.js`);
          }
        }
        // `emulators` sert aux tests locaux avec l'émulateur Firebase.
        const { emulators, ...config } = OPP.cloudConfig;
        const app = root.firebase.initializeApp(config);
        const auth = app.auth();
        const db = app.firestore();
        if (emulators) {
          auth.useEmulator(emulators.auth, { disableWarnings: true });
          db.useEmulator(emulators.firestoreHost, emulators.firestorePort);
        }
        auth.languageCode = 'fr';
        return { auth, db };
      })().catch((error) => {
        ready = null;
        throw error;
      });
    }
    return ready;
  }

  function describe(user) {
    return { uid: user.uid, email: user.email, name: user.displayName, photo: user.photoURL };
  }

  async function onUserChange(callback) {
    const { auth } = await start();
    auth.onAuthStateChanged((user) => callback(user ? describe(user) : null));
  }

  async function signInWithGoogle() {
    const { auth } = await start();
    const provider = new root.firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (error) {
      // Fenêtre bloquée (navigateur intégré à une appli) : on passe par une redirection.
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
        await auth.signInWithRedirect(provider);
      } else {
        throw error;
      }
    }
  }

  async function signInWithEmail(email, password) {
    const { auth } = await start();
    await auth.signInWithEmailAndPassword(email, password);
  }

  async function createAccount(email, password) {
    const { auth } = await start();
    await auth.createUserWithEmailAndPassword(email, password);
  }

  async function resetPassword(email) {
    const { auth } = await start();
    await auth.sendPasswordResetEmail(email);
  }

  async function signOut() {
    const { auth } = await start();
    await auth.signOut();
  }

  function playerRef(db, uid) {
    return db.collection('players').doc(uid);
  }

  // Fusionne la progression locale avec celle du serveur dans une transaction, pour ne
  // rien perdre si un autre appareil a joué entre-temps. Renvoie la progression fusionnée.
  async function sync(uid, local) {
    const { db } = await start();
    const ref = playerRef(db, uid);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const merged = snapshot.exists
        ? OPP.Progress.merge(local, OPP.Progress.fromDocument(snapshot.data()))
        : local;
      transaction.set(ref, OPP.Progress.toDocument(merged, Date.now()));
      return merged;
    });
  }

  // Remplace la progression en ligne, sans fusion (réinitialisation de la collection).
  async function overwrite(uid, progress) {
    const { db } = await start();
    await playerRef(db, uid).set(OPP.Progress.toDocument(progress, Date.now()));
  }

  function messageOf(error) {
    return MESSAGES[error && error.code] || 'Une erreur est survenue. Réessaie.';
  }

  OPP.Cloud = {
    isConfigured,
    start,
    onUserChange,
    signInWithGoogle,
    signInWithEmail,
    createAccount,
    resetPassword,
    signOut,
    sync,
    overwrite,
    messageOf,
  };
})(globalThis);
