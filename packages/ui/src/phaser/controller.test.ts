/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import type { AgentEvent } from '@kampanela/shared';
import { eventToCommands } from './controller.ts';

const base = { repoId: 'r', ts: '2026-04-24T00:00:00.000Z' } as const;

describe('eventToCommands', () => {
  test('status event produces a status command', () => {
    const ev: AgentEvent = { type: 'status', status: 'thinking', ...base };
    expect(eventToCommands(ev)).toEqual([{ kind: 'status', repoId: 'r', status: 'thinking' }]);
  });

  test('exit 0 moves home and marks stopped', () => {
    const ev: AgentEvent = { type: 'exit', code: 0, ...base };
    expect(eventToCommands(ev)).toEqual([
      { kind: 'move-home', repoId: 'r' },
      { kind: 'status', repoId: 'r', status: 'stopped' },
    ]);
  });

  test('exit non-zero also emits a float warning', () => {
    const ev: AgentEvent = { type: 'exit', code: 2, ...base };
    const cmds = eventToCommands(ev);
    expect(cmds).toHaveLength(3);
    expect(cmds[2]).toEqual({
      kind: 'float',
      repoId: 'r',
      text: 'exit 2',
      color: '#ff8080',
    });
  });

  test('stdout/stderr produce no scene commands', () => {
    const so: AgentEvent = { type: 'stdout', text: 'hello', ...base };
    const se: AgentEvent = { type: 'stderr', text: 'oops', ...base };
    expect(eventToCommands(so)).toEqual([]);
    expect(eventToCommands(se)).toEqual([]);
  });

  test('claude_event tool_use floats a single-line action', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: {
        type: 'assistant',
        message: {
          content: [{ type: 'tool_use', name: 'Bash', input: { command: 'echo hi' } }],
        },
      },
      ...base,
    };
    const cmds = eventToCommands(ev);
    expect(cmds).toHaveLength(1);
    expect(cmds[0]?.kind).toBe('float');
    if (cmds[0]?.kind === 'float') {
      expect(cmds[0].text).toContain('Bash');
      expect(cmds[0].text).not.toContain('\n');
    }
  });

  test('claude_event result floats success', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: { type: 'result', subtype: 'success', is_error: false, result: 'hi' },
      ...base,
    };
    const cmds = eventToCommands(ev);
    expect(cmds).toHaveLength(1);
    expect(cmds[0]?.kind).toBe('float');
    if (cmds[0]?.kind === 'float') {
      expect(cmds[0].text).toContain('hi');
      expect(cmds[0].color).toBe('#4ade80');
    }
  });

  test('noisy claude_event like rate_limit is skipped entirely', () => {
    const ev: AgentEvent = {
      type: 'claude_event',
      payload: { type: 'rate_limit_event', rate_limit_info: {} },
      ...base,
    };
    expect(eventToCommands(ev)).toEqual([]);
  });
});
