import { EventEmitter } from 'node:events';
import type { AgentEvent } from '@kampanela/shared';
import { ClaudeCliMissingError } from '../errors.ts';
import { makeEvent, deriveStatus } from './events.ts';

export type SpawnOptions = {
  prompt?: string;
  sessionId?: string;
  model?: string;
  extraArgs?: string[];
};

export type SpawnHandle = {
  readonly repoId: string;
  readonly pid: number;
  readonly sessionId: string | undefined;
  on(event: 'event', listener: (e: AgentEvent) => void): SpawnHandle;
  on(event: 'exit', listener: (code: number | null) => void): SpawnHandle;
  off(event: 'event' | 'exit', listener: (...args: never[]) => void): SpawnHandle;
  stop(signal?: NodeJS.Signals): Promise<void>;
};

function buildArgs(opts: SpawnOptions): string[] {
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--include-partial-messages'];
  if (opts.sessionId) args.push('--session-id', opts.sessionId);
  if (opts.model) args.push('--model', opts.model);
  if (opts.extraArgs) args.push(...opts.extraArgs);
  if (opts.prompt !== undefined) args.push(opts.prompt);
  return args;
}

async function consumeLines(
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
  onFlush: (tail: string) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        if (buffer.length > 0) {
          onFlush(buffer);
          buffer = '';
        }
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.length === 0) continue;
        onLine(line);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function spawnClaude(
  repoId: string,
  cwd: string,
  opts: SpawnOptions = {},
): SpawnHandle {
  const binary = process.env['KAMPANELA_CLAUDE_BIN'] ?? 'claude';
  const args = buildArgs(opts);

  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn([binary, ...args], {
      cwd,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') throw new ClaudeCliMissingError(binary);
    throw err;
  }

  if (typeof proc.pid !== 'number') {
    throw new ClaudeCliMissingError(binary);
  }

  const emitter = new EventEmitter();
  const pid = proc.pid;

  const emitEvent = (e: AgentEvent) => {
    emitter.emit('event', e);
    if (e.type === 'claude_event') {
      const status = deriveStatus(e.payload);
      if (status) {
        emitter.emit('event', {
          type: 'status',
          status,
          repoId,
          ts: new Date().toISOString(),
        } satisfies AgentEvent);
      }
    }
  };

  const now = () => new Date().toISOString();

  void consumeLines(
    proc.stdout as ReadableStream<Uint8Array>,
    (line) => emitEvent(makeEvent({ repoId, ts: now() }, line)),
    (tail) => emitEvent(makeEvent({ repoId, ts: now() }, tail)),
  );
  void consumeLines(
    proc.stderr as ReadableStream<Uint8Array>,
    (line) => emitEvent({ type: 'stderr', text: line, repoId, ts: now() }),
    (tail) => emitEvent({ type: 'stderr', text: tail, repoId, ts: now() }),
  );

  void proc.exited.then((code) => {
    emitter.emit('event', {
      type: 'exit',
      code: typeof code === 'number' ? code : null,
      repoId,
      ts: now(),
    } satisfies AgentEvent);
    emitter.emit('exit', typeof code === 'number' ? code : null);
  });

  const handle: SpawnHandle = {
    repoId,
    pid,
    sessionId: opts.sessionId,
    on(event, listener) {
      emitter.on(event, listener as (...args: unknown[]) => void);
      return handle;
    },
    off(event, listener) {
      emitter.off(event, listener as (...args: unknown[]) => void);
      return handle;
    },
    async stop(signal: NodeJS.Signals = 'SIGTERM') {
      if (proc.exitCode !== null) return;
      proc.kill(signal);
      await proc.exited;
    },
  };
  return handle;
}
