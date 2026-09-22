/** @typedef {'neutral'|'happy'|'sleepy'|'talking'|'walking'|'dance'|'dragged'} AvatarState */

export const AVATAR_STATES = Object.freeze({
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  SLEEPY: 'sleepy',
  TALKING: 'talking',
  WALKING: 'walking',
  DANCE: 'dance',
  DRAGGED: 'dragged'
});

export const AVATAR_ASSETS = Object.freeze({
  neutral: 'avatar_neutral.png',
  happy: 'avatar_happy.png',
  sleepy: 'avatar_sleepy.png',
  talking: 'avatar_talking.png',
  dance: 'avatar_dance.png',
  dragged: 'avatar_dragged.png',
  walking: ['avatar_walk_1.png', 'avatar_walk_2.png']
});

export const AVATAR_ASSET_PATH = 'assets/avatar/';
