import Phaser from 'phaser';
import { TILE } from './config.ts';

/**
 * Programmatic asset generation. No external files are required for MVP —
 * every texture the scene needs is rendered at runtime into the texture cache.
 * When real pixel-art spritesheets are dropped into `public/assets/` the
 * loader below can be extended to `load.spritesheet(...)` and AgentSprite
 * will pick them up by texture key without further changes.
 */
export const TEX = {
  floor: 'tex-floor',
  wall: 'tex-wall',
  desk: 'tex-desk',
  agent: (color: string) => `tex-agent-${color}`,
  ring: 'tex-selection-ring',
} as const;

export function generateTextures(scene: Phaser.Scene): void {
  // Checker-like floor tile
  const floor = scene.add.graphics({ x: 0, y: 0 });
  floor.fillStyle(0x1f2430, 1);
  floor.fillRect(0, 0, TILE, TILE);
  floor.fillStyle(0x262b3a, 1);
  floor.fillRect(1, 1, TILE - 2, TILE - 2);
  floor.generateTexture(TEX.floor, TILE, TILE);
  floor.destroy();

  // Wall
  const wall = scene.add.graphics({ x: 0, y: 0 });
  wall.fillStyle(0x3a3f50, 1);
  wall.fillRect(0, 0, TILE, TILE);
  wall.lineStyle(2, 0x55606d, 1);
  wall.strokeRect(1, 1, TILE - 2, TILE - 2);
  wall.generateTexture(TEX.wall, TILE, TILE);
  wall.destroy();

  // Desk (brown with top highlight)
  const desk = scene.add.graphics({ x: 0, y: 0 });
  desk.fillStyle(0x8b5e3c, 1);
  desk.fillRoundedRect(2, 4, TILE - 4, TILE - 12, 3);
  desk.fillStyle(0xa57448, 1);
  desk.fillRoundedRect(2, 4, TILE - 4, 4, 2);
  // monitor hint
  desk.fillStyle(0x111419, 1);
  desk.fillRect(TILE / 2 - 6, 8, 12, 8);
  desk.fillStyle(0x3bb273, 1);
  desk.fillRect(TILE / 2 - 5, 9, 10, 6);
  desk.generateTexture(TEX.desk, TILE, TILE);
  desk.destroy();

  // Selection ring
  const ring = scene.add.graphics({ x: 0, y: 0 });
  ring.lineStyle(2, 0xffd34d, 1);
  ring.strokeCircle(TILE / 2, TILE / 2, TILE / 2 - 2);
  ring.generateTexture(TEX.ring, TILE, TILE);
  ring.destroy();
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
