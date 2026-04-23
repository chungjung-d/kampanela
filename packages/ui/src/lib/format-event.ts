import type { AgentEvent } from '@kampanela/shared';

export type FormattedKind = 'info' | 'status' | 'action' | 'output' | 'result' | 'error';

export type FormattedLine = {
  kind: FormattedKind;
  text: string;
};

/**
 * Collapse raw AgentEvent payloads into human-readable one-liners.
 *
 * Returning null means "this event is noise, skip it" — e.g. per-character
 * streaming deltas, rate-limit heartbeats. The UI still has the full payload
 * in memory for a raw view toggle.
 */
export function formatAgentEvent(e: AgentEvent): FormattedLine | null {
  switch (e.type) {
    case 'stdout':
      return { kind: 'output', text: e.text };
    case 'stderr':
      return { kind: 'error', text: e.text };
    case 'status':
      return { kind: 'status', text: `● ${e.status}` };
    case 'exit':
      return { kind: 'info', text: `exit code=${e.code ?? 'null'}` };
    case 'claude_event':
      return formatClaudeEvent(e.payload);
  }
}

type Obj = Record<string, unknown>;

function asObj(v: unknown): Obj | null {
  return v && typeof v === 'object' ? (v as Obj) : null;
}

function asArr(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null;
}

function asStr(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function clip(s: string, max = 200): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function formatClaudeEvent(payload: unknown): FormattedLine | null {
  const p = asObj(payload);
  if (!p) return null;
  const type = asStr(p['type']);

  if (type === 'system') {
    const sub = asStr(p['subtype']);
    if (sub === 'init') {
      const sid = asStr(p['session_id']);
      return {
        kind: 'info',
        text: `🔌 session ${sid ? sid.slice(0, 8) : '?'} started`,
      };
    }
    if (sub === 'status') {
      const status = asStr(p['status']);
      if (status) return { kind: 'status', text: `⏳ ${status}` };
    }
    return null;
  }

  if (type === 'rate_limit_event') return null;

  if (type === 'stream_event') {
    // Per-character deltas are too noisy for the readable feed.
    // The completed message blocks arrive as type: 'assistant' later.
    return null;
  }

  if (type === 'assistant') {
    const message = asObj(p['message']);
    const content = asArr(message?.['content']);
    if (!content) return null;
    const pieces: string[] = [];
    for (const raw of content) {
      const c = asObj(raw);
      if (!c) continue;
      const t = asStr(c['type']);
      if (t === 'tool_use') {
        const name = asStr(c['name']) ?? 'tool';
        const input = c['input'];
        const summary = input === undefined ? '' : clip(JSON.stringify(input), 160);
        pieces.push(`🔧 ${name}(${summary})`);
      } else if (t === 'text') {
        const text = asStr(c['text']);
        if (text && text.length > 0) pieces.push(`💬 ${clip(text, 400)}`);
      }
    }
    if (pieces.length === 0) return null;
    return { kind: 'action', text: pieces.join('\n') };
  }

  if (type === 'user') {
    const message = asObj(p['message']);
    const content = asArr(message?.['content']);
    if (!content) return null;
    for (const raw of content) {
      const c = asObj(raw);
      if (!c) continue;
      if (asStr(c['type']) === 'tool_result') {
        const inner = c['content'];
        const text = typeof inner === 'string' ? inner : JSON.stringify(inner);
        return { kind: 'output', text: `📥 ${clip(text, 300)}` };
      }
    }
    return null;
  }

  if (type === 'result') {
    const result = asStr(p['result']);
    if (result) return { kind: 'result', text: `✅ ${clip(result, 400)}` };
    return null;
  }

  return null;
}
