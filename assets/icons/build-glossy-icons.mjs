import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const source = await readFile(join(root, 'glossy-sprite.svg'), 'utf8');
const definitions = source.match(/<defs>[\s\S]*<\/defs>/)?.[0];

if (!definitions) {
  throw new Error('Could not find SVG definitions in glossy-sprite.svg');
}

const icons = {
  messenger: ['icon-messenger', 'Messenger contacts'],
  desktop: ['icon-desktop', 'Retro desktop'],
  'flip-phone': ['icon-flip-phone', 'Flip phone'],
  'digital-pet': ['icon-digital-pet', 'Digital pet'],
  'music-player': ['icon-music-player', 'Music player'],
  camera: ['icon-camera', 'Instant camera'],
  gamepad: ['icon-gamepad', 'Game controller'],
  floppy: ['icon-floppy', 'Floppy disk'],
  'heart-status': ['icon-heart-status', 'Heart status']
};

await mkdir(join(root, 'glossy'), { recursive: true });

for (const [filename, [symbol, label]] of Object.entries(icons)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  ${definitions}
  <use href="#${symbol}"/>
</svg>
`;
  await writeFile(join(root, 'glossy', `${filename}.svg`), svg);
}

console.log(`Built ${Object.keys(icons).length} self-contained glossy SVG icons.`);