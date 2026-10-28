// Fenêtres modales : détail d'une carte et confirmation.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h, animate, ms } = OPP.Dom;
  const { cardFace, rarityPill } = OPP.CardView;

  function open(content, className) {
    let resolveClosed;
    let isClosed = false;
    const closed = new Promise((resolve) => { resolveClosed = resolve; });
    const panel = h('div', { class: `modal-panel ${className || ''}` }, content);
    const modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'modal-backdrop', onclick: () => close() }),
      panel,
    );
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };

    async function close(value) {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener('keydown', onKey);
      await animate(modal, [{ opacity: 1 }, { opacity: 0 }], { duration: ms(180), fill: 'forwards' });
      modal.remove();
      resolveClosed(value);
    }

    document.addEventListener('keydown', onKey);
    document.body.append(modal);
    animate(modal, [{ opacity: 0 }, { opacity: 1 }], { duration: ms(200) });
    animate(panel, [
      { transform: 'translateY(24px) scale(.94)', opacity: 0 },
      { transform: 'none', opacity: 1 },
    ], { duration: ms(320), easing: 'cubic-bezier(.3, 1.3, .5, 1)' });
    return { close, closed, element: modal };
  }

  // Incline la carte selon la position du doigt ou de la souris.
  function attachTilt(container) {
    const card = container.firstElementChild;
    const move = (event) => {
      const rect = container.getBoundingClientRect();
      const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
      container.classList.add('is-active');
      card.style.transform = `rotateY(${(x - 0.5) * 26}deg) rotateX(${(0.5 - y) * 26}deg)`;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    };
    const reset = () => {
      container.classList.remove('is-active');
      card.style.transform = '';
    };
    container.addEventListener('pointermove', move);
    container.addEventListener('pointerdown', move);
    container.addEventListener('pointerup', reset);
    container.addEventListener('pointerleave', reset);
    container.addEventListener('pointercancel', reset);
  }

  function showCard(card, count) {
    const { Cards } = OPP;
    const tilt = h('div', { class: 'tilt' }, cardFace(card));
    attachTilt(tilt);
    let modal = null;
    const content = [
      h('button', { class: 'modal-close', type: 'button', 'aria-label': 'Fermer', onclick: () => modal.close() }, '×'),
      tilt,
      h('div', { class: 'card-info' },
        h('p', { class: 'card-info-number' }, card.number),
        h('h3', {}, card.name),
        rarityPill(card),
        h('dl', {},
          h('div', {}, h('dt', {}, 'Type'), h('dd', {}, Cards.typeLabel(card))),
          h('div', {}, h('dt', {}, 'Couleur'), h('dd', {}, Cards.colorLabel(card))),
          h('div', {}, h('dt', {}, 'Exemplaires'), h('dd', {}, String(count))),
        ),
      ),
    ];
    modal = open(content, 'modal-card');
    return modal.closed;
  }

  function confirm({ title, message, confirmLabel, danger }) {
    let modal = null;
    const content = h('div', { class: 'confirm' },
      h('h3', {}, title),
      h('p', {}, message),
      h('div', { class: 'confirm-actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => modal.close(false) }, 'Annuler'),
        h('button', {
          class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`,
          type: 'button',
          onclick: () => modal.close(true),
        }, confirmLabel),
      ),
    );
    modal = open(content, 'modal-sheet');
    return modal.closed.then((value) => value === true);
  }

  OPP.Modal = { open, showCard, confirm };
})(globalThis);
