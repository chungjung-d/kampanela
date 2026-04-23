import type { AgentStatus } from './agent.ts';

type Base = {
  repoId: string;
  ts: string;
};

export type AgentEvent =
  | (Base & { type: 'stdout'; text: string })
  | (Base & { type: 'stderr'; text: string })
  | (Base & { type: 'claude_event'; payload: unknown })
  | (Base & { type: 'status'; status: AgentStatus })
  | (Base & { type: 'exit'; code: number | null });
