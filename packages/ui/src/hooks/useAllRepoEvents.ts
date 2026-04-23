import { useEffect, useRef, useState } from 'react';
import type { AgentEvent } from '@kampanela/shared';
import { repoWsUrl } from '../api/spawn.ts';

/**
 * Subscribe to one WebSocket per repoId in parallel. Each incoming message
 * is surfaced through `onEvent` as soon as it arrives. `connected` reports
 * per-repo state for the UI.
 *
 * We do not buffer events in state — the Phaser scene owns its own state
 * machine. The React layer only cares about "did we receive this event"
 * to update per-repo connection indicators.
 */
export function useAllRepoEvents(
  repoIds: string[],
  onEvent: (event: AgentEvent) => void,
): { connected: Record<string, boolean> } {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const sockets = new Map<string, WebSocket>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const retries = new Map<string, number>();
    let cancelled = false;

    const connect = (repoId: string) => {
      if (cancelled) return;
      const ws = new WebSocket(repoWsUrl(repoId));
      sockets.set(repoId, ws);

      ws.addEventListener('open', () => {
        retries.set(repoId, 0);
        setConnected((s) => ({ ...s, [repoId]: true }));
      });

      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as AgentEvent;
          onEventRef.current(data);
        } catch {
          /* ignore malformed */
        }
      });

      ws.addEventListener('close', () => {
        setConnected((s) => ({ ...s, [repoId]: false }));
        if (cancelled) return;
        const r = (retries.get(repoId) ?? 0) + 1;
        retries.set(repoId, r);
        const delay = Math.min(1000 * 2 ** (r - 1), 5000);
        const timer = setTimeout(() => connect(repoId), delay);
        timers.set(repoId, timer);
      });

      ws.addEventListener('error', () => ws.close());
    };

    for (const id of repoIds) connect(id);

    return () => {
      cancelled = true;
      for (const t of timers.values()) clearTimeout(t);
      for (const ws of sockets.values()) ws.close();
    };
  }, [repoIds.join(',')]); // re-subscribe when the id set changes

  return { connected };
}
