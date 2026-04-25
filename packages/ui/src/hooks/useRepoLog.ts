import { useEffect, useRef, useState } from 'react';
import type { AgentEvent } from '@kampanela/shared';
import { repoWsUrl } from '../api/spawn.ts';

const MAX_BUFFER = 300;

/**
 * Subscribe to a single repo's WebSocket stream and expose an append-only
 * list of recent events for the log panel.
 *
 * Important perf choice: messages are pushed into a ref synchronously and
 * flushed to React state at most **once per animation frame**. Claude's
 * stream-json mode can emit dozens of delta events per second during a
 * single tool_use; without batching, each message would trigger a React
 * re-render of the log panel, burning the main thread.
 */
export function useRepoLog(repoId: string | null): {
  events: AgentEvent[];
  connected: boolean;
} {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const bufferRef = useRef<AgentEvent[]>([]);
  const pendingRef = useRef<AgentEvent[]>([]);
  const rafRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Reset on repoId change.
    bufferRef.current = [];
    pendingRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setEvents([]);

    if (!repoId) return undefined;
    let cancelled = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleFlush = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingRef.current;
        if (pending.length === 0) return;
        pendingRef.current = [];
        let next = bufferRef.current.concat(pending);
        if (next.length > MAX_BUFFER) next = next.slice(next.length - MAX_BUFFER);
        bufferRef.current = next;
        setEvents(next);
      });
    };

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(repoWsUrl(repoId));
      wsRef.current = ws;
      ws.addEventListener('open', () => {
        setConnected(true);
        retry = 0;
      });
      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as AgentEvent;
          pendingRef.current.push(data);
          scheduleFlush();
        } catch {
          /* ignore */
        }
      });
      ws.addEventListener('close', () => {
        setConnected(false);
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** retry, 5000);
        retry += 1;
        timer = setTimeout(connect, delay);
      });
      ws.addEventListener('error', () => ws.close());
    };

    connect();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      wsRef.current?.close();
    };
  }, [repoId]);

  return { events, connected };
}
