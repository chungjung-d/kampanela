import { useEffect, useRef, useState } from 'react';
import type { AgentEvent } from '@kampanela/shared';
import { repoWsUrl } from '../api/spawn.ts';

const MAX_BUFFER = 500;

export function useRepoLog(repoId: string | null): {
  events: AgentEvent[];
  connected: boolean;
} {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setEvents([]);
    if (!repoId) return undefined;
    let cancelled = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

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
          setEvents((prev) => {
            const next = [...prev, data];
            return next.length > MAX_BUFFER ? next.slice(next.length - MAX_BUFFER) : next;
          });
        } catch {
          /* ignore non-JSON */
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
      wsRef.current?.close();
    };
  }, [repoId]);

  return { events, connected };
}
