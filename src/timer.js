// Recharge des boosters gratuits : une charge toutes les `intervalHours`, jusqu'à
// `maxCharges`. Pur : l'heure courante est toujours passée en paramètre.
// `since` marque le début de la recharge en cours.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const HOUR = 3600 * 1000;

  function refresh(state, config, now) {
    const interval = config.intervalHours * HOUR;
    const valid = state && Number.isFinite(state.charges) && Number.isFinite(state.since);
    const charges = valid ? Math.min(Math.max(Math.floor(state.charges), 0), config.maxCharges) : config.maxCharges;
    // Une horloge reculée ne doit pas bloquer la recharge.
    const since = valid ? Math.min(state.since, now) : now;
    const gained = Math.floor((now - since) / interval);
    if (charges + gained >= config.maxCharges) return { charges: config.maxCharges, since: now };
    return { charges: charges + gained, since: since + gained * interval };
  }

  // Renvoie l'état après avoir pris un booster, ou null s'il n'y en a pas.
  function consume(state, config, now) {
    const current = refresh(state, config, now);
    if (current.charges < 1) return null;
    const wasFull = current.charges >= config.maxCharges;
    return { charges: current.charges - 1, since: wasFull ? now : current.since };
  }

  function nextChargeAt(state, config) {
    return state.charges >= config.maxCharges ? null : state.since + config.intervalHours * HOUR;
  }

  // 5 h 07 min 03 s → « 05:07:03 ».
  function formatRemaining(milliseconds) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000));
    const parts = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
    return parts.map((part) => String(part).padStart(2, '0')).join(':');
  }

  OPP.PackTimer = { refresh, consume, nextChargeAt, formatRemaining };
})(globalThis);
