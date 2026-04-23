import Phaser from 'phaser';
import type { AgentStatus } from '@kampanela/shared';
import { TILE, tileToPixel, type GridPoint } from '../config.ts';
import { TEX, ensureAgentTexture, colorForRepo } from '../assets.ts';

const STATUS_EMOJI: Record<AgentStatus, string | null> = {
  idle: null,
  thinking: '💭',
  tool_running: '🔧',
  waiting_user: '🤔',
  error: '❌',
  stopped: '😌',
};

export type AgentSpriteOptions = {
  repoId: string;
  repoName: string;
  home: GridPoint;
  onClick?: (repoId: string) => void;
};

export class AgentSprite {
  readonly repoId: string;
  repoName: string;
  readonly container: Phaser.GameObjects.Container;

  private readonly body: Phaser.GameObjects.Image;
  private readonly ring: Phaser.GameObjects.Image;
  private readonly nameLabel: Phaser.GameObjects.Text;
  private readonly bubble: Phaser.GameObjects.Text;
  private home: GridPoint;
  private currentStatus: AgentStatus = 'stopped';
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, opts: AgentSpriteOptions) {
    this.scene = scene;
    this.repoId = opts.repoId;
    this.repoName = opts.repoName;
    this.home = opts.home;

    const color = colorForRepo(opts.repoId);
    const texKey = ensureAgentTexture(scene, color);

    const pos = tileToPixel(this.home);
    this.container = scene.add.container(pos.x, pos.y);

    this.ring = scene.add.image(0, 0, TEX.ring);
    this.ring.setAlpha(0);

    this.body = scene.add.image(0, 0, texKey);
    this.body.setOrigin(0.5, 0.5);

    this.nameLabel = scene.add.text(0, TILE / 2 - 2, opts.repoName, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#d4d4d8',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { left: 2, right: 2 },
    });
    this.nameLabel.setOrigin(0.5, 0);

    this.bubble = scene.add.text(0, -TILE / 2 - 2, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
    });
    this.bubble.setOrigin(0.5, 1);
    this.bubble.setVisible(false);

    this.container.add([this.ring, this.body, this.nameLabel, this.bubble]);
    this.container.setSize(TILE, TILE);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-TILE / 2, -TILE / 2, TILE, TILE),
      Phaser.Geom.Rectangle.Contains,
    );
    if (opts.onClick) {
      const handler = opts.onClick;
      this.container.on('pointerdown', () => handler(this.repoId));
    }
  }

  setSelected(selected: boolean): void {
    this.scene.tweens.add({
      targets: this.ring,
      alpha: selected ? 1 : 0,
      duration: 120,
    });
  }

  setStatus(status: AgentStatus): void {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    const emoji = STATUS_EMOJI[status];
    if (emoji) {
      this.bubble.setText(emoji);
      this.bubble.setVisible(true);
    } else {
      this.bubble.setVisible(false);
    }
  }

  setHome(home: GridPoint): void {
    this.home = home;
  }

  floatText(text: string, color = '#ffffff'): void {
    const t = this.scene.add.text(this.container.x, this.container.y - TILE / 2, text, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color,
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { left: 3, right: 3, top: 1, bottom: 1 },
    });
    t.setOrigin(0.5, 1);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 24,
      alpha: 0,
      duration: 1200,
      ease: 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  moveTo(target: GridPoint, onArrive?: () => void): void {
    const pixel = tileToPixel(target);
    if (this.container.x === pixel.x && this.container.y === pixel.y) {
      onArrive?.();
      return;
    }
    // Simple two-segment path: horizontal then vertical.
    const bounce = () => {
      this.scene.tweens.add({
        targets: this.body,
        y: { from: 0, to: -2 },
        yoyo: true,
        repeat: -1,
        duration: 200,
      });
    };
    const stopBounce = () => {
      this.scene.tweens.killTweensOf(this.body);
      this.body.y = 0;
    };

    bounce();
    this.scene.tweens.add({
      targets: this.container,
      x: pixel.x,
      duration: Math.max(150, Math.abs(this.container.x - pixel.x) * 6),
      ease: 'Linear',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.container,
          y: pixel.y,
          duration: Math.max(150, Math.abs(this.container.y - pixel.y) * 6),
          ease: 'Linear',
          onComplete: () => {
            stopBounce();
            onArrive?.();
          },
        });
      },
    });
  }

  moveHome(onArrive?: () => void): void {
    this.moveTo(this.home, onArrive);
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.body);
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy();
  }
}
