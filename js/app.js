var geoWatchId = null;
var mediaRecorder = null;
var recordingChapter = null;
var UNLOCK_KM = 25; // proximity that "unlocks" a chapter and earns its stamp

/* ── Visited chapters (drives GPS-locked unlock + passport stamps) ───────── */

function getVisited() {
  var raw = localStorage.getItem('visitedChapters');
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

function markVisited(id) {
  var v = getVisited();
  if (v.indexOf(id) === -1) {
    v.push(id);
    localStorage.setItem('visitedChapters', JSON.stringify(v));
    return true; // newly visited
  }
  return false;
}

function isUnlocked(id) {
  if (Settings.getPlayMode() === 'free') return true;
  return getVisited().indexOf(id) !== -1;
}

/* ── Per-chapter text memories (notes, ratings, moods) ───────────────────── */

function getText(prefix, id) { return localStorage.getItem(prefix + ':' + id) || ''; }
function setText(prefix, id, val) { localStorage.setItem(prefix + ':' + id, val); }

/* ── Game (trivia) ───────────────────────────────────────────────────────── */

function initGame() {
  var container = document.getElementById('trivia-container');
  if (!container) return;

  var html = '<div id="turn-banner" class="turn-banner"></div>';

  storyContent.milestones.forEach(function (milestone, mIdx) {
    var unlocked = isUnlocked(milestone.id);
    html += '<section class="trivia-chapter' + (unlocked ? '' : ' locked') + '">';
    html += '<h2>' + escapeHtml(milestone.title) + '</h2>';

    if (!unlocked) {
      html += '<p class="locked-note">🔒 Reach this chapter on the highway to unlock its story and trivia.</p>';
      html += '</section>';
      return;
    }

    html += '<p class="chapter-story">' + escapeHtml(milestone.story) +
      ' <button type="button" class="listen-btn" data-speak="' + escapeHtml(milestone.story) +
      '" aria-label="Listen to the story">🔊</button></p>';

    // French phrase card — builds anticipation as you near Quebec.
    if (milestone.frenchPhrase) {
      html += '<div class="phrase-card">' +
        '<span class="phrase-fr">' + escapeHtml(milestone.frenchPhrase.phrase) + '</span>' +
        '<span class="phrase-en">' + escapeHtml(milestone.frenchPhrase.translation) + '</span>' +
        '<button type="button" class="listen-btn" data-speak-fr="' + escapeHtml(milestone.frenchPhrase.phrase) +
        '" aria-label="Listen in French">🔊</button>' +
      '</div>';
    }

    milestone.trivia.forEach(function (q, tIdx) {
      var qKey = 'q-' + mIdx + '-' + tIdx;
      html += '<div class="question-block" id="' + qKey + '">';
      html += '<p class="question-text">' + escapeHtml(q.question) +
        ' <button type="button" class="listen-btn" data-speak="' + escapeHtml(q.question) +
        '" aria-label="Listen to the question">🔊</button></p>';
      html += '<div class="answer-buttons">';
      q.options.forEach(function (opt, oIdx) {
        html += '<button class="btn btn-answer"' +
          ' onclick="checkAnswer(' + mIdx + ',' + tIdx + ',' + oIdx + ')">' +
          escapeHtml(opt) + '</button>';
      });
      html += '</div>';
      html += '<p class="fact hidden" aria-live="polite">' + escapeHtml(q.fact) + '</p>';
      html += '</div>';
    });

    html += '</section>';
  });

  container.innerHTML = html;
  bindListenButtons(container);
  updateTurnBanner();
}

function updateTurnBanner() {
  var banner = document.getElementById('turn-banner');
  if (!banner) return;
  var players = Players.getPlayers();
  if (players.length < 2) { banner.textContent = ''; banner.hidden = true; return; }
  var active = Players.getActivePlayer();
  banner.hidden = false;
  banner.textContent = '✋ ' + (active ? active.name : 'Player 1') + "'s turn — pass the phone!";
}

function checkAnswer(milestoneIndex, triviaIndex, selectedIndex) {
  var qKey = 'q-' + milestoneIndex + '-' + triviaIndex;
  var block = document.getElementById(qKey);
  if (!block) return;

  var question = storyContent.milestones[milestoneIndex].trivia[triviaIndex];
  var buttons = block.querySelectorAll('.btn-answer');

  buttons.forEach(function (btn) { btn.disabled = true; });

  if (selectedIndex === question.answer) {
    buttons[selectedIndex].classList.add('correct');
    Players.awardActive(1);
  } else {
    buttons[selectedIndex].classList.add('incorrect');
    buttons[question.answer].classList.add('correct');
  }

  var factEl = block.querySelector('.fact');
  if (factEl) factEl.classList.remove('hidden');

  // Pass the phone to the next player.
  Players.rotateTurn();
  updateTurnBanner();
}

/* ── Map / GPS ───────────────────────────────────────────────────────────── */

function renderMilestoneCards() {
  var container = document.getElementById('map-container');
  if (!container) return;

  var visited = getVisited();
  var html = '';
  storyContent.milestones.forEach(function (milestone) {
    var isVisited = visited.indexOf(milestone.id) !== -1;
    html += '<article class="milestone-card' + (isVisited ? ' visited' : '') +
      '" data-milestone-id="' + milestone.id + '">';
    html += '<div class="card-head">' +
      '<h2>' + escapeHtml(milestone.title) + '</h2>' +
      '<span class="stamp" aria-hidden="true">✓ Visited</span>' +
    '</div>';
    html += '<p class="card-story">' + escapeHtml(milestone.story) + '</p>';

    // Memory tools
    html += '<div class="memory-tools">';
    // Photo
    html += '<label class="mem-photo">📷 Photo' +
      '<input type="file" accept="image/*" capture="environment" class="photo-input" data-chapter="' + milestone.id + '">' +
      '</label>';
    html += '<img class="photo-thumb" data-chapter="' + milestone.id + '" alt="" hidden>';
    // Voice memo
    html += '<button type="button" class="mem-record" data-chapter="' + milestone.id + '">🎤 Record memo</button>';
    html += '<audio class="memo-audio" data-chapter="' + milestone.id + '" controls hidden></audio>';
    // Note
    html += '<textarea class="mem-note" data-chapter="' + milestone.id + '" placeholder="Write a memory…" rows="2">' +
      escapeHtml(getText('note', milestone.id)) + '</textarea>';
    // Rating
    html += '<div class="mem-rating" data-chapter="' + milestone.id + '" aria-label="Rate this stop">' + ratingStars(milestone.id) + '</div>';
    // Mood
    html += '<div class="mem-mood" data-chapter="' + milestone.id + '">' + moodButtons(milestone.id) + '</div>';
    html += '</div>';

    html += '</article>';
  });

  container.innerHTML = html;
  bindMemoryTools(container);
}

function ratingStars(id) {
  var current = parseInt(getText('rating', id) || '0', 10);
  var out = '';
  for (var i = 1; i <= 5; i++) {
    out += '<button type="button" class="star' + (i <= current ? ' on' : '') +
      '" data-chapter="' + id + '" data-value="' + i + '" aria-label="' + i + ' stars">★</button>';
  }
  return out;
}

function moodButtons(id) {
  var moods = ['😄', '😐', '😴', '🤩', '🤢'];
  var current = getText('mood', id);
  return moods.map(function (m) {
    return '<button type="button" class="mood' + (m === current ? ' on' : '') +
      '" data-chapter="' + id + '" data-mood="' + m + '">' + m + '</button>';
  }).join('');
}

function bindMemoryTools(container) {
  // Photos
  container.querySelectorAll('.photo-input').forEach(function (input) {
    var id = input.getAttribute('data-chapter');
    var thumb = container.querySelector('.photo-thumb[data-chapter="' + id + '"]');
    MediaStore.getMedia(id + ':photo').then(function (blob) {
      if (blob) { thumb.src = URL.createObjectURL(blob); thumb.hidden = false; }
    }).catch(function () {});
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      MediaStore.saveMedia(id + ':photo', file).then(function () {
        thumb.src = URL.createObjectURL(file);
        thumb.hidden = false;
      });
    });
  });

  // Voice memos
  container.querySelectorAll('.mem-record').forEach(function (btn) {
    var id = btn.getAttribute('data-chapter');
    var audio = container.querySelector('.memo-audio[data-chapter="' + id + '"]');
    MediaStore.getMedia(id + ':audio').then(function (blob) {
      if (blob) { audio.src = URL.createObjectURL(blob); audio.hidden = false; }
    }).catch(function () {});
    btn.addEventListener('click', function () { toggleRecording(id, btn, audio); });
  });

  // Notes
  container.querySelectorAll('.mem-note').forEach(function (ta) {
    var id = ta.getAttribute('data-chapter');
    ta.addEventListener('input', function () { setText('note', id, ta.value); });
  });

  // Ratings
  container.querySelectorAll('.star').forEach(function (star) {
    star.addEventListener('click', function () {
      var id = star.getAttribute('data-chapter');
      setText('rating', id, star.getAttribute('data-value'));
      var group = star.parentNode;
      group.innerHTML = ratingStars(id);
      bindRatingGroup(group);
    });
  });

  // Moods
  container.querySelectorAll('.mood').forEach(function (m) {
    m.addEventListener('click', function () {
      var id = m.getAttribute('data-chapter');
      setText('mood', id, m.getAttribute('data-mood'));
      var group = m.parentNode;
      group.innerHTML = moodButtons(id);
      bindMoodGroup(group);
    });
  });
}

function bindRatingGroup(group) {
  group.querySelectorAll('.star').forEach(function (star) {
    star.addEventListener('click', function () {
      var id = star.getAttribute('data-chapter');
      setText('rating', id, star.getAttribute('data-value'));
      group.innerHTML = ratingStars(id);
      bindRatingGroup(group);
    });
  });
}

function bindMoodGroup(group) {
  group.querySelectorAll('.mood').forEach(function (m) {
    m.addEventListener('click', function () {
      var id = m.getAttribute('data-chapter');
      setText('mood', id, m.getAttribute('data-mood'));
      group.innerHTML = moodButtons(id);
      bindMoodGroup(group);
    });
  });
}

function toggleRecording(id, btn, audio) {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    btn.textContent = '🎤 Not supported';
    return;
  }
  if (mediaRecorder && recordingChapter === id) {
    mediaRecorder.stop();
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    var chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    recordingChapter = id;
    btn.textContent = '⏹ Stop';
    btn.classList.add('recording');
    mediaRecorder.ondataavailable = function (e) { chunks.push(e.data); };
    mediaRecorder.onstop = function () {
      var blob = new Blob(chunks, { type: 'audio/webm' });
      MediaStore.saveMedia(id + ':audio', blob).then(function () {
        audio.src = URL.createObjectURL(blob);
        audio.hidden = false;
      });
      stream.getTracks().forEach(function (t) { t.stop(); });
      btn.textContent = '🎤 Record memo';
      btn.classList.remove('recording');
      mediaRecorder = null;
      recordingChapter = null;
    };
    mediaRecorder.start();
  }).catch(function () {
    btn.textContent = '🎤 Mic denied';
  });
}

function initMap() {
  renderMilestoneCards();

  var statusEl = document.getElementById('geo-status');

  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = 'Geolocation is not supported by your browser.';
    return;
  }

  if (statusEl) statusEl.textContent = 'Locating your position…';

  geoWatchId = navigator.geolocation.watchPosition(
    onPositionUpdate,
    onGeoError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

function onPositionUpdate(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var speed = position.coords.speed; // m/s or null

  var statusEl = document.getElementById('geo-status');
  var coordsEl = document.getElementById('coords-display');

  if (statusEl) statusEl.textContent = 'Position found.';
  if (coordsEl) coordsEl.textContent = 'Lat ' + lat.toFixed(5) + ' · Lng ' + lng.toFixed(5);

  var nearest = findNearestMilestone(lat, lng);
  if (nearest) {
    var distKm = haversineDistance(lat, lng, nearest.lat, nearest.lng);
    updateProgress(nearest, distKm, speed);
    // Unlock chapter + earn stamp when close enough.
    if (distKm <= UNLOCK_KM && markVisited(nearest.id)) {
      var card = document.querySelector('.milestone-card[data-milestone-id="' + nearest.id + '"]');
      if (card) card.classList.add('visited');
    }
  }
}

function updateProgress(nearest, distKm, speed) {
  var bar = document.getElementById('progress-fill');
  var label = document.getElementById('progress-label');
  var eta = document.getElementById('eta-label');

  if (bar) {
    var pct = Math.max(0, Math.min(100, (nearest.routeKm / storyContent.totalKm) * 100));
    bar.style.width = pct.toFixed(0) + '%';
  }
  if (label) {
    label.textContent = 'Nearest: ' + nearest.title + ' · ' + distKm.toFixed(1) + ' km away';
  }
  if (eta) {
    var speedKmh = (speed && speed > 0.5) ? speed * 3.6 : 100; // assume 100 km/h if unknown
    var minutes = (distKm / speedKmh) * 60;
    eta.textContent = '⏱ About ' + Math.max(1, Math.round(minutes)) + ' min at ' + Math.round(speedKmh) + ' km/h';
  }
}

function onGeoError(error) {
  var statusEl = document.getElementById('geo-status');
  if (!statusEl) return;
  var messages = {
    1: 'Location access was denied. Enable location permissions to track your journey.',
    2: 'Your position is currently unavailable. Try again outside.',
    3: 'Location request timed out. Check your signal and try again.'
  };
  statusEl.textContent = messages[error.code] || 'An unknown location error occurred.';
}

function findNearestMilestone(lat, lng) {
  var nearest = null;
  var minDist = Infinity;

  storyContent.milestones.forEach(function (milestone) {
    var d = haversineDistance(lat, lng, milestone.lat, milestone.lng);
    if (d < minDist) { minDist = d; nearest = milestone; }
  });

  var cards = document.querySelectorAll('.milestone-card');
  cards.forEach(function (card) {
    card.classList.remove('nearest');
    if (nearest && card.getAttribute('data-milestone-id') === nearest.id) {
      card.classList.add('nearest');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  return nearest;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = toRad(lat2 - lat1);
  var dLng = toRad(lng2 - lng1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

/* ── Narration buttons ───────────────────────────────────────────────────── */

function bindListenButtons(scope) {
  scope.querySelectorAll('.listen-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.hasAttribute('data-speak-fr')) {
        Settings.speak(btn.getAttribute('data-speak-fr'), 'fr');
      } else {
        Settings.speak(btn.getAttribute('data-speak'), 'en');
      }
    });
  });
}

/* ── Shared utility ──────────────────────────────────────────────────────── */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Init ────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  Settings.init();
  Players.renderScoreBadge();

  if (document.getElementById('map-container')) initMap();
  if (document.getElementById('trivia-container')) initGame();

  // Re-render the trivia list when play mode / language changes so locks update.
  document.addEventListener('settingschange', function () {
    if (document.getElementById('trivia-container')) initGame();
  });

  // Register the service worker for offline use through 401 dead zones.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(function () {});
  }
});
