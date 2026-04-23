/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import type { AgentEvent } from '@kampanela/shared';
import { formatAgentEvent } from './format-event.ts';

const base = { repoId: 'r', ts: '2026-04-24T00:00:00.000Z' } as const;

describe('formatAgentEvent', () => {
  test('stdout → output line', () => {
    const line = formatAgentEvent({ type: 'stdout', text: 'hello', ...base });
    expect(line).toEqual({ kind: 'output', text: 'hello' });
  });

  test('stderr → error line', () => {
    const line = formatAgentEvent({ type: 'stderr', text: 'oops', ...base });
    expect(line).toEqual({ kind: 'error', text: 'oops' });
  });

  test('status → status line with bullet', () => {
    const line = formatAgentEvent({ type: 'status', status: 'thinking', ...base });
    expect(line).toEqual({ kind: 'status', text: '● thinking' });
  });

  test('exit → info with code', () => {
    const line = formatAgentEvent({ type: 'exit', code: 0, ...base });
    expect(line?.kind).toBe('info');
    expect(line?.text).toContain('code=0');
  });

  test('claude_event system.init → session label', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: { type: 'system', subtype: 'init', session_id: '12345678-aaaa' },
      ...base,
    };
    const line = formatAgentEvent(ev);
    expect(line?.kind).toBe('info');
    expect(line?.text).toContain('12345678');
  });

  test('claude_event stream_event delta → skipped (null)', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: {
        type: 'stream_event',
        event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'h' } },
      },
      ...base,
    };
    expect(formatAgentEvent(ev)).toBeNull();
  });

  test('claude_event rate_limit_event → skipped', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: { type: 'rate_limit_event', rate_limit_info: {} },
      ...base,
    };
    expect(formatAgentEvent(ev)).toBeNull();
  });

  test('claude_event assistant with tool_use → action line', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: {
        type: 'assistant',
        message: {
          content: [
            { type: 'tool_use', name: 'Bash', input: { command: 'echo hi', description: 'Echo hi' } },
          ],
        },
      },
      ...base,
    };
    const line = formatAgentEvent(ev);
    expect(line?.kind).toBe('action');
    expect(line?.text).toContain('Bash');
    expect(line?.text).toContain('echo hi');
  });

  test('claude_event assistant with text → action line with speech bubble', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: {
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'Plan complete.' }] },
      },
      ...base,
    };
    const line = formatAgentEvent(ev);
    expect(line?.kind).toBe('action');
    expect(line?.text).toContain('Plan complete.');
  });

  test('claude_event user with tool_result → output line', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: {
        type: 'user',
        message: {
          content: [{ type: 'tool_result', content: 'hi', is_error: false }],
        },
      },
      ...base,
    };
    const line = formatAgentEvent(ev);
    expect(line?.kind).toBe('output');
    expect(line?.text).toContain('hi');
  });

  test('claude_event result → result line', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: { type: 'result', subtype: 'success', is_error: false, result: 'hi' },
      ...base,
    };
    const line = formatAgentEvent(ev);
    expect(line?.kind).toBe('result');
    expect(line?.text).toContain('hi');
  });

  test('claude_event with empty assistant content is skipped', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: { type: 'assistant', message: { content: [] } },
      ...base,
    };
    expect(formatAgentEvent(ev)).toBeNull();
  });

  test('malformed claude_event → null', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: null,
      ...base,
    };
    expect(formatAgentEvent(ev)).toBeNull();
  });
});
