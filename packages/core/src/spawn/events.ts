import type { AgentEvent, AgentStatus } from '@kampanela/shared';

export type ParsedLine =
  | { kind: 'json'; payload: unknown }
  | { kind: 'text'; text: string };

export function parseStdoutLine(line: string): ParsedLine {
  const trimmed = line.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { kind: 'json', payload: JSON.parse(trimmed) };
    } catch {
      return { kind: 'text', text: line };
    }
  }
  return { kind: 'text', text: line };
}

export function deriveStatus(payload: unknown): AgentStatus | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const obj = payload as Record<string, unknown>;
  const type = typeof obj['type'] === 'string' ? (obj['type'] as string) : undefined;
  switch (type) {
    case 'message_start':
    case 'content_block_start':
      return 'thinking';
    case 'tool_use':
      return 'tool_running';
    case 'message_stop':
    case 'result':
      return 'idle';
    default:
      return undefined;
  }
}

export function makeEvent(base: { repoId: string; ts: string }, line: string): AgentEvent {
  const parsed = parseStdoutLine(line);
  if (parsed.kind === 'json') {
    return { type: 'claude_event', payload: parsed.payload, ...base };
  }
  return { type: 'stdout', text: parsed.text, ...base };
}
