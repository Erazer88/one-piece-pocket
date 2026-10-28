// Comptes autorisés à jouer. Le mot de passe n'est pas stocké, seulement son empreinte
// SHA-256 ; pour ajouter un compte : node scripts/hash-password.mjs <identifiant> <mot de passe>.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});

  OPP.accounts = [
    { username: 'mini', passwordHash: 'fc6893f6e76a02d7e851ecbebdfb6acc407ee03104113d9544ba60673a2a3a66' },
  ];
})(globalThis);
