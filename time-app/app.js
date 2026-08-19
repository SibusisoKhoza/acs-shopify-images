import {
  computeLapDeltas,
  formatClockParts,
  formatElapsedMs,
  formatRemainingMs,
  parseDurationInputs,
} from './timeUtils.js';

const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('[data-panel]');
const clockTime = document.querySelector('#clock-time');
const clockDate = document.querySelector('#clock-date');
const showSeconds = document.querySelector('#show-seconds');
const hourFormatInputs = document.querySelectorAll('input[name="hour-format"]');

const stopwatchTime = document.querySelector('#stopwatch-time');
const stopwatchStart = document.querySelector('#stopwatch-start');
const stopwatchLap = document.querySelector('#stopwatch-lap');
const stopwatchReset = document.querySelector('#stopwatch-reset');
const stopwatchStatus = document.querySelector('#stopwatch-status');
const lapList = document.querySelector('#lap-list');
const lapCount = document.querySelector('#lap-count');

const countdownCard = document.querySelector('#countdown-card');
const countdownTime = document.querySelector('#countdown-time');
const countdownMessage = document.querySelector('#countdown-message');
const countdownStatus = document.querySelector('#countdown-status');
const countdownStart = document.querySelector('#countdown-start');
const countdownReset = document.querySelector('#countdown-reset');
const countdownError = document.querySelector('#countdown-error');
const countdownInputs = [
  document.querySelector('#countdown-hours'),
  document.querySelector('#countdown-minutes'),
  document.querySelector('#countdown-seconds'),
];

const state = {
  clock: {
    hour12: false,
    showSeconds: true,
  },
  stopwatch: {
    elapsedMs: 0,
    startedAt: null,
    lapTimestamps: [],
    interval: null,
  },
  countdown: {
    durationMs: 0,
    remainingMs: 0,
    endsAt: null,
    interval: null,
    running: false,
    done: false,
  },
};

function setActiveTab(tabName) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === tabName;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
  });
}

function renderClock() {
  const now = new Date();
  const parts = formatClockParts(now, state.clock);
  const seconds = parts.seconds === null ? '' : `:${parts.seconds}`;
  const meridiem = parts.meridiem === null ? '' : ` ${parts.meridiem}`;

  clockTime.textContent = `${parts.hours}:${parts.minutes}${seconds}${meridiem}`;
  clockDate.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  clockTime.dateTime = now.toISOString();
}

function getStopwatchElapsed() {
  if (state.stopwatch.startedAt === null) {
    return state.stopwatch.elapsedMs;
  }

  return state.stopwatch.elapsedMs + Date.now() - state.stopwatch.startedAt;
}

function renderLaps() {
  const deltas = computeLapDeltas(state.stopwatch.lapTimestamps);
  lapCount.textContent = `${deltas.length} ${deltas.length === 1 ? 'lap' : 'laps'}`;

  if (deltas.length === 0) {
    lapList.innerHTML = '<li class="empty-state">Your laps will appear here.</li>';
    return;
  }

  lapList.innerHTML = deltas
    .map((delta, index) => `<li>Lap ${index + 1}<strong>${formatElapsedMs(delta)}</strong></li>`)
    .reverse()
    .join('');
}

function renderStopwatch() {
  stopwatchTime.textContent = formatElapsedMs(getStopwatchElapsed());
  stopwatchStart.textContent = state.stopwatch.startedAt === null ? 'Start' : 'Stop';
  stopwatchLap.disabled = state.stopwatch.startedAt === null;
  stopwatchStatus.textContent = state.stopwatch.startedAt === null
    ? (state.stopwatch.elapsedMs > 0 ? 'Paused' : 'Ready')
    : 'Running';
  renderLaps();
}

function startStopwatch() {
  if (state.stopwatch.startedAt !== null) {
    state.stopwatch.elapsedMs = getStopwatchElapsed();
    state.stopwatch.startedAt = null;
    clearInterval(state.stopwatch.interval);
    state.stopwatch.interval = null;
  } else {
    state.stopwatch.startedAt = Date.now();
    state.stopwatch.interval = setInterval(renderStopwatch, 37);
  }

  renderStopwatch();
}

function resetStopwatch() {
  clearInterval(state.stopwatch.interval);
  state.stopwatch.elapsedMs = 0;
  state.stopwatch.startedAt = null;
  state.stopwatch.lapTimestamps = [];
  state.stopwatch.interval = null;
  renderStopwatch();
}

function addLap() {
  if (state.stopwatch.startedAt === null) {
    return;
  }

  state.stopwatch.lapTimestamps.push(getStopwatchElapsed());
  renderStopwatch();
}

function readCountdownDuration() {
  try {
    const durationMs = parseDurationInputs(...countdownInputs.map((input) => input.value));
    countdownError.textContent = '';
    return durationMs;
  } catch (error) {
    countdownError.textContent = error.message;
    return null;
  }
}

function getCountdownRemaining() {
  if (!state.countdown.running || state.countdown.endsAt === null) {
    return state.countdown.remainingMs;
  }

  return Math.max(0, state.countdown.endsAt - Date.now());
}

function renderCountdown() {
  const remainingMs = getCountdownRemaining();
  countdownTime.textContent = formatRemainingMs(remainingMs);
  countdownCard.classList.toggle('is-done', state.countdown.done);
  countdownStatus.textContent = state.countdown.done
    ? 'Done'
    : (state.countdown.running ? 'Running' : (state.countdown.remainingMs > 0 ? 'Paused' : 'Ready'));
  countdownStart.textContent = state.countdown.running ? 'Pause' : 'Start';
  countdownMessage.textContent = state.countdown.done
    ? 'Time is up.'
    : (state.countdown.running ? 'Counting down…' : 'Choose a duration to begin.');
}

function stopCountdownInterval() {
  clearInterval(state.countdown.interval);
  state.countdown.interval = null;
}

function tickCountdown() {
  state.countdown.remainingMs = getCountdownRemaining();

  if (state.countdown.remainingMs === 0) {
    state.countdown.running = false;
    state.countdown.endsAt = null;
    state.countdown.done = true;
    stopCountdownInterval();
  }

  renderCountdown();
}

function startCountdown() {
  if (state.countdown.running) {
    state.countdown.remainingMs = getCountdownRemaining();
    state.countdown.running = false;
    state.countdown.endsAt = null;
    stopCountdownInterval();
    renderCountdown();
    return;
  }

  if (state.countdown.remainingMs === 0 || state.countdown.done) {
    const durationMs = readCountdownDuration();
    if (durationMs === null) {
      return;
    }
    state.countdown.durationMs = durationMs;
    state.countdown.remainingMs = durationMs;
  }

  if (state.countdown.remainingMs === 0) {
    state.countdown.done = true;
    renderCountdown();
    return;
  }

  state.countdown.done = false;
  state.countdown.running = true;
  state.countdown.endsAt = Date.now() + state.countdown.remainingMs;
  state.countdown.interval = setInterval(tickCountdown, 80);
  renderCountdown();
}

function resetCountdown() {
  stopCountdownInterval();
  const durationMs = readCountdownDuration();
  state.countdown.running = false;
  state.countdown.endsAt = null;
  state.countdown.durationMs = durationMs ?? 0;
  state.countdown.remainingMs = durationMs ?? 0;
  state.countdown.done = false;
  renderCountdown();
}

function updateCountdownFromInput() {
  if (state.countdown.running) {
    return;
  }

  const durationMs = readCountdownDuration();
  if (durationMs === null) {
    return;
  }

  state.countdown.durationMs = durationMs;
  state.countdown.remainingMs = durationMs;
  state.countdown.done = false;
  renderCountdown();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
});

hourFormatInputs.forEach((input) => {
  input.addEventListener('change', () => {
    state.clock.hour12 = input.value === '12';
    renderClock();
  });
});

showSeconds.addEventListener('change', () => {
  state.clock.showSeconds = showSeconds.checked;
  renderClock();
});

stopwatchStart.addEventListener('click', startStopwatch);
stopwatchLap.addEventListener('click', addLap);
stopwatchReset.addEventListener('click', resetStopwatch);
countdownStart.addEventListener('click', startCountdown);
countdownReset.addEventListener('click', resetCountdown);
countdownInputs.forEach((input) => input.addEventListener('input', updateCountdownFromInput));

renderClock();
renderStopwatch();
resetCountdown();
setInterval(renderClock, 250);
