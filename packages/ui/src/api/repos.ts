import type {
  ListReposResponse,
  RegisterRepoRequest,
  RegisterRepoResponse,
  ApiError,
} from '@kampanela/shared';

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
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function listRepos() {
  const res = await fetch(`${BASE}/api/repos`);
  const body = await handle<ListReposResponse>(res);
  return body.repos;
}

export async function registerRepo(input: RegisterRepoRequest) {
  const res = await fetch(`${BASE}/api/repos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await handle<RegisterRepoResponse>(res);
  return body.repo;
}

export async function deregisterRepo(id: string) {
  const res = await fetch(`${BASE}/api/repos/${id}`, { method: 'DELETE' });
  await handle<void>(res);
}
