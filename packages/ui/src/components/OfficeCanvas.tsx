import { useEffect, useRef, type JSX } from 'react';
import Phaser from 'phaser';
import type { AgentEvent, RegisteredRepo } from '@kampanela/shared';
import { OfficeScene, OFFICE_CANVAS_SIZE } from '../phaser/scenes/OfficeScene.ts';
import { useAllRepoEvents } from '../hooks/useAllRepoEvents.ts';

type Props = {
  repos: RegisteredRepo[];
  selectedId: string | null;
  onSelect: (repoId: string) => void;
  onSpawnStart?: (repoId: string) => void;
};

export function OfficeCanvas({ repos, selectedId, onSelect, onSpawnStart: _onSpawnStart }: Props): JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<OfficeScene | null>(null);

  // Mount Phaser game once (React StrictMode double-effect is handled by destroy on cleanup).
  useEffect(() => {
    if (!hostRef.current) return undefined;
    const scene = new OfficeScene();
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: OFFICE_CANVAS_SIZE.width,
      height: OFFICE_CANVAS_SIZE.height,
      parent: hostRef.current,
      backgroundColor: '#10131a',
      pixelArt: true,
      scene: scene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setBindings({ onSelect });
  }, [onSelect]);

  useEffect(() => {
    sceneRef.current?.pushRepos(repos);
  }, [repos]);

  useEffect(() => {
    sceneRef.current?.pushSelected(selectedId);
  }, [selectedId]);

  useAllRepoEvents(
    repos.map((r) => r.id),
    (event: AgentEvent) => {
      sceneRef.current?.pushEvent(event);
    },
  );

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        aspectRatio: `${OFFICE_CANVAS_SIZE.width} / ${OFFICE_CANVAS_SIZE.height}`,
        background: '#10131a',
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
}
