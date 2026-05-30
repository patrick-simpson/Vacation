/* players.js — family multiplayer: profiles, turns, teams, leaderboard.
 * Replaces the v1 single `storybookScore` integer. On first load it migrates
 * any existing score into a default "Player 1". Owns the score badge UI on
 * every page (active player name + score, tap to switch / manage). */

var Players = (function () {
  var KEY_PLAYERS = 'storybookPlayers';
  var KEY_ACTIVE = 'storybookActivePlayer';
  var KEY_BEST = 'storybookBestScores';

  function uid() {
    return 'p' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function load() {
    var raw = localStorage.getItem(KEY_PLAYERS);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through to migrate */ }
    }
    // Migrate v1 single score into a default player.
    var legacy = parseInt(localStorage.getItem('storybookScore') || '0', 10);
    var players = [{ id: uid(), name: 'Player 1', team: 'front', score: legacy }];
    save(players);
    setActivePlayer(players[0].id);
    return players;
  }

  function save(players) {
    localStorage.setItem(KEY_PLAYERS, JSON.stringify(players));
  }

  function getPlayers() {
    return load();
  }

  function getActivePlayerId() {
    var id = localStorage.getItem(KEY_ACTIVE);
    var players = load();
    if (!id || !players.some(function (p) { return p.id === id; })) {
      id = players.length ? players[0].id : null;
      if (id) localStorage.setItem(KEY_ACTIVE, id);
    }
    return id;
  }

  function setActivePlayer(id) {
    localStorage.setItem(KEY_ACTIVE, id);
    renderScoreBadge();
  }

  function getActivePlayer() {
    var id = getActivePlayerId();
    return load().filter(function (p) { return p.id === id; })[0] || null;
  }

  function addPlayer(name, team) {
    var players = load();
    var player = { id: uid(), name: name || ('Player ' + (players.length + 1)), team: team || 'front', score: 0 };
    players.push(player);
    save(players);
    renderScoreBadge();
    return player;
  }

  function removePlayer(id) {
    var players = load().filter(function (p) { return p.id !== id; });
    if (!players.length) players.push({ id: uid(), name: 'Player 1', team: 'front', score: 0 });
    save(players);
    if (getActivePlayerId() === id) setActivePlayer(players[0].id);
    renderScoreBadge();
  }

  function awardActive(points) {
    var players = load();
    var id = getActivePlayerId();
    players.forEach(function (p) { if (p.id === id) p.score += points; });
    save(players);
    renderScoreBadge();
  }

  // Advance the active player to the next in the list (pass-the-phone).
  function rotateTurn() {
    var players = load();
    if (players.length < 2) return getActivePlayer();
    var id = getActivePlayerId();
    var idx = 0;
    players.forEach(function (p, i) { if (p.id === id) idx = i; });
    var next = players[(idx + 1) % players.length];
    setActivePlayer(next.id);
    return next;
  }

  function getTotalScore() {
    return load().reduce(function (sum, p) { return sum + p.score; }, 0);
  }

  function getTeamScore(team) {
    return load().filter(function (p) { return p.team === team; })
                 .reduce(function (sum, p) { return sum + p.score; }, 0);
  }

  // Leaderboard persists best individual scores across trips.
  function getLeaderboard() {
    var raw = localStorage.getItem(KEY_BEST);
    try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }

  function commitTripToLeaderboard() {
    var board = getLeaderboard();
    var today = new Date().toISOString().slice(0, 10);
    load().forEach(function (p) {
      board.push({ name: p.name, score: p.score, date: today });
    });
    board.sort(function (a, b) { return b.score - a.score; });
    localStorage.setItem(KEY_BEST, JSON.stringify(board.slice(0, 20)));
    return board;
  }

  function resetScores() {
    var players = load();
    players.forEach(function (p) { p.score = 0; });
    save(players);
    renderScoreBadge();
  }

  /* ── Score badge UI (rendered on every page) ──────────────────────────── */

  function renderScoreBadge() {
    var el = document.getElementById('score-display');
    if (!el) return;
    var active = getActivePlayer();
    var label = active ? active.name : 'Player 1';
    var score = active ? active.score : 0;
    el.innerHTML =
      '<button class="badge-toggle" type="button" aria-haspopup="true" aria-expanded="false">' +
        '<span class="badge-name">👤 ' + escapeForAttr(label) + '</span>' +
        '<span class="badge-score">' + score + '</span>' +
      '</button>' +
      '<div class="badge-menu" hidden></div>';

    var toggle = el.querySelector('.badge-toggle');
    var menu = el.querySelector('.badge-menu');
    toggle.addEventListener('click', function () {
      var open = menu.hasAttribute('hidden');
      if (open) {
        buildMenu(menu);
        menu.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        menu.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function buildMenu(menu) {
    var players = load();
    var activeId = getActivePlayerId();
    var html = '<p class="badge-menu-title">Whose turn?</p>';
    players.forEach(function (p) {
      html += '<div class="badge-player' + (p.id === activeId ? ' is-active' : '') + '">' +
        '<button type="button" class="badge-pick" data-id="' + p.id + '">' +
          escapeForAttr(p.name) + ' <small>(' + p.team + ')</small> · ' + p.score +
        '</button>' +
        '<button type="button" class="badge-remove" data-id="' + p.id + '" aria-label="Remove ' + escapeForAttr(p.name) + '">×</button>' +
      '</div>';
    });
    html +=
      '<div class="badge-add">' +
        '<input type="text" class="badge-add-name" placeholder="Add player…" maxlength="16">' +
        '<select class="badge-add-team"><option value="front">Front</option><option value="back">Back</option></select>' +
        '<button type="button" class="badge-add-btn">Add</button>' +
      '</div>';
    menu.innerHTML = html;

    menu.querySelectorAll('.badge-pick').forEach(function (b) {
      b.addEventListener('click', function () {
        setActivePlayer(b.getAttribute('data-id'));
      });
    });
    menu.querySelectorAll('.badge-remove').forEach(function (b) {
      b.addEventListener('click', function () {
        removePlayer(b.getAttribute('data-id'));
      });
    });
    var addBtn = menu.querySelector('.badge-add-btn');
    addBtn.addEventListener('click', function () {
      var name = menu.querySelector('.badge-add-name').value.trim();
      var team = menu.querySelector('.badge-add-team').value;
      addPlayer(name, team);
    });
  }

  function escapeForAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    getPlayers: getPlayers,
    getActivePlayer: getActivePlayer,
    setActivePlayer: setActivePlayer,
    addPlayer: addPlayer,
    removePlayer: removePlayer,
    awardActive: awardActive,
    rotateTurn: rotateTurn,
    getTotalScore: getTotalScore,
    getTeamScore: getTeamScore,
    getLeaderboard: getLeaderboard,
    commitTripToLeaderboard: commitTripToLeaderboard,
    resetScores: resetScores,
    renderScoreBadge: renderScoreBadge
  };
})();
