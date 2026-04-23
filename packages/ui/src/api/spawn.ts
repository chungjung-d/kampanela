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

export function repoWsUrl(repoId: string): string {
  if (BASE.length === 0) {
    const origin = window.location.origin.replace(/^http/, 'ws');
    return `${origin}/ws/repos/${repoId}`;
  }
  return `${BASE.replace(/^http/, 'ws')}/ws/repos/${repoId}`;
}
