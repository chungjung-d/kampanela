import type { SpawnRequest, SpawnResponse, StopResponse, ApiError } from '@kampanela/shared';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as ApiError;
      message = body.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function startSpawn(repoId: string, input: SpawnRequest = {}): Promise<SpawnResponse> {
  const res = await fetch(`${BASE}/api/repos/${repoId}/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handle<SpawnResponse>(res);
}

export async function stopSpawn(repoId: string): Promise<StopResponse> {
  const res = await fetch(`${BASE}/api/repos/${repoId}/stop`, { method: 'POST' });
  return handle<StopResponse>(res);
}

// WebSocket connects directly to the server, bypassing the Vite dev proxy.
// Vite's `/ws` + `ws: true` proxy fails silently on upgrade in this project —
// see docs/plan/archive/20260424-fix-vite-ws-proxy/reason.md.
const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ?? 'ws://localhost:7357';

export function repoWsUrl(repoId: string): string {
  return `${WS_BASE}/ws/repos/${repoId}`;
}
