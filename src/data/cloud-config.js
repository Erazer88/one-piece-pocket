// Configuration Firebase de la sauvegarde en ligne : console Firebase > Paramètres du
// projet > Vos applications > Configuration du SDK (objet firebaseConfig).
// Ces valeurs sont publiques : la sécurité repose sur les règles de firestore.rules.
// Laisser null désactive la connexion ; le jeu reste jouable en invité.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  OPP.cloudConfig = null;
})(globalThis);
