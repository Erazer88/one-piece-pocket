// Introduction à l'ouverture de l'appli : « par amour, pour mini », puis passage au menu
// par un cercle qui se referme sur le cœur. Le premier toucher lance aussi la musique.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const { h, animate, wait, ms } = OPP.Dom;

  const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09'
    + 'C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  const BUBBLE_COUNT = 14;

  function heartIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'intro-heart');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<path d="${HEART}" pathLength="1"/>`;
    return svg;
  }

  // Bulles qui remontent ; positions et vitesses réparties sans hasard.
  function bubbles() {
    return Array.from({ length: BUBBLE_COUNT }, (_, index) => h('span', {
      class: 'intro-bubble',
      style: {
        '--x': `${(index * 37) % 100}%`,
        '--size': `${6 + ((index * 7) % 18)}px`,
        '--delay': `${-((index * 1.3) % 9)}s`,
        '--duration': `${8 + ((index * 5) % 7)}s`,
      },
    }));
  }

  function reveal(element, delay) {
    return animate(element, [
      { opacity: 0, transform: 'translateY(14px)', filter: 'blur(8px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0)' },
    ], { duration: ms(1100), delay: ms(delay), easing: 'cubic-bezier(.2, .7, .2, 1)', fill: 'both' });
  }

  function show() {
    const logo = h('img', { class: 'intro-logo', src: 'assets/icon.svg', alt: '', width: '72', height: '72' });
    const line = h('p', { class: 'intro-line' }, 'par amour,');
    const name = h('p', { class: 'intro-name' }, 'pour mini');
    const heart = heartIcon();
    const prompt = h('p', { class: 'intro-prompt' }, 'Touche l\'écran');
    const overlay = h('div', { class: 'intro', role: 'button', tabindex: '0', 'aria-label': 'Commencer' },
      h('div', { class: 'intro-sea', 'aria-hidden': 'true' }, bubbles()),
      h('div', { class: 'intro-content' }, logo, line, name, heart),
      prompt,
    );
    let started = false;
    let skip;
    const skipped = new Promise((resolve) => { skip = resolve; });

    async function sequence() {
      animate(prompt, [{ opacity: 1 }, { opacity: 0 }], { duration: ms(300), fill: 'forwards' });
      await Promise.all([reveal(line, 150), reveal(name, 1000)]);
      heart.classList.add('is-drawing');
      await wait(ms(2300));
    }

    // Le cercle se referme sur le cœur et laisse apparaître le menu.
    async function close() {
      const rect = heart.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, root.innerWidth - x), Math.max(y, root.innerHeight - y));
      const behind = [...document.querySelectorAll('.app, .login-screen')];
      OPP.Sound.play('shimmer');
      await Promise.all([
        animate(overlay, [
          { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
          { clipPath: `circle(0px at ${x}px ${y}px)` },
        ], { duration: ms(950), easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' }),
        ...behind.map((element) => animate(element, [
          { transform: 'scale(1.06)', opacity: 0.4 },
          { transform: 'none', opacity: 1 },
        ], { duration: ms(1100), easing: 'cubic-bezier(.2, .7, .2, 1)' })),
      ]);
      overlay.remove();
    }

    async function start() {
      if (started) {
        skip();
        return;
      }
      started = true;
      await Promise.race([sequence(), skipped]);
      await close();
    }

    overlay.addEventListener('click', start);
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        start();
      }
    });
    document.body.append(overlay);
    overlay.focus({ preventScroll: true });
  }

  OPP.Intro = { show };
})(globalThis);
