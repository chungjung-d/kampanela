import { useCallback, useEffect, useState } from 'react';
import type { RegisteredRepo, RegisterRepoRequest } from '@kampanela/shared';
import { listRepos, registerRepo, deregisterRepo } from '../api/repos.ts';

export type UseReposResult = {
  repos: RegisteredRepo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  register: (input: RegisterRepoRequest) => Promise<RegisteredRepo>;
  remove: (id: string) => Promise<void>;
};

export function useRepos(): UseReposResult {
  const [repos, setRepos] = useState<RegisteredRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRepos(await listRepos());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const register = useCallback(async (input: RegisterRepoRequest) => {
    const repo = await registerRepo(input);
    setRepos((prev) => {
      if (prev.some((r) => r.id === repo.id)) return prev;
      return [...prev, repo];
    });
    return repo;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deregisterRepo(id);
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { repos, loading, error, refresh, register, remove };
}
