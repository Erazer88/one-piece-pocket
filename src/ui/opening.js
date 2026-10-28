// Séquence d'ouverture d'un booster : déchirer, révéler chaque carte, récapitulatif.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h, animate, wait, ms } = OPP.Dom;
  const { flipCard, cardFace, packElement, rarityPill, burst, preload } = OPP.CardView;
  const { Sound } = OPP;

  const SKIP = Symbol('skip');
  const SWIPE_DISTANCE = 70;
  const TAP_DISTANCE = 10;
  const NEXT_KEYS = new Set(['Enter', ' ', 'ArrowRight']);
  const EASE_BACK = 'cubic-bezier(.3, 1.4, .5, 1)';
  // Les cartes de ces niveaux arrivent face cachée et se révèlent d'une touche.
  const CHARGE_HINTS = {
    super: 'Une carte brillante ! Touche-la pour la révéler',
    secret: 'Quelque chose de spécial… Touche pour révéler !',
  };

  function vibrate(pattern) {
    try {
      if (root.navigator.vibrate) root.navigator.vibrate(pattern);
    } catch (error) {
      // Vibration non disponible.
    }
  }

  function createSkip() {
    let trigger;
    const promise = new Promise((resolve) => { trigger = () => resolve(SKIP); });
    return { promise, trigger };
  }

  // Attend un geste, ou le bouton « Tout voir », puis retire les écouteurs du geste.
  async function race(skip, gesture) {
    const controller = new AbortController();
    try {
      return await Promise.race([gesture(controller.signal), skip.promise]);
    } finally {
      controller.abort();
    }
  }

  function flash(view, strength) {
    return animate(view.flash, [
      { opacity: 0 },
      { opacity: strength, offset: 0.15 },
      { opacity: 0 },
    ], { duration: ms(520), easing: 'ease-out' });
  }

  // Glisser sur le booster trace la découpe ; une simple touche l'ouvre aussi.
  function tearGesture(pack, signal) {
    return new Promise((resolve) => {
      let start = null;
      const setCut = (value) => pack.style.setProperty('--cut', value);
      const reset = () => {
        start = null;
        pack.classList.remove('is-cutting');
        setCut(0);
      };
      pack.addEventListener('pointerdown', (event) => {
        start = { x: event.clientX, y: event.clientY, width: pack.getBoundingClientRect().width };
        pack.setPointerCapture(event.pointerId);
        pack.classList.add('is-cutting');
      }, { signal });
      pack.addEventListener('pointermove', (event) => {
        if (!start) return;
        const cut = Math.min(Math.abs(event.clientX - start.x) / (start.width * 0.75), 1);
        setCut(cut);
        if (cut >= 1) resolve();
      }, { signal });
      pack.addEventListener('pointerup', (event) => {
        if (!start) return;
        const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (moved < TAP_DISTANCE) resolve();
        else reset();
      }, { signal });
      pack.addEventListener('pointercancel', reset, { signal });
      document.addEventListener('keydown', (event) => {
        if (NEXT_KEYS.has(event.key)) {
          event.preventDefault();
          resolve();
        }
      }, { signal });
    });
  }

  function waitTap(element, signal) {
    return new Promise((resolve) => {
      let start = null;
      element.addEventListener('pointerdown', (event) => {
        start = { x: event.clientX, y: event.clientY };
      }, { signal });
      element.addEventListener('pointerup', (event) => {
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 24) resolve();
        start = null;
      }, { signal });
      document.addEventListener('keydown', (event) => {
        if (NEXT_KEYS.has(event.key)) {
          event.preventDefault();
          resolve();
        }
      }, { signal });
    });
  }

  // Résout avec la direction de sortie de la carte : -1 à gauche, 1 à droite.
  function waitSwipe(element, signal) {
    return new Promise((resolve) => {
      let start = null;
      const reset = () => {
        start = null;
        element.style.transition = '';
        element.style.transform = '';
      };
      element.addEventListener('pointerdown', (event) => {
        start = { x: event.clientX, y: event.clientY };
        element.setPointerCapture(event.pointerId);
        element.style.transition = 'none';
      }, { signal });
      element.addEventListener('pointermove', (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        element.style.transform = `translateX(${dx}px) rotate(${dx / 16}deg)`;
      }, { signal });
      element.addEventListener('pointerup', (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        const isTap = Math.hypot(dx, event.clientY - start.y) < TAP_DISTANCE;
        if (isTap) resolve(-1);
        else if (Math.abs(dx) > SWIPE_DISTANCE) resolve(Math.sign(dx));
        else reset();
      }, { signal });
      element.addEventListener('pointercancel', reset, { signal });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') resolve(-1);
        else if (NEXT_KEYS.has(event.key)) {
          event.preventDefault();
          resolve(1);
        }
      }, { signal });
    });
  }

  function flyAway(element, direction) {
    Sound.play('slide', { rate: 0.9 + Math.random() * 0.2 });
    const from = getComputedStyle(element).transform;
    element.style.transition = 'none';
    return animate(element, [
      { transform: from === 'none' ? 'translate(0, 0)' : from },
      { transform: `translate(${direction * 130}vw, -6vh) rotate(${direction * 28}deg)` },
    ], { duration: ms(420), easing: 'cubic-bezier(.45, 0, .8, .5)', fill: 'forwards' });
  }

  function showCaption(view, card, isNew) {
    if (!card) {
      view.caption.classList.add('is-hidden');
      return;
    }
    view.caption.replaceChildren(
      h('strong', {}, card.name),
      h('span', { class: 'opening-caption-meta' },
        rarityPill(card),
        isNew ? h('span', { class: 'new-pill' }, 'Nouveau') : null,
      ),
    );
    view.caption.classList.remove('is-hidden');
  }

  async function tearOpen(view, packEl, pack, newIds, imagesReady) {
    const top = packEl.querySelector('.pack-top');
    const body = packEl.querySelector('.pack-body');
    packEl.classList.remove('is-cutting');
    packEl.style.setProperty('--cut', 1);
    view.hint.textContent = '';
    await wait(ms(180));
    packEl.classList.add('is-torn');
    Sound.play('tear');
    flash(view, 0.6);
    vibrate(20);
    const loadingHint = setTimeout(() => { view.hint.textContent = 'Chargement des cartes…'; }, 900);
    await Promise.all([
      animate(top, [
        { transform: 'none', opacity: 1 },
        { transform: 'translate(60%, -260%) rotate(35deg)', opacity: 0 },
      ], { duration: ms(650), easing: 'cubic-bezier(.2, .6, .3, 1)', fill: 'forwards' }),
      imagesReady,
    ]);
    clearTimeout(loadingHint);
    view.hint.textContent = '';

    const stackEls = pack.map((card, index) => {
      const charged = Boolean(CHARGE_HINTS[OPP.Cards.tierOf(card)]);
      const element = flipCard(card, { faceUp: !charged, isNew: newIds.has(card.id) });
      element.classList.add('stack-card');
      element.style.setProperty('--i', index);
      element.style.zIndex = String(pack.length - index);
      return element;
    });
    const stack = h('div', { class: 'card-stack' }, stackEls);
    view.stage.prepend(stack);
    Sound.play('takeOut');
    await Promise.all([
      animate(body, [
        { transform: 'none', opacity: 1 },
        { transform: 'translateY(80%)', opacity: 0 },
      ], { duration: ms(650), easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'forwards' }),
      animate(stack, [
        { transform: 'translateY(12%) scale(.72)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ], { duration: ms(750), easing: EASE_BACK }),
    ]);
    packEl.remove();
    return stackEls;
  }

  async function revealRare(view, element, tier) {
    const strong = tier === 'secret';
    const amplitude = strong ? 7 : 4;
    const shake = [];
    for (let step = 0; step <= 8; step += 1) {
      const side = step % 2 ? 1 : -1;
      const power = step === 0 || step === 8 ? 0 : amplitude * (0.5 + step / 16);
      shake.push({ transform: `translate(${side * power}px, ${-power / 2}px) rotate(${side * power / 3}deg)` });
    }
    const shakeDuration = ms(strong ? 850 : 480);
    Sound.riser(shakeDuration / 1000);
    await animate(element, shake, { duration: shakeDuration, easing: 'ease-in' });
    view.overlay.classList.add(`fx-${tier}`);
    element.classList.add('is-face-up');
    Sound.play('shimmer');
    if (strong) {
      Sound.play('chime', { delay: 0.08 });
      Sound.sparkle();
    }
    flash(view, strong ? 0.95 : 0.6);
    vibrate(strong ? [40, 60, 90] : 35);
    await wait(ms(160));
    const rect = element.getBoundingClientRect();
    burst(view.fx, rect.left + rect.width / 2, rect.top + rect.height / 2, tier);
    element.classList.remove('is-charged');
    // Pulsation sur la face seulement : la carte peut déjà être glissée pendant l'effet.
    animate(element.querySelector('.flip-front .card'), [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)', offset: 0.4 },
      { transform: 'scale(1)' },
    ], { duration: ms(650), easing: 'ease-out' });
  }

  async function revealCards(view, stackEls, pack, newIds, skip) {
    for (let index = 0; index < pack.length; index += 1) {
      const element = stackEls[index];
      const card = pack[index];
      const tier = OPP.Cards.tierOf(card);
      view.counter.textContent = `${index + 1} / ${pack.length}`;
      if (!element.classList.contains('is-face-up')) {
        element.classList.add('is-charged', `charge-${tier}`);
        showCaption(view, null);
        view.hint.textContent = CHARGE_HINTS[tier];
        if ((await race(skip, (signal) => waitTap(element, signal))) === SKIP) return;
        await revealRare(view, element, tier);
      }
      showCaption(view, card, newIds.has(card.id));
      view.hint.textContent = index === pack.length - 1
        ? 'Glisse pour voir ton booster'
        : 'Glisse pour la carte suivante';
      const direction = await race(skip, (signal) => waitSwipe(element, signal));
      if (direction === SKIP) return;
      showCaption(view, null);
      await flyAway(element, direction);
      view.overlay.classList.remove('fx-super', 'fx-secret');
      element.remove();
      stackEls.slice(index + 1).forEach((next, offset) => next.style.setProperty('--i', offset));
    }
  }

  function showSummary(view, pack, newIds, showCard) {
    const newCount = pack.filter((card) => newIds.has(card.id)).length;
    const plural = newCount > 1 ? 's' : '';
    const again = h('button', { class: 'btn btn-primary btn-block', type: 'button' }, 'Ouvrir un autre booster');
    const done = h('button', { class: 'btn btn-ghost btn-block', type: 'button' }, 'Retour');
    view.overlay.classList.remove('fx-super', 'fx-secret');
    view.overlay.classList.add('is-summary');
    Sound.play('fan');
    view.counter.textContent = view.setName;
    showCaption(view, null);
    view.hint.textContent = '';
    view.stage.replaceChildren(h('div', { class: 'summary' },
      h('h2', { class: 'summary-title' }, 'Booster ouvert !'),
      h('p', { class: 'summary-subtitle' }, newCount
        ? `${newCount} nouvelle${plural} carte${plural} pour ta collection`
        : 'Aucune nouvelle carte cette fois'),
      h('div', { class: 'summary-grid' }, pack.map((card, index) => h('button', {
        class: 'summary-card',
        type: 'button',
        style: { '--i': index },
        'aria-label': card.name,
        onclick: () => showCard(card),
      }, cardFace(card, { isNew: newIds.has(card.id) })))),
      h('div', { class: 'summary-actions' }, again, done),
    ));
    return new Promise((resolve) => {
      again.addEventListener('click', () => resolve('again'), { once: true });
      done.addEventListener('click', () => resolve('close'), { once: true });
    });
  }

  // Joue l'ouverture complète et résout avec 'again' ou 'close'.
  async function play({ set, pack, newIds, featured, showCard }) {
    const skip = createSkip();
    const packEl = packElement(set, featured, pack.length);
    const view = {
      setName: set.name,
      counter: h('span', { class: 'opening-counter' }, set.name),
      stage: h('div', { class: 'opening-stage' }, packEl),
      caption: h('div', { class: 'opening-caption is-hidden', 'aria-live': 'polite' }),
      hint: h('p', { class: 'opening-hint' }, 'Glisse sur le booster pour le déchirer'),
      fx: h('div', { class: 'opening-fx', 'aria-hidden': 'true' }),
      flash: h('div', { class: 'opening-flash', 'aria-hidden': 'true' }),
    };
    view.overlay = h('div', {
      class: 'opening',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `Ouverture d'un booster ${set.name}`,
    },
      h('div', { class: 'opening-rays', 'aria-hidden': 'true' }),
      h('div', { class: 'opening-top' },
        view.counter,
        h('button', { class: 'opening-skip', type: 'button', onclick: skip.trigger }, 'Tout voir'),
      ),
      view.stage, view.caption, view.hint, view.fx, view.flash,
    );
    document.body.append(view.overlay);
    document.body.classList.add('is-locked');
    Sound.setDucked(true);
    Sound.play('packPickUp');
    const imagesReady = preload(pack.map((card) => card.image), 6000);

    await Promise.all([
      animate(view.overlay, [{ opacity: 0 }, { opacity: 1 }], { duration: ms(260) }),
      animate(packEl, [
        { transform: 'translateY(60px) scale(.6) rotate(-8deg)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ], { duration: ms(600), easing: EASE_BACK }),
    ]);
    if ((await race(skip, (signal) => tearGesture(packEl, signal))) !== SKIP) {
      const stackEls = await tearOpen(view, packEl, pack, newIds, imagesReady);
      await revealCards(view, stackEls, pack, newIds, skip);
    }
    await imagesReady;
    const choice = await showSummary(view, pack, newIds, showCard);
    await animate(view.overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: ms(220), fill: 'forwards' });
    view.overlay.remove();
    document.body.classList.remove('is-locked');
    Sound.setDucked(false);
    return choice;
  }

  OPP.Opening = { play };
})(globalThis);
