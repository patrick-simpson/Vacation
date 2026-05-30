var geoWatchId = null;

function getScore() {
  return parseInt(localStorage.getItem('storybookScore') || '0', 10);
}

function setScore(n) {
  localStorage.setItem('storybookScore', n);
  updateScoreDisplay();
}

function updateScoreDisplay() {
  var el = document.getElementById('score-display');
  if (el) {
    el.textContent = 'Score: ' + getScore();
  }
}

// ─── Game (trivia) ──────────────────────────────────────────────────────────

function initGame() {
  var container = document.getElementById('trivia-container');
  if (!container) return;

  var html = '';
  storyContent.milestones.forEach(function (milestone, mIdx) {
    html += '<section class="trivia-chapter">';
    html += '<h2>' + escapeHtml(milestone.title) + '</h2>';
    html += '<p class="chapter-story">' + escapeHtml(milestone.story) + '</p>';

    milestone.trivia.forEach(function (q, tIdx) {
      var qKey = 'q-' + mIdx + '-' + tIdx;
      html += '<div class="question-block" id="' + qKey + '">';
      html += '<p class="question-text">' + escapeHtml(q.question) + '</p>';
      html += '<div class="answer-buttons">';
      q.options.forEach(function (opt, oIdx) {
        html += '<button class="btn btn-answer"'
          + ' data-milestone="' + mIdx + '"'
          + ' data-trivia="' + tIdx + '"'
          + ' data-selected="' + oIdx + '"'
          + ' onclick="checkAnswer(' + mIdx + ',' + tIdx + ',' + oIdx + ')">'
          + escapeHtml(opt)
          + '</button>';
      });
      html += '</div>';
      html += '<p class="fact hidden">' + escapeHtml(q.fact) + '</p>';
      html += '</div>';
    });

    html += '</section>';
  });

  container.innerHTML = html;
}

function checkAnswer(milestoneIndex, triviaIndex, selectedIndex) {
  var qKey = 'q-' + milestoneIndex + '-' + triviaIndex;
  var block = document.getElementById(qKey);
  if (!block) return;

  var question = storyContent.milestones[milestoneIndex].trivia[triviaIndex];
  var buttons = block.querySelectorAll('.btn-answer');

  // Disable all buttons for this question
  buttons.forEach(function (btn) {
    btn.disabled = true;
  });

  if (selectedIndex === question.answer) {
    buttons[selectedIndex].classList.add('correct');
    setScore(getScore() + 1);
  } else {
    buttons[selectedIndex].classList.add('incorrect');
    buttons[question.answer].classList.add('correct');
  }

  // Reveal the fact
  var factEl = block.querySelector('.fact');
  if (factEl) {
    factEl.classList.remove('hidden');
  }
}

// ─── Map / GPS ───────────────────────────────────────────────────────────────

function renderMilestoneCards() {
  var container = document.getElementById('map-container');
  if (!container) return;

  var html = '';
  storyContent.milestones.forEach(function (milestone) {
    html += '<article class="milestone-card" data-milestone-id="' + milestone.id + '">';
    html += '<h2>' + escapeHtml(milestone.title) + '</h2>';
    html += '<p class="card-story">' + escapeHtml(milestone.story) + '</p>';
    html += '<p class="card-coords">Lat ' + milestone.lat + ' / Lng ' + milestone.lng + '</p>';
    html += '</article>';
  });

  container.innerHTML = html;
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

  var statusEl = document.getElementById('geo-status');
  var coordsEl = document.getElementById('coords-display');

  if (statusEl) statusEl.textContent = 'Position found.';
  if (coordsEl) {
    coordsEl.textContent = 'Lat ' + lat.toFixed(5) + ' · Lng ' + lng.toFixed(5);
  }

  findNearestMilestone(lat, lng);
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
    if (d < minDist) {
      minDist = d;
      nearest = milestone;
    }
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
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

// ─── Shared utility ──────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  updateScoreDisplay();

  if (document.getElementById('map-container')) {
    initMap();
  }
  if (document.getElementById('trivia-container')) {
    initGame();
  }
});
