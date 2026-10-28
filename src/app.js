// Page de test : ouvrir des boosters OP-01 et suivre la collection.
(function (root) {
  const { OPP, document } = root;
  const set = OPP.sets['OP-01'];
  // Les box toppers ne sortent pas des boosters : ils ne comptent pas dans la collection.
  const collectible = set.cards.filter((card) => card.variant !== 'boxTopper');
  const storage = root.localStorage;
  const collection = OPP.Collection.load(storage);

  const packList = document.getElementById('pack');
  const countLabel = document.getElementById('collection-count');

  function renderCount() {
    const owned = collectible.filter((card) => collection[card.id]).length;
    countLabel.textContent = `Collection ${set.name} : ${owned} / ${collectible.length}`;
  }

  function renderCard(card) {
    const item = document.createElement('li');
    item.className = `card rarity-${card.rarity}${card.variant ? ' is-' + card.variant : ''}`;
    const image = document.createElement('img');
    image.src = card.image;
    image.alt = card.name;
    image.loading = 'lazy';
    const label = document.createElement('span');
    label.textContent = card.variant ? `${card.rarity} ✦` : card.rarity;
    item.append(image, label);
    return item;
  }

  document.getElementById('open-pack').addEventListener('click', () => {
    const pack = OPP.Booster.openPack('OP-01');
    OPP.Collection.add(collection, pack);
    OPP.Collection.save(storage, collection);
    packList.replaceChildren(...pack.map(renderCard));
    renderCount();
  });

  renderCount();
})(globalThis);
