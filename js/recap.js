/* recap.js — end-of-trip scrapbook. Aggregates scores, passport stamps,
 * photos (IndexedDB), written memories, and the cross-trip leaderboard, and
 * lets the family share a summary image. Reuses globals from app.js
 * (getVisited, getText) and the Players / MediaStore / storyContent modules. */

function chapterTitle(id) {
  var m = storyContent.milestones.filter(function (x) { return x.id === id; })[0];
  return m ? m.title : id;
}

function renderScores() {
  var el = document.getElementById('recap-scores');
  var players = Players.getPlayers();
  var total = Players.getTotalScore();
  var front = Players.getTeamScore('front');
  var back = Players.getTeamScore('back');

  var html = '<h2>The Scoreboard</h2>';
  html += '<p style="font-size:1.4rem;font-weight:bold;color:var(--gold-dark);">Trip total: ' + total + ' points</p>';
  html += '<p style="color:var(--ink-mid);margin-bottom:0.6rem;">Front seat ' + front + ' &nbsp;·&nbsp; Back seat ' + back + '</p>';
  html += '<ul class="leaderboard-list">';
  players.slice().sort(function (a, b) { return b.score - a.score; }).forEach(function (p) {
    html += '<li><span>👤 ' + escapeHtml(p.name) + ' <small>(' + p.team + ')</small></span><strong>' + p.score + '</strong></li>';
  });
  html += '</ul>';
  el.innerHTML = html;
}

function renderStamps() {
  var el = document.getElementById('recap-stamps');
  var visited = getVisited();
  var html = '<h2>Passport Stamps (' + visited.length + '/' + storyContent.milestones.length + ')</h2>';
  html += '<div class="stamp-grid">';
  storyContent.milestones.forEach(function (m) {
    var earned = visited.indexOf(m.id) !== -1;
    html += '<div class="stamp-cell' + (earned ? ' earned' : '') + '">' +
      '<span class="seal">' + (earned ? '🅥' : '·') + '</span>' +
      escapeHtml(m.title) +
    '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function renderPhotos() {
  var el = document.getElementById('recap-photos');
  el.innerHTML = '<h2>Photo Journal</h2><p style="color:var(--ink-mid);">Loading photos…</p>';
  MediaStore.getAllMedia().then(function (all) {
    var keys = Object.keys(all).filter(function (k) { return k.indexOf(':photo') !== -1; });
    if (!keys.length) {
      el.innerHTML = '<h2>Photo Journal</h2><p style="color:var(--ink-mid);">No photos yet — snap one at each stop on the Map page.</p>';
      return;
    }
    var html = '<h2>Photo Journal</h2><div class="photo-gallery">';
    keys.forEach(function (k) {
      var id = k.split(':')[0];
      var url = URL.createObjectURL(all[k]);
      html += '<figure><img src="' + url + '" alt="' + escapeHtml(chapterTitle(id)) + '">' +
        '<figcaption>' + escapeHtml(chapterTitle(id)) + '</figcaption></figure>';
    });
    html += '</div>';
    el.innerHTML = html;
  }).catch(function () {
    el.innerHTML = '<h2>Photo Journal</h2><p style="color:var(--ink-mid);">Photos unavailable in this browser.</p>';
  });
}

function renderMemories() {
  var el = document.getElementById('recap-memories');
  var html = '<h2>Written Memories</h2>';
  var any = false;
  storyContent.milestones.forEach(function (m) {
    var note = getText('note', m.id);
    var mood = getText('mood', m.id);
    var rating = parseInt(getText('rating', m.id) || '0', 10);
    if (!note && !mood && !rating) return;
    any = true;
    html += '<div style="margin-bottom:0.9rem;padding-bottom:0.7rem;border-bottom:1px solid var(--parchment-dark);">';
    html += '<strong>' + escapeHtml(m.title) + '</strong> ';
    if (mood) html += '<span>' + mood + '</span> ';
    if (rating) html += '<span style="color:var(--gold);">' + Array(rating + 1).join('★') + '</span>';
    if (note) html += '<p style="font-style:italic;color:var(--ink-mid);margin-top:0.2rem;">“' + escapeHtml(note) + '”</p>';
    html += '</div>';
  });
  if (!any) html += '<p style="color:var(--ink-mid);">No notes yet — jot memories on the Map page as you travel.</p>';
  el.innerHTML = html;
}

function renderLeaderboard() {
  var el = document.getElementById('recap-leaderboard');
  var board = Players.getLeaderboard();
  var html = '<h2>All-Time Leaderboard</h2>';
  if (!board.length) {
    html += '<p style="color:var(--ink-mid);">Finish a trip to record your scores here.</p>';
  } else {
    html += '<ul class="leaderboard-list">';
    board.slice(0, 10).forEach(function (e, i) {
      html += '<li><span>' + (i + 1) + '. ' + escapeHtml(e.name) + ' <small>' + e.date + '</small></span><strong>' + e.score + '</strong></li>';
    });
    html += '</ul>';
  }
  el.innerHTML = html;
}

/* ── Share as image ──────────────────────────────────────────────────────── */

function buildShareCanvas() {
  var canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fdf5e6';
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 16;
  ctx.strokeRect(40, 40, 1000, 1000);

  ctx.fillStyle = '#2c1e16';
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('Highway 401', 540, 200);
  ctx.fillText('Storybook Road Trip', 540, 280);

  ctx.fillStyle = '#a8882a';
  ctx.font = 'italic 40px Georgia, serif';
  ctx.fillText('Toronto → Montreal', 540, 360);

  var visited = getVisited();
  ctx.fillStyle = '#2c1e16';
  ctx.font = 'bold 120px Georgia, serif';
  ctx.fillText(Players.getTotalScore() + ' pts', 540, 560);

  ctx.font = '44px Georgia, serif';
  ctx.fillText(visited.length + ' of ' + storyContent.milestones.length + ' chapters reached', 540, 660);

  var players = Players.getPlayers().slice().sort(function (a, b) { return b.score - a.score; });
  ctx.font = '38px Georgia, serif';
  ctx.fillStyle = '#5a3e2b';
  players.slice(0, 4).forEach(function (p, i) {
    ctx.fillText('👤 ' + p.name + ' — ' + p.score, 540, 760 + i * 60);
  });

  return canvas;
}

function shareRecap() {
  var canvas = buildShareCanvas();
  canvas.toBlob(function (blob) {
    if (!blob) return;
    var file = new File([blob], 'highway-401-recap.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Our Highway 401 Road Trip' }).catch(function () {});
    } else {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'highway-401-recap.png';
      a.click();
    }
  }, 'image/png');
}

/* ── Init ────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('recap-scores')) return;
  renderScores();
  renderStamps();
  renderPhotos();
  renderMemories();
  renderLeaderboard();

  document.getElementById('share-btn').addEventListener('click', shareRecap);
  document.getElementById('finish-btn').addEventListener('click', function () {
    Players.commitTripToLeaderboard();
    renderLeaderboard();
    this.textContent = '✓ Saved to leaderboard';
  });
});
