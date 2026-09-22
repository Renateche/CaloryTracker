import { AVATAR_ASSET_PATH, AVATAR_ASSETS, AVATAR_STATES } from './AvatarState.js';

const WALK_INTERVAL_MS = 250;

export class AvatarRenderer {
  constructor(root) {
    this.root = root;
    this.image = root.querySelector('.pet-image');
    this.walkTimer = null;
    this.walkFrame = 0;
    this.sources = new Map();
  }

  preload() {
    const filenames = Object.values(AVATAR_ASSETS).flat();
    return Promise.all(
      filenames.map((filename) => {
        const image = new Image();
        const source = `${AVATAR_ASSET_PATH}${filename}`;
        image.src = source;
        this.sources.set(filename, source);
        return image.decode?.().catch(() => undefined) ?? Promise.resolve();
      })
    );
  }

  setState(state) {
    this.root.dataset.avatarState = state;
    this.root.classList.toggle('is-walking', state === AVATAR_STATES.WALKING);
    if (state === AVATAR_STATES.WALKING) {
      this.startWalking();
      return;
    }
    this.stopWalking();
    this.setImage(AVATAR_ASSETS[state] ?? AVATAR_ASSETS.neutral);
  }

  setImage(filename) {
    const source = this.sources.get(filename) ?? `${AVATAR_ASSET_PATH}${filename}`;
    if (this.image.src.endsWith(source)) return;
    this.image.src = source;
    this.image.alt = 'Lifestyle companion avatar';
  }

  startWalking() {
    if (this.walkTimer) return;
    this.walkFrame = 0;
    this.setImage(AVATAR_ASSETS.walking[this.walkFrame]);
    this.walkTimer = window.setInterval(() => {
      this.walkFrame = (this.walkFrame + 1) % AVATAR_ASSETS.walking.length;
      this.setImage(AVATAR_ASSETS.walking[this.walkFrame]);
    }, WALK_INTERVAL_MS);
  }

  stopWalking() {
    if (!this.walkTimer) return;
    window.clearInterval(this.walkTimer);
    this.walkTimer = null;
  }
}
