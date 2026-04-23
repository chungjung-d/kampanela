import type { AgentEvent } from '@kampanela/shared';
import { formatAgentEvent } from '../lib/format-event.ts';

/**
 * Pure translation from an AgentEvent to a list of scene commands.
 * Keeping this as a pure function (no Phaser imports) lets us unit-test it
 * under `bun test` and swap the renderer without touching the mapping rules.
 */
export type SceneCommand =
  | { kind: 'status'; repoId: string; status: import('@kampanela/shared').AgentStatus }
  | { kind: 'float'; repoId: string; text: string; color?: string }
  | { kind: 'move-home'; repoId: string };

export function eventToCommands(event: AgentEvent): SceneCommand[] {
  const out: SceneCommand[] = [];
  const repoId = event.repoId;

  switch (event.type) {
    case 'status':
      out.push({ kind: 'status', repoId, status: event.status });
      return out;
    case 'exit':
      out.push({ kind: 'move-home', repoId });
      out.push({ kind: 'status', repoId, status: 'stopped' });
      if (event.code !== null && event.code !== 0) {
        out.push({ kind: 'float', repoId, text: `exit ${event.code}`, color: '#ff8080' });
      }
      return out;
    case 'stdout':
    case 'stderr':
      // No scene change — handled only by BottomLog.
      return out;
    case 'claude_event': {
      const line = formatAgentEvent(event);
      if (!line) return out;
      if (line.kind === 'action') {
        out.push({ kind: 'float', repoId, text: line.text.split('\n')[0]!, color: '#ffd479' });
      } else if (line.kind === 'result') {
        out.push({ kind: 'float', repoId, text: line.text, color: '#4ade80' });
      } else if (line.kind === 'output') {
        out.push({ kind: 'float', repoId, text: line.text, color: '#9be29b' });
      }
      return out;
    }
  }
}
