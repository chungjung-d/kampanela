/**
 * Single source of truth for grid and layout constants of the Office scene.
 * Changing a value here propagates through the scene, sprites, and pathing
 * helpers — nothing else should hardcode pixel or tile sizes.
 */
export const GRID_COLS = 16;
export const GRID_ROWS = 12;
export const TILE = 32;
export const CANVAS_W = GRID_COLS * TILE;
export const CANVAS_H = GRID_ROWS * TILE;

export const ENTRY = { col: 0, row: 6 } as const;

// Desk slots. Agents sit one tile *south* of a desk (facing up toward the desk).
export const DESK_SLOTS = [
  { col: 4, row: 4 },
  { col: 10, row: 4 },
  { col: 4, row: 8 },
  { col: 10, row: 8 },
] as const;

export type GridPoint = { col: number; row: number };

export function tileToPixel(p: GridPoint): { x: number; y: number } {
  return { x: p.col * TILE + TILE / 2, y: p.row * TILE + TILE / 2 };
}

export function assignSlot(index: number): GridPoint {
  const slot = DESK_SLOTS[index % DESK_SLOTS.length]!;
  // Sit one tile south of the desk itself.
  return { col: slot.col, row: slot.row + 1 };
}

export function deskOf(index: number): GridPoint {
  return DESK_SLOTS[index % DESK_SLOTS.length]!;
}
