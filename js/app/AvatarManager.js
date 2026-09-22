import { AVATAR_STATES } from './AvatarState.js';

export class AvatarManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.state = AVATAR_STATES.NEUTRAL;
    this.restingState = this.state;
    this.isMoving = false;
    this.isDragging = false;
    this.isTalking = false;
  }

  preload() {
    return this.renderer.preload();
  }

  setState(state) {
    this.state = this.isDragging
      ? AVATAR_STATES.DRAGGED
      : this.isMoving
        ? AVATAR_STATES.WALKING
        : state;
    this.renderer.setState(this.state);
  }

  setMood(mood) {
    this.restingState =
      mood === 'happy'
        ? AVATAR_STATES.HAPPY
        : mood === 'sleepy'
          ? AVATAR_STATES.SLEEPY
          : AVATAR_STATES.NEUTRAL;
    this.setState(this.isTalking ? AVATAR_STATES.TALKING : this.restingState);
  }

  setWalking(isWalking) {
    this.isMoving = isWalking;
    this.setState(isWalking || !this.isTalking ? this.restingState : AVATAR_STATES.TALKING);
  }

  setDragging(isDragging) {
    this.isDragging = isDragging;
    this.setState(isDragging || !this.isTalking ? this.restingState : AVATAR_STATES.TALKING);
  }

  setTalking(isTalking) {
    this.isTalking = isTalking;
    this.setState(isTalking ? AVATAR_STATES.TALKING : this.restingState);
  }
}
