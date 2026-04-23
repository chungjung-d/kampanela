import Phaser from 'phaser';
import type { RegisteredRepo, AgentEvent } from '@kampanela/shared';
import {
  CANVAS_W,
  CANVAS_H,
  GRID_COLS,
  GRID_ROWS,
  TILE,
  ENTRY,
  assignSlot,
  deskOf,
  tileToPixel,
} from '../config.ts';
import { TEX, generateTextures } from '../assets.ts';
import { AgentSprite } from '../sprites/AgentSprite.ts';
import { eventToCommands } from '../controller.ts';

export type OfficeSceneBindings = {
  onSelect: (repoId: string) => void;
};

export class OfficeScene extends Phaser.Scene {
  private readonly agents = new Map<string, AgentSprite>();
  private repos: RegisteredRepo[] = [];
  private selectedId: string | null = null;
  private bindings: OfficeSceneBindings | null = null;

  private pendingRepos: RegisteredRepo[] | null = null;
  private pendingSelection: string | null | undefined = undefined;
  private ready = false;

  constructor() {
    super('OfficeScene');
  }

  setBindings(b: OfficeSceneBindings): void {
    this.bindings = b;
  }

  create(): void {
    generateTextures(this);
    this.drawFloor();
    this.drawWalls();
    this.drawDesks();

    this.events.on('set-repos', (repos: RegisteredRepo[]) => this.applyRepos(repos));
    this.events.on('set-selected', (id: string | null) => this.applySelected(id));
    this.events.on('agent-event', (event: AgentEvent) => this.applyEvent(event));
    this.events.on('spawn-start', (repoId: string) => this.animateSpawnStart(repoId));

    this.ready = true;
    if (this.pendingRepos) {
      this.applyRepos(this.pendingRepos);
      this.pendingRepos = null;
    }
    if (this.pendingSelection !== undefined) {
      this.applySelected(this.pendingSelection);
      this.pendingSelection = undefined;
    }
  }

  pushRepos(repos: RegisteredRepo[]): void {
    if (!this.ready) {
      this.pendingRepos = repos;
      return;
    }
    this.applyRepos(repos);
  }

  pushSelected(id: string | null): void {
    if (!this.ready) {
      this.pendingSelection = id;
      return;
    }
    this.applySelected(id);
  }

  pushEvent(event: AgentEvent): void {
    if (!this.ready) return;
    this.applyEvent(event);
  }

  private drawFloor(): void {
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const { x, y } = tileToPixel({ col: c, row: r });
        this.add.image(x, y, TEX.floor).setOrigin(0.5, 0.5);
      }
    }
  }

  private drawWalls(): void {
    // Top/bottom
    for (let c = 0; c < GRID_COLS; c++) {
      const top = tileToPixel({ col: c, row: 0 });
      const bot = tileToPixel({ col: c, row: GRID_ROWS - 1 });
      this.add.image(top.x, top.y, TEX.wall);
      this.add.image(bot.x, bot.y, TEX.wall);
    }
    // Sides (skip entry)
    for (let r = 0; r < GRID_ROWS; r++) {
      if (r !== ENTRY.row) {
        const left = tileToPixel({ col: 0, row: r });
        this.add.image(left.x, left.y, TEX.wall);
      }
      const right = tileToPixel({ col: GRID_COLS - 1, row: r });
      this.add.image(right.x, right.y, TEX.wall);
    }
  }

  private drawDesks(): void {
    for (let i = 0; i < 4; i++) {
      const pos = tileToPixel(deskOf(i));
      this.add.image(pos.x, pos.y, TEX.desk);
    }
  }

  applyRepos(repos: RegisteredRepo[]): void {
    this.repos = repos;
    const incomingIds = new Set(repos.map((r) => r.id));

    // Remove agents for un-registered repos.
    for (const [id, sprite] of this.agents) {
      if (!incomingIds.has(id)) {
        sprite.destroy();
        this.agents.delete(id);
      }
    }

    // Add / reposition agents for current repos.
    repos.forEach((repo, idx) => {
      const home = assignSlot(idx);
      const existing = this.agents.get(repo.id);
      if (existing) {
        existing.repoName = repo.name;
        existing.setHome(home);
        return;
      }
      const sprite = new AgentSprite(this, {
        repoId: repo.id,
        repoName: repo.name,
        home,
        onClick: (id) => this.bindings?.onSelect(id),
      });
      this.agents.set(repo.id, sprite);
    });

    this.applySelected(this.selectedId);
  }

  applySelected(id: string | null): void {
    this.selectedId = id;
    for (const [aid, sprite] of this.agents) {
      sprite.setSelected(aid === id);
    }
  }

  applyEvent(event: AgentEvent): void {
    const sprite = this.agents.get(event.repoId);
    if (!sprite) return;
    const commands = eventToCommands(event);
    for (const cmd of commands) {
      switch (cmd.kind) {
        case 'status':
          sprite.setStatus(cmd.status);
          break;
        case 'float':
          sprite.floatText(cmd.text, cmd.color);
          break;
        case 'move-home':
          sprite.moveHome();
          break;
      }
    }
  }

  private animateSpawnStart(repoId: string): void {
    const sprite = this.agents.get(repoId);
    if (!sprite) return;
    sprite.setStatus('thinking');
    const entry = ENTRY;
    const entryPx = tileToPixel(entry);
    sprite.container.setPosition(entryPx.x, entryPx.y);
    sprite.moveHome();
  }
}

export const OFFICE_CANVAS_SIZE = { width: CANVAS_W, height: CANVAS_H, tile: TILE } as const;
