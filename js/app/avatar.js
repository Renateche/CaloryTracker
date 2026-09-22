/**
 * A little glam desktop-pet that lives on every page (mounted from shell.js).
 *
 * It's a static multi-page site, not an SPA, so "following you" is simulated:
 * position/direction/mood are persisted to localStorage and re-read on each
 * fresh page load, then the pet keeps wandering from roughly where it left off.
 */

import { readJson, writeJson } from '../lib/storage.js';
import { createTrackerApi } from '../api/tracker-api.js';
import { TRACKERS } from './trackers.js';
import { today } from '../lib/dates.js';
import { AVATAR_STATES } from './AvatarState.js';
import { AvatarManager } from './AvatarManager.js';
import { AvatarRenderer } from './AvatarRenderer.js';

const STATE_KEY = 'lifestyle:pet:state';
const PET_SIZE = 86;
const PET_HEIGHT = 102;
const PET_BOTTOM_MARGIN = 12;
const SPEECH_VIEWPORT_MARGIN = 8;
const PERSIST_INTERVAL_MS = 1000;
const SPEECH_DURATION_MS = 2200;

const PHRASES = {
  happy: ["you're on a roll!", 'love that for you', 'keep it up bestie', 'sparkling today ✨'],
  neutral: ['hi!', 'log something today?', 'just vibing', 'poke me again'],
  sleepy: ['sooo sleepy…', "haven't logged today?", 'zzz…', 'wake me up with a log']
};

const prefersReducedMotion = () =>
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const defaultState = () => ({
  x: 0.5,
  y: 1,
  direction: 1,
  directionY: -1,
  mood: 'neutral',
  moodDay: null
});

const loadState = () => ({ ...defaultState(), ...readJson(STATE_KEY, {}) });

let state = loadState();
let persistTimer = null;

const schedulePersist = () => {
  if (persistTimer) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    writeJson(STATE_KEY, state);
  }, PERSIST_INTERVAL_MS);
};

const PET_MARKUP = `
  <span class="pet-shadow" aria-hidden="true"></span>
  <button class="pet-body" type="button" aria-label="Talk to your lifestyle companion">
    <img class="pet-image" alt="" draggable="false" />
  </button>
  <span class="pet-speech" role="status" aria-live="polite" hidden></span>`;

let root = null;
let speechTimer = null;
let blinkTimer = null;
let avatarManager = null;
let dragState = null;
let suppressNextClick = false;
let isWandering = false;

const applyMoodClass = () => {
  root.classList.remove('mood-happy', 'mood-neutral', 'mood-sleepy');
  root.classList.add(`mood-${state.mood}`);
  avatarManager?.setMood(state.mood);
};

const positionSpeechBubble = () => {
  const bubble = root.querySelector('.pet-speech');
  if (bubble.hidden) return;

  bubble.classList.remove('is-below');
  bubble.style.setProperty('--speech-shift-x', '0px');
  bubble.style.setProperty('--speech-shift-y', '0px');
  bubble.style.setProperty('--speech-pointer-shift-x', '0px');

  const rootBounds = root.getBoundingClientRect();
  const bubbleWidth = bubble.offsetWidth;
  const bubbleHeight = bubble.offsetHeight;
  const aboveTop = rootBounds.top + bubble.offsetTop;
  if (aboveTop < SPEECH_VIEWPORT_MARGIN) bubble.classList.add('is-below');

  const bubbleLeft = rootBounds.left + bubble.offsetLeft - bubbleWidth / 2;
  const bubbleTop = rootBounds.top + bubble.offsetTop;
  const shiftX =
    bubbleLeft < SPEECH_VIEWPORT_MARGIN
      ? SPEECH_VIEWPORT_MARGIN - bubbleLeft
      : Math.min(0, window.innerWidth - SPEECH_VIEWPORT_MARGIN - bubbleLeft - bubbleWidth);
  const shiftY =
    bubbleTop < SPEECH_VIEWPORT_MARGIN
      ? SPEECH_VIEWPORT_MARGIN - bubbleTop
      : Math.min(0, window.innerHeight - SPEECH_VIEWPORT_MARGIN - bubbleTop - bubbleHeight);
  const pointerBase = bubbleWidth / 2 - 22;
  const pointerPosition = clamp(pointerBase - shiftX, 12, bubbleWidth - 12);

  bubble.style.setProperty('--speech-shift-x', `${shiftX}px`);
  bubble.style.setProperty('--speech-shift-y', `${shiftY}px`);
  bubble.style.setProperty('--speech-pointer-shift-x', `${pointerPosition - pointerBase}px`);
};

const positionPet = () => {
  const maxX = Math.max(window.innerWidth - PET_SIZE, 0);
  const maxY = Math.max(window.innerHeight - PET_HEIGHT - PET_BOTTOM_MARGIN, 0);
  root.style.setProperty('--pet-x', `${clamp(state.x * window.innerWidth, 0, maxX)}px`);
  root.style.setProperty('--pet-y', `${clamp(state.y * window.innerHeight, 0, maxY)}px`);
  positionSpeechBubble();
};

const startDragging = (event) => {
  if (event.button !== 0) return;
  const bounds = root.getBoundingClientRect();
  dragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - bounds.left,
    offsetY: event.clientY - bounds.top,
    moved: false
  };
  root.classList.add('is-dragged');
  avatarManager?.setDragging(true);
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
};

const dragPet = (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const maxX = Math.max(window.innerWidth - PET_SIZE, 0);
  const maxY = Math.max(window.innerHeight - PET_HEIGHT - PET_BOTTOM_MARGIN, 0);
  const nextX = clamp(event.clientX - dragState.offsetX, 0, maxX);
  const nextY = clamp(event.clientY - dragState.offsetY, 0, maxY);
  dragState.moved = true;
  state.x = window.innerWidth === 0 ? 0 : nextX / window.innerWidth;
  state.y = window.innerHeight === 0 ? 0 : nextY / window.innerHeight;
  positionPet();
  schedulePersist();
};

const stopDragging = (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  suppressNextClick = dragState.moved;
  dragState = null;
  root.classList.remove('is-dragged');
  avatarManager?.setDragging(false);
  avatarManager?.setWalking(isWandering);
};

const scheduleBlink = () => {
  blinkTimer = window.setTimeout(
    () => {
      root.classList.add('is-blinking');
      window.setTimeout(() => root.classList.remove('is-blinking'), 160);
      scheduleBlink();
    },
    2000 + Math.random() * 3000
  );
};

const showSpeech = (text) => {
  const bubble = root.querySelector('.pet-speech');
  bubble.textContent = text;
  bubble.hidden = false;
  positionSpeechBubble();
  avatarManager?.setTalking(true);
  root.classList.add('is-bounce');
  window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => {
    bubble.hidden = true;
    root.classList.remove('is-bounce');
    avatarManager?.setTalking(false);
  }, SPEECH_DURATION_MS);
};

const handleClick = () => {
  const pool = PHRASES[state.mood] ?? PHRASES.neutral;
  showSpeech(pool[Math.floor(Math.random() * pool.length)]);
};

/** Idle/walk state machine; reduced-motion just parks the pet in place. */
const startWandering = () => {
  if (prefersReducedMotion()) return;

  let mode = 'idle';
  let modeUntil = 0;
  const speed = 40; // px/s
  let lastTick = performance.now();

  const tick = (now) => {
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    if (dragState) {
      window.requestAnimationFrame(tick);
      return;
    }

    if (now > modeUntil) {
      const goingIdle = mode === 'walk';
      mode = goingIdle ? 'idle' : 'walk';
      isWandering = mode === 'walk';
      modeUntil = now + (goingIdle ? 1500 + Math.random() * 2500 : 2000 + Math.random() * 3000);
      if (mode === 'walk') {
        if (Math.random() < 0.5) state.direction *= -1;
        if (Math.random() < 0.5) state.directionY *= -1;
      }
      avatarManager?.setWalking(isWandering);
    }

    if (mode === 'walk') {
      const maxX = Math.max(window.innerWidth - PET_SIZE, 0);
      const maxY = Math.max(window.innerHeight - PET_HEIGHT - PET_BOTTOM_MARGIN, 0);
      const nextPx = clamp(state.x * window.innerWidth + state.direction * speed * dt, 0, maxX);
      const nextPy = clamp(
        state.y * window.innerHeight + state.directionY * speed * 0.65 * dt,
        0,
        maxY
      );
      state.x = maxX === 0 ? 0 : nextPx / window.innerWidth;
      state.y = maxY === 0 ? 0 : nextPy / window.innerHeight;
      if (nextPx <= 0 || nextPx >= maxX) state.direction *= -1;
      if (nextPy <= 0 || nextPy >= maxY) state.directionY *= -1;
      root.style.setProperty('--pet-facing', String(state.direction));
      positionPet();
      schedulePersist();
    }

    window.requestAnimationFrame(tick);
  };

  root.style.setProperty('--pet-facing', String(state.direction));
  window.requestAnimationFrame(tick);
};

export const mountAvatar = (activePage) => {
  if (root || document.querySelector('.page-pet')) return;

  state.mood = activePage === 'sleep' ? 'sleepy' : state.mood === 'sleepy' ? 'neutral' : state.mood;

  root = document.createElement('div');
  root.className = 'page-pet';
  root.innerHTML = PET_MARKUP;
  document.body.appendChild(root);

  avatarManager = new AvatarManager(new AvatarRenderer(root));
  avatarManager.preload();

  applyMoodClass();
  positionPet();
  const petBody = root.querySelector('.pet-body');
  petBody.addEventListener('click', (event) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    handleClick(event);
  });
  petBody.addEventListener('pointerdown', startDragging);
  petBody.addEventListener('pointermove', dragPet);
  petBody.addEventListener('pointerup', stopDragging);
  petBody.addEventListener('pointercancel', stopDragging);
  window.addEventListener('resize', positionPet);
  document.addEventListener('visibilitychange', () => writeJson(STATE_KEY, state));
  window.addEventListener('pagehide', () => writeJson(STATE_KEY, state));

  scheduleBlink();
  startWandering();
};

export const setAvatarState = (nextState) => {
  if (Object.values(AVATAR_STATES).includes(nextState)) avatarManager?.setState(nextState);
};

/** Classifies mood from the active page and today's logged rows. */
export const setAvatarMood = async (user, activePage) => {
  if (!root) return;

  if (activePage === 'sleep') {
    state.mood = 'sleepy';
    state.moodDay = null;
    applyMoodClass();
    writeJson(STATE_KEY, state);
    return;
  }

  if (state.moodDay === today() && user) {
    applyMoodClass();
    return;
  }

  if (!user) {
    state.mood = 'neutral';
    state.moodDay = null;
    applyMoodClass();
    return;
  }

  try {
    const readyTrackers = TRACKERS.filter((tracker) => tracker.ready);
    const day = today();
    const results = await Promise.all(
      readyTrackers.map((tracker) =>
        createTrackerApi(tracker).fetchRange({ from: day, to: day, limit: 1 })
      )
    );
    const loggedToday = results.some((rows) => rows.length > 0);
    state.mood = loggedToday ? 'happy' : 'neutral';
    state.moodDay = day;
  } catch {
    // A missing table or offline client just falls back to a neutral mood.
    state.mood = 'neutral';
    state.moodDay = null;
  }

  applyMoodClass();
  writeJson(STATE_KEY, state);
};
