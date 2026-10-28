// Écran d'accueil : carrousel des boosters, recharge et dernier booster obtenu.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h, svgIcon } = OPP.Dom;
  const { cardFace, packElement, progressBar } = OPP.CardView;

  const HOURGLASS = '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>';

  // Centre la diapositive dans le carrousel, sans faire défiler la page.
  function centerSlide(carousel, slide, behavior) {
    const left = slide.offsetLeft - (carousel.clientWidth - slide.offsetWidth) / 2;
    carousel.scrollTo({ left, behavior });
  }

  function closestSlide(carousel, slides) {
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let best = slides[0];
    for (const slide of slides) {
      const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
      if (distance < Math.abs(best.offsetLeft + best.offsetWidth / 2 - center)) best = slide;
    }
    return best;
  }

  function render(ctx) {
    const { state } = ctx;
    const slides = OPP.boosterOrder.map((id) => h('button', {
      class: 'pack-slide',
      type: 'button',
      'data-booster': id,
      'aria-label': `Booster ${OPP.sets[id].name}`,
    }, packElement(OPP.boosters[id], { lazy: true })));
    const carousel = h('div', { class: 'pack-carousel' }, slides);
    const name = h('h2', { class: 'pack-name' });
    const meta = h('p', { class: 'pack-sub' });
    const progress = h('div', { class: 'pack-progress' });
    const openButton = h('button', {
      class: 'btn btn-primary btn-open',
      type: 'button',
      'data-open': '',
      onclick: () => ctx.openBooster(state.selectedBooster),
    });

    function showInfo(id) {
      const set = OPP.sets[id];
      const done = OPP.Collection.progress(ctx.collectibleOf(id), state.collection);
      name.textContent = set.name;
      meta.textContent = `${set.code} · ${done.owned} / ${done.total} cartes`;
      progress.replaceChildren(progressBar(done.ratio, `Collection ${set.name}`));
      for (const slide of slides) slide.classList.toggle('is-selected', slide.dataset.booster === id);
    }

    function select(id) {
      if (id === state.selectedBooster) return;
      ctx.selectBooster(id);
      OPP.Sound.play('click');
      showInfo(id);
    }

    for (const slide of slides) {
      slide.addEventListener('click', () => {
        if (slide.dataset.booster === state.selectedBooster) ctx.openBooster(state.selectedBooster);
        else centerSlide(carousel, slide, 'smooth');
      });
    }
    let frame = 0;
    carousel.addEventListener('scroll', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Un carrousel retiré de la page (écran redessiné) ne doit plus rien choisir.
        if (carousel.isConnected) select(closestSlide(carousel, slides).dataset.booster);
      });
    }, { passive: true });

    showInfo(state.selectedBooster);
    // Le carrousel est dans la page à l'image suivante : on centre le booster choisi.
    requestAnimationFrame(() => {
      const slide = slides.find((item) => item.dataset.booster === state.selectedBooster);
      if (slide) centerSlide(carousel, slide, 'auto');
    });

    const lastPack = state.stats.lastPack.map((id) => ctx.cardById.get(id)).filter(Boolean);
    const view = h('section', { class: 'view view-home' },
      carousel,
      h('div', { class: 'pack-info' }, name, meta, progress),
      h('div', { class: 'hourglass' },
        h('span', { class: 'hourglass-icon' }, svgIcon(HOURGLASS)),
        h('div', { class: 'hourglass-text' },
          h('strong', { 'data-timer-title': '' }),
          h('span', { 'data-timer-detail': '' }),
        ),
        h('span', { class: 'hourglass-pips', 'aria-hidden': 'true' },
          Array.from({ length: OPP.packTimer.maxCharges }, () => h('span', { class: 'pip' }))),
      ),
      openButton,
      lastPack.length
        ? h('section', { class: 'panel' },
          h('h3', { class: 'panel-title' }, 'Dernier booster'),
          h('div', { class: 'card-strip' }, lastPack.map((card) => h('button', {
            class: 'strip-card',
            type: 'button',
            'aria-label': card.name,
            onclick: () => ctx.showCard(card),
          }, cardFace(card, { lazy: true })))),
        )
        : null,
    );
    update(ctx, view);
    return view;
  }

  // Appelée chaque seconde : compte à rebours, réserve et bouton d'ouverture.
  function update(ctx, view) {
    const timer = ctx.timerInfo();
    const title = view.querySelector('[data-timer-title]');
    const detail = view.querySelector('[data-timer-detail]');
    const button = view.querySelector('[data-open]');
    const remaining = timer.nextAt ? OPP.PackTimer.formatRemaining(timer.nextAt - Date.now()) : null;
    if (timer.unlimited) {
      title.textContent = 'Mode test';
      detail.textContent = 'Boosters illimités';
    } else {
      title.textContent = timer.charges
        ? `${timer.charges} booster${timer.charges > 1 ? 's' : ''} disponible${timer.charges > 1 ? 's' : ''}`
        : 'Prochain booster';
      detail.textContent = remaining ? `Recharge dans ${remaining}` : 'Réserve pleine';
    }
    view.querySelectorAll('.pip').forEach((pip, index) => {
      pip.classList.toggle('is-full', timer.unlimited || index < timer.charges);
    });
    const canOpen = timer.unlimited || timer.charges > 0;
    button.disabled = !canOpen;
    button.textContent = canOpen ? 'Ouvrir' : `Disponible dans ${remaining}`;
  }

  OPP.HomeView = { render, update };
})(globalThis);
