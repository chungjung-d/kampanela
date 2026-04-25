import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H, DESK_SLOTS, ENTRY, GRID_COLS, GRID_ROWS, TILE } from './config.ts';

/**
 * Programmatic asset generation. No external files are required for MVP —
 * every texture the scene needs is rendered at runtime into the texture cache.
 *
 * Key perf choice: the entire static office (floor + walls + desks) is baked
 * into one canvas-sized texture `office-bg`. One `add.image` for the whole
 * background beats hundreds of 32x32 tiles the renderer has to track per
 * frame. When real pixel-art assets are dropped into `public/assets/` the
 * loader can be extended to `load.image('office-bg', ...)` and the bake
 * here becomes the fallback.
 */
export const TEX = {
  officeBg: 'tex-office-bg',
  agent: (color: string) => `tex-agent-${color}`,
  ring: 'tex-selection-ring',
} as const;

export function generateTextures(scene: Phaser.Scene): void {
  generateOfficeBackground(scene);

  // Selection ring (separate texture because it sits under each agent).
  const ring = scene.make.graphics({ x: 0, y: 0 }, false);
  ring.lineStyle(2, 0xffd34d, 1);
  ring.strokeCircle(TILE / 2, TILE / 2, TILE / 2 - 2);
  ring.generateTexture(TEX.ring, TILE, TILE);
  ring.destroy();
}

function generateOfficeBackground(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.officeBg)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // Floor — two-tone checker pattern drawn inline (no per-tile GameObject).
  for (let c = 0; c < GRID_COLS; c++) {
    for (let r = 0; r < GRID_ROWS; r++) {
      const x = c * TILE;
      const y = r * TILE;
      g.fillStyle(0x1f2430, 1);
      g.fillRect(x, y, TILE, TILE);
      g.fillStyle(0x262b3a, 1);
      g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    }
  }

  // Walls around the edge, leaving the entry tile open.
  const drawWall = (col: number, row: number) => {
    const x = col * TILE;
    const y = row * TILE;
    g.fillStyle(0x3a3f50, 1);
    g.fillRect(x, y, TILE, TILE);
    g.lineStyle(2, 0x55606d, 1);
    g.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
  };
  for (let c = 0; c < GRID_COLS; c++) {
    drawWall(c, 0);
    drawWall(c, GRID_ROWS - 1);
  }
  for (let r = 0; r < GRID_ROWS; r++) {
    if (r !== ENTRY.row) drawWall(0, r);
    drawWall(GRID_COLS - 1, r);
  }

  // Desks.
  for (const slot of DESK_SLOTS) {
    const x = slot.col * TILE;
    const y = slot.row * TILE;
    g.fillStyle(0x8b5e3c, 1);
    g.fillRoundedRect(x + 2, y + 4, TILE - 4, TILE - 12, 3);
    g.fillStyle(0xa57448, 1);
    g.fillRoundedRect(x + 2, y + 4, TILE - 4, 4, 2);
    g.fillStyle(0x111419, 1);
    g.fillRect(x + TILE / 2 - 6, y + 8, 12, 8);
    g.fillStyle(0x3bb273, 1);
    g.fillRect(x + TILE / 2 - 5, y + 9, 10, 6);
  }

  g.generateTexture(TEX.officeBg, CANVAS_W, CANVAS_H);
  g.destroy();
}

export function ensureAgentTexture(scene: Phaser.Scene, color: number): string {
  const key = TEX.agent(color.toString(16));
  if (scene.textures.exists(key)) return key;

  const g = scene.add.graphics({ x: 0, y: 0 });
  // simple chibi-ish body: head + body in two shades
  const dark = darken(color, 0.7);
  // body
  g.fillStyle(color, 1);
  g.fillRect(8, 14, 16, 14);
  g.fillStyle(dark, 1);
  g.fillRect(8, 26, 16, 2);
  // head
  g.fillStyle(0xffd9b3, 1);
  g.fillRect(10, 4, 12, 10);
  g.fillStyle(dark, 1);
  g.fillRect(10, 12, 12, 2);
  // eyes
  g.fillStyle(0x111419, 1);
  g.fillRect(13, 8, 2, 2);
  g.fillRect(17, 8, 2, 2);

  g.generateTexture(key, TILE, TILE);
  g.destroy();
  return key;
}

function darken(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8) & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export function colorForRepo(repoId: string): number {
  // Stable color from repoId hash — same repo always gets the same shirt color.
  let h = 0;
  for (let i = 0; i < repoId.length; i++) {
    h = (h * 31 + repoId.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return hsvToHex(hue, 0.55, 0.85);
}

function hsvToHex(h: number, s: number, v: number): number {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return (R << 16) | (G << 8) | B;
}
