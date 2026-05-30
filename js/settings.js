/* settings.js — shared ⚙ panel + preferences, injected into the nav on every
 * page. Handles night mode, large/dyslexia-friendly text, UI language, GPS vs
 * free play mode, and read-aloud narration (SpeechSynthesis). Preferences
 * persist in localStorage and are applied as body classes on load. */

var Settings = (function () {
  var KEY = 'storybookSettings';

  var DEFAULTS = { night: false, largeText: false, lang: 'en', playMode: 'free' };

  // Small UI string table. Elements with data-i18n="key" get their text set.
  var STRINGS = {
    en: {
      'nav.home': 'Home', 'nav.map': 'Map', 'nav.trivia': 'Trivia', 'nav.recap': 'Recap',
      'cover.begin': 'Begin the Journey',
      'cover.route': 'Toronto → Montreal',
      'settings.title': 'Settings',
      'settings.night': 'Night mode',
      'settings.largeText': 'Large, easy-read text',
      'settings.language': 'Language',
      'settings.playMode': 'Play mode',
      'settings.free': 'Free play', 'settings.gps': 'GPS-locked',
      'listen': '🔊 Listen'
    },
    fr: {
      'nav.home': 'Accueil', 'nav.map': 'Carte', 'nav.trivia': 'Quiz', 'nav.recap': 'Bilan',
      'cover.begin': 'Commencer le voyage',
      'cover.route': 'Toronto → Montréal',
      'settings.title': 'Réglages',
      'settings.night': 'Mode nuit',
      'settings.largeText': 'Texte grand et lisible',
      'settings.language': 'Langue',
      'settings.playMode': 'Mode de jeu',
      'settings.free': 'Jeu libre', 'settings.gps': 'Débloqué par GPS',
      'listen': '🔊 Écouter'
    }
  };

  function get() {
    var raw = localStorage.getItem(KEY);
    var s = DEFAULTS;
    if (raw) {
      try { s = Object.assign({}, DEFAULTS, JSON.parse(raw)); } catch (e) { s = DEFAULTS; }
    }
    return s;
  }

  function set(patch) {
    var s = Object.assign({}, get(), patch);
    localStorage.setItem(KEY, JSON.stringify(s));
    apply();
    document.dispatchEvent(new CustomEvent('settingschange', { detail: s }));
    return s;
  }

  function getLang() { return get().lang; }
  function getPlayMode() { return get().playMode; }

  function t(key) {
    var lang = getLang();
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  }

  function apply() {
    var s = get();
    document.body.classList.toggle('theme-night', s.night);
    document.body.classList.toggle('text-large', s.largeText);
    document.documentElement.lang = s.lang;
    applyI18n();
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
  }

  // Read text aloud. langOverride lets the French phrase card speak in fr-CA
  // even when the UI is in English.
  function speak(text, langOverride) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    var lang = langOverride || getLang();
    u.lang = lang === 'fr' ? 'fr-CA' : 'en-CA';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  /* ── Settings panel UI ────────────────────────────────────────────────── */

  function injectPanel() {
    var nav = document.querySelector('.main-nav');
    if (!nav || document.getElementById('settings-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'settings-btn';
    btn.type = 'button';
    btn.className = 'settings-btn';
    btn.setAttribute('aria-label', 'Settings');
    btn.setAttribute('aria-haspopup', 'true');
    btn.textContent = '⚙';
    nav.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.className = 'settings-panel';
    panel.setAttribute('hidden', '');
    document.body.appendChild(panel);

    btn.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) { buildPanel(panel); panel.removeAttribute('hidden'); }
      else { panel.setAttribute('hidden', ''); }
    });
  }

  function buildPanel(panel) {
    var s = get();
    panel.innerHTML =
      '<h2 data-i18n="settings.title">Settings</h2>' +
      row('night', s.night, t('settings.night')) +
      row('largeText', s.largeText, t('settings.largeText')) +
      '<label class="settings-row"><span>' + t('settings.language') + '</span>' +
        '<select id="set-lang">' +
          opt('en', 'English', s.lang) + opt('fr', 'Français', s.lang) +
        '</select></label>' +
      '<label class="settings-row"><span>' + t('settings.playMode') + '</span>' +
        '<select id="set-playmode">' +
          opt('free', t('settings.free'), s.playMode) +
          opt('gps', t('settings.gps'), s.playMode) +
        '</select></label>';

    panel.querySelector('#set-night').addEventListener('change', function (e) {
      set({ night: e.target.checked });
    });
    panel.querySelector('#set-largeText').addEventListener('change', function (e) {
      set({ largeText: e.target.checked });
    });
    panel.querySelector('#set-lang').addEventListener('change', function (e) {
      set({ lang: e.target.value });
      buildPanel(panel);
    });
    panel.querySelector('#set-playmode').addEventListener('change', function (e) {
      set({ playMode: e.target.value });
    });
  }

  function row(id, checked, label) {
    return '<label class="settings-row settings-toggle">' +
      '<span>' + label + '</span>' +
      '<input type="checkbox" id="set-' + id + '"' + (checked ? ' checked' : '') + '>' +
      '</label>';
  }

  function opt(value, label, current) {
    return '<option value="' + value + '"' + (value === current ? ' selected' : '') + '>' + label + '</option>';
  }

  function init() {
    injectPanel();
    apply();
  }

  return {
    init: init,
    get: get,
    set: set,
    getLang: getLang,
    getPlayMode: getPlayMode,
    t: t,
    speak: speak,
    applyI18n: applyI18n
  };
})();
