# Icon Libraries — Lifestyle Tracker

## Glossy Y2K collection

`glossy-demo.html` presents nine original 128×128 retro-tech icons with an MSN-era
candy palette, chrome rims, soft 3D shadows, and glass highlights. Each icon is
available as an individual SVG in `glossy/`; shared artwork lives in
`glossy-sprite.svg`.

Open `assets/icons/glossy-demo.html` through the local development server to preview
and download the individual assets.

After editing `glossy-sprite.svg`, regenerate the self-contained files with:

```powershell
node assets/icons/build-glossy-icons.mjs
```

## Pixel collection

Source reference: `style inspo.docx` (MSN Messenger nostalgia collage, "DreamWorld OS"
pastel pixel desktop, Y2K chrome/glitter collage, pastel-outline UI kit, kawaii
retro-tech doodle sheets).

Default rendering is now an **authentic Windows 95 look**: a real double bevel
(white/black outer border + light-gray/dark-gray inner border — the exact
construction used on real Win95 icons and buttons), silver button face, navy/teal
accents, and a consistent top-left ambient light/bottom-right shade baked into
every icon for extra contrast and depth. The original Y2K kawaii look from the
reference doc is kept as an opt-in `.theme-y2k` variant. All variations re-theme
the same 16×16 pixel icons through CSS custom properties, rather than
hand-drawing 100+ divergent icons of inconsistent quality:

| File          | Purpose                                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sprite.svg`  | All icons as `<symbol>` defs on a shared 16×16 pixel grid, reusing a common `badge-base` (Win95 double bevel + face fill + ambient shading).                                            |
| `palette.css` | Default Win95 palette + `.theme-y2k`, `.theme-geocities`, `.theme-pixelgame` classes that swap the same icons' color roles and add a filter treatment.                                  |
| `demo.html`   | Visual gallery rendering every icon at 64px across all 4 looks (default + 3 themes) for review. Open via the local dev server (`assets/icons/demo.html`) since it fetches `sprite.svg`. |

## Usage

```html
<link rel="stylesheet" href="assets/icons/palette.css" />
<div class="theme-y2k">
  <!-- omit for default Win95 look, or use theme-geocities / theme-pixelgame -->
  <svg class="icon-svg" viewBox="0 0 16 16">
    <use href="assets/icons/sprite.svg#icon-mood-happy"></use>
  </svg>
</div>
```

## Palette roles (shared across every icon)

| CSS var           | Role                                      | Win95 (default)  | Y2K kawaii           | GeoCities           | Pixel-game       |
| ----------------- | ----------------------------------------- | ---------------- | -------------------- | ------------------- | ---------------- |
| `--icon-ink`      | outer dark bevel line / outline           | `#000000`        | `#2b2b2b`            | `#4a0e4e`           | `#000000`        |
| `--icon-hi`       | outer light bevel line                    | `#ffffff`        | `#ffffff`            | `#ffffff`           | `#ffffff`        |
| `--icon-bevel-hi` | inner light bevel line                    | `#dfdfdf`        | `#fff5fa`            | `#ffe3f5`           | `#ffffff`        |
| `--icon-bevel-sh` | inner dark bevel line                     | `#808080`        | `#d9a6c2`            | `#7b2cbf`           | `#000000`        |
| `--icon-c1`       | badge face fill                           | `#c0c0c0` silver | `#ffe9f2` pink       | `#ffd6ec` pink      | `#e63946` red    |
| `--icon-c2`       | secondary fill                            | `#ffffff` white  | `#b8e8d4` mint       | `#c9a6ff` violet    | `#2a9d8f` teal   |
| `--icon-c3`       | tertiary fill                             | `#808080` gray   | `#cdb8f0` lavender   | `#9b5de5` purple    | `#264653` navy   |
| `--icon-c4`       | cool accent                               | `#008080` teal   | `#7fd8e0` cyan       | `#00f5d4` neon mint | `#457b9d` blue   |
| `--icon-accent`   | hot accent                                | `#000080` navy   | `#ff6fa8` hot pink   | `#ff2e88` magenta   | `#f4a261` orange |
| `--icon-warn`     | gold/star / glyph shading overlay         | `#ffff00`        | `#ffd166`            | `#fee440`           | `#ffe066`        |
| `--icon-sh`       | ambient shadow overlay (semi-transparent) | `#808080`        | `rgba(43,14,46,.35)` | `#7b2cbf`           | `#000000`        |

## Icon manifest

### Health & Lifestyle

| Icon                   | Purpose                                  | Glyph notes                |
| ---------------------- | ---------------------------------------- | -------------------------- |
| `icon-mood-tracker`    | Entry point for the mood tracker feature | Face + small "+" log mark  |
| `icon-mood-happy`      | Happy mood log value                     | Upward smile               |
| `icon-mood-neutral`    | Neutral mood log value                   | Straight mouth             |
| `icon-mood-sad`        | Sad mood log value                       | Downward frown             |
| `icon-energy-level`    | Energy level widget                      | Lightning bolt             |
| `icon-stress-level`    | Stress level widget                      | Gauge dial + red zone      |
| `icon-mental-wellness` | Mental wellness section                  | Head silhouette + sparkles |

### Habits & Productivity

| Icon                  | Purpose                   | Glyph notes                 |
| --------------------- | ------------------------- | --------------------------- |
| `icon-habit-tracker`  | Habit tracker entry point | Mini calendar grid + check  |
| `icon-daily-routine`  | Daily routine widget      | Clock face + refresh arrows |
| `icon-checklist`      | Task/checklist widget     | Clipboard with check rows   |
| `icon-goal`           | Personal goal             | Target rings                |
| `icon-achievement`    | Achievement/badge unlock  | Trophy                      |
| `icon-streak-counter` | Daily streak count        | Flame                       |
| `icon-calendar`       | Calendar view             | Grid + header bar           |
| `icon-reminder`       | Reminder/notification     | Bell                        |
| `icon-progress-chart` | Progress over time        | Ascending bar chart         |

### Nutrition

| Icon                     | Purpose                   | Glyph notes                                           |
| ------------------------ | ------------------------- | ----------------------------------------------------- |
| `icon-calories`          | Calorie tracking          | Flame (shares metaphor with streak, distinct context) |
| `icon-apple`             | Food/fruit logging        | Apple silhouette                                      |
| `icon-meal`              | Meal entry                | Plate with food groups                                |
| `icon-water-intake`      | Water tracker             | Droplet                                               |
| `icon-nutrition`         | Nutrition breakdown       | Quadrant plate (macro groups)                         |
| `icon-weight-scale`      | Weight tracking           | Bathroom scale                                        |
| `icon-healthy-day-badge` | "Healthy day" achievement | Ribbon badge with check                               |

### Fitness

| Icon                     | Purpose                      | Glyph notes                           |
| ------------------------ | ---------------------------- | ------------------------------------- |
| `icon-exercise`          | Exercise tracker entry point | Dumbbell                              |
| `icon-walking`           | Walking activity             | Footprints                            |
| `icon-running`           | Running activity             | Running figure                        |
| `icon-strength-training` | Strength training            | Barbell (larger plates than dumbbell) |
| `icon-activity-tracker`  | Wearable/activity tracker    | Wristband + watch face                |
| `icon-heart-rate`        | Heart rate                   | Heart + pulse line                    |

### Sleep

| Icon                 | Purpose                   | Glyph notes        |
| -------------------- | ------------------------- | ------------------ |
| `icon-sleep-tracker` | Sleep tracker entry point | Bed + "zzz"        |
| `icon-bed`           | Bed / sleep session       | Bed with pillow    |
| `icon-moon`          | Night/moon indicator      | Crescent moon      |
| `icon-alarm-clock`   | Alarm/wake time           | Clock with bells   |
| `icon-sleep-score`   | Sleep quality score       | Moon + star rating |

### Navigation

| Icon              | Purpose             | Glyph notes         |
| ----------------- | ------------------- | ------------------- |
| `icon-home`       | Home nav item       | House               |
| `icon-dashboard`  | Dashboard nav item  | 2×2 tile grid       |
| `icon-settings`   | Settings nav item   | Gear                |
| `icon-statistics` | Statistics nav item | Bar chart           |
| `icon-reports`    | Reports nav item    | Document with lines |
| `icon-profile`    | Profile nav item    | Person silhouette   |
| `icon-search`     | Search nav item     | Magnifier           |

### Bonus decorative (single Y2K-kawaii style; not themed ×3 since these are one-off scene pieces, not repeated UI iconography)

`icon-star`, `icon-cloud`, `icon-computer`, `icon-floppy-disk`, `icon-coffee-cup`,
`icon-dialog-box`, `icon-status-indicator`, `icon-mascot`.

## Design explanation

- **16×16 pixel grid, crisp edges**: every icon is built from whole-pixel `<rect>` blocks (`shape-rendering: crispEdges`, `image-rendering: pixelated`) so it stays sharp at any scale, matching the blocky look of the reference doodle sheets and pixel-heart progress bars in the "DreamWorld OS" image.
- **Shared badge chrome**: every icon reuses one `badge-base` symbol (drop-shadow, ink border, fill, corner bevel) via `<use>`, matching the reference's consistent rounded-window/bevel language while keeping the sprite file small and edits centralized.
- **Three variations via re-theming, not re-drawing**: the requested Win95 / GeoCities / pixel-game looks are produced by swapping the same 8 color roles per icon and applying a CSS filter (desaturation for Win95, saturation+glow for GeoCities, contrast+saturation for pixel-game). This keeps all 48 icons visually consistent as a set and avoids 140+ hand-authored one-off variants of uncertain quality — open `demo.html` to compare all 4 looks side by side.
- **Not applied to this app's current UI**: `style.css` currently uses a modern flat design system; these icon files were added standalone per your request and are not wired into the existing pages.
