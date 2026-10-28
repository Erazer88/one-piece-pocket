// Lecture de la musique d'ambiance et des bruitages.
// Les navigateurs mobiles n'autorisent le son qu'après un geste de l'utilisateur :
// chaque toucher relance le contexte audio et la musique si besoin.
(function (root) {
  const OPP = (root.OPP = root.OPP || {});
  const SETTINGS_KEY = 'opp.settings.v1';
  const GESTURE_EVENTS = ['touchend', 'click', 'keydown'];
  const AudioContextClass = root.AudioContext || root.webkitAudioContext;
  // Sur un fichier local, fetch et le routage Web Audio de la musique sont bloqués :
  // on se rabat sur de simples éléments <audio>.
  const canUseWebAudio = Boolean(AudioContextClass) && root.location.protocol !== 'file:';
  // Arpège do-mi-sol sur deux octaves.
  const SPARKLE_NOTES = [1046.5, 1318.5, 1568, 2093, 2637, 3136];

  const state = {
    storage: null,
    settings: { music: true, sfx: true },
    unlocked: false,
    context: null,
    sfxOutput: null,
    musicElement: null,
    musicGain: null,
    trackIndex: 0,
    ducked: false,
    listeners: new Set(),
  };
  const buffers = new Map();

  function loadSettings(storage) {
    try {
      const saved = JSON.parse(storage.getItem(SETTINGS_KEY) || '{}') || {};
      return { music: saved.music !== false, sfx: saved.sfx !== false };
    } catch (error) {
      return { music: true, sfx: true };
    }
  }

  function saveSettings() {
    try {
      state.storage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    } catch (error) {
      // Stockage indisponible : le réglage reste valable pour la session.
    }
  }

  function notify() {
    for (const listener of state.listeners) listener();
  }

  function ensureContext() {
    if (state.context || !canUseWebAudio) return state.context;
    try {
      state.context = new AudioContextClass();
      state.sfxOutput = state.context.createGain();
      state.sfxOutput.connect(state.context.destination);
    } catch (error) {
      state.context = null;
    }
    return state.context;
  }

  function loadBuffer(src) {
    if (!buffers.has(src)) {
      const promise = fetch(src)
        .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(src))))
        .then((data) => new Promise((resolve, reject) => state.context.decodeAudioData(data, resolve, reject)))
        .catch(() => null);
      buffers.set(src, promise);
    }
    return buffers.get(src);
  }

  function onGesture() {
    const context = ensureContext();
    if (context && context.state !== 'running') context.resume().catch(() => {});
    if (!state.unlocked) {
      state.unlocked = true;
      if (context) {
        for (const sound of Object.values(OPP.audio.sounds)) sound.src.forEach(loadBuffer);
      }
    }
    const element = state.musicElement;
    if (state.settings.music && (!element || element.paused)) startMusic();
  }

  // ---------- Bruitages ----------

  async function play(name, options = {}) {
    const sound = OPP.audio.sounds[name];
    if (!sound || !state.settings.sfx || !state.unlocked) return;
    const src = sound.src[Math.floor(Math.random() * sound.src.length)];
    const volume = sound.volume * (options.volume == null ? 1 : options.volume);
    const delay = options.delay || 0;
    const buffer = state.context ? await loadBuffer(src) : null;
    if (buffer) {
      const source = state.context.createBufferSource();
      const gain = state.context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = options.rate || 1;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(state.sfxOutput);
      source.start(state.context.currentTime + delay);
      return;
    }
    const element = new Audio(src);
    element.volume = Math.min(volume, 1);
    element.playbackRate = options.rate || 1;
    setTimeout(() => element.play().catch(() => {}), delay * 1000);
  }

  function synthReady() {
    return state.settings.sfx && state.unlocked && state.context && state.context.state === 'running';
  }

  function voice(type, from, to, start, duration, peak, attack) {
    const { context } = state;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(state.sfxOutput);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  // Montée de tension pendant que la carte rare tremble.
  function riser(seconds) {
    if (!synthReady() || seconds < 0.1) return;
    const now = state.context.currentTime;
    voice('triangle', 196, 784, now, seconds + 0.1, 0.07, seconds * 0.95);
    voice('sine', 392, 1568, now, seconds + 0.1, 0.04, seconds * 0.95);
  }

  // Arpège scintillant pour les cartes exceptionnelles.
  function sparkle() {
    if (!synthReady()) return;
    const now = state.context.currentTime;
    SPARKLE_NOTES.forEach((frequency, index) => {
      const start = now + index * 0.07;
      voice('sine', frequency, frequency, start, 0.7, 0.06, 0.005);
      voice('triangle', frequency * 2, frequency * 2, start, 0.4, 0.015, 0.005);
    });
  }

  // ---------- Musique ----------

  function track() {
    return OPP.audio.music[state.trackIndex];
  }

  function targetVolume() {
    return state.ducked ? OPP.audio.duckedVolume : OPP.audio.musicVolume;
  }

  function applyMusicVolume() {
    if (state.musicGain) {
      const now = state.context.currentTime;
      state.musicGain.gain.cancelScheduledValues(now);
      state.musicGain.gain.setTargetAtTime(targetVolume(), now, 0.4);
    } else if (state.musicElement) {
      state.musicElement.volume = targetVolume();
    }
  }

  function createMusicElement() {
    const element = new Audio();
    element.preload = 'auto';
    element.addEventListener('ended', nextTrack);
    // Passer par Web Audio permet de régler le volume sur iPhone, où l'élément l'ignore.
    if (state.context) {
      // RawGithack redirige les MP3 vers raw.githubusercontent.com : sans requête CORS,
      // Web Audio rendrait la musique muette.
      element.crossOrigin = 'anonymous';
      try {
        const source = state.context.createMediaElementSource(element);
        state.musicGain = state.context.createGain();
        state.musicGain.gain.value = 0;
        source.connect(state.musicGain);
        state.musicGain.connect(state.context.destination);
      } catch (error) {
        state.musicGain = null;
      }
    }
    return element;
  }

  function startMusic() {
    if (!state.unlocked || !state.settings.music || document.hidden) return;
    if (!state.musicElement) {
      state.musicElement = createMusicElement();
      state.trackIndex = Math.floor(Math.random() * OPP.audio.music.length);
      state.musicElement.src = track().src;
    }
    state.musicElement.play().catch(() => {});
    applyMusicVolume();
    notify();
  }

  function nextTrack() {
    if (!state.musicElement) return;
    state.trackIndex = (state.trackIndex + 1) % OPP.audio.music.length;
    state.musicElement.src = track().src;
    if (state.settings.music && !document.hidden) state.musicElement.play().catch(() => {});
    notify();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (state.musicElement) state.musicElement.pause();
      if (state.context && state.context.state === 'running') state.context.suspend().catch(() => {});
    } else if (state.unlocked) {
      if (state.context) state.context.resume().catch(() => {});
      if (state.settings.music && state.musicElement) state.musicElement.play().catch(() => {});
    }
  }

  // ---------- Interface publique ----------

  function init(storage) {
    state.storage = storage;
    state.settings = loadSettings(storage);
    for (const type of GESTURE_EVENTS) document.addEventListener(type, onGesture, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // Baisse la musique pendant l'ouverture d'un booster.
  function setDucked(ducked) {
    state.ducked = ducked;
    applyMusicVolume();
  }

  function setMusicEnabled(enabled) {
    state.settings.music = enabled;
    saveSettings();
    if (enabled) startMusic();
    else if (state.musicElement) state.musicElement.pause();
    notify();
  }

  function setSfxEnabled(enabled) {
    state.settings.sfx = enabled;
    saveSettings();
    notify();
  }

  function settings() {
    return { ...state.settings };
  }

  function currentTrack() {
    return state.musicElement ? track() : null;
  }

  function subscribe(listener) {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  }

  OPP.Sound = {
    init,
    play,
    riser,
    sparkle,
    setDucked,
    setMusicEnabled,
    setSfxEnabled,
    settings,
    currentTrack,
    nextTrack,
    subscribe,
  };
})(globalThis);
