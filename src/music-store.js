// Musique du menu importée par le joueur, gardée sur l'appareil (IndexedDB) : le fichier
// n'est jamais publié avec le jeu.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const DB_NAME = 'opp-music';
  const STORE = 'files';
  const KEY = 'menu';

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function run(mode, action) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Renvoie { name, blob }, ou null s'il n'y a rien (ou pas d'IndexedDB).
  function load() {
    return run('readonly', (store) => store.get(KEY)).then((saved) => saved || null, () => null);
  }

  function save(file) {
    return run('readwrite', (store) => store.put({ name: file.name, blob: file }, KEY));
  }

  function clear() {
    return run('readwrite', (store) => store.delete(KEY));
  }

  OPP.MusicStore = { load, save, clear };
})(globalThis);
