// Petits utilitaires DOM et animation partagés par l'interface.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const reducedMotion = root.matchMedia
    ? root.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  // h('button', { class: 'btn', onclick }, 'Texte', enfant…)
  function h(tag, props, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') element.className = value;
      else if (key === 'style') {
        for (const [name, styleValue] of Object.entries(value)) element.style.setProperty(name, styleValue);
      } else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? '' : value);
    }
    element.append(...children.flat(Infinity).filter((child) => child != null && child !== false));
    return element;
  }

  function svgIcon(paths) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = paths;
    return svg;
  }

  // Durée raccourcie quand l'utilisateur préfère réduire les animations.
  function ms(duration) {
    return reducedMotion.matches ? Math.min(duration, 1) : duration;
  }

  function wait(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  function animate(element, keyframes, options) {
    if (!element.animate) return Promise.resolve();
    return element.animate(keyframes, options).finished.catch(() => {});
  }

  OPP.Dom = { h, svgIcon, ms, wait, animate, reducedMotion };
})(globalThis);
