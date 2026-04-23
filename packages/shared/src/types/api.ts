import type { RegisteredRepo } from './repo.ts';

export type RegisterRepoRequest = {
  path: string;
  name?: string;
  role?: string;
};

export type SpawnRequest = {
  prompt?: string;
  sessionId?: string;
  model?: string;
  extraArgs?: string[];
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ListReposResponse = { repos: RegisteredRepo[] };
export type RegisterRepoResponse = { repo: RegisteredRepo };
export type SpawnResponse = { repoId: string; pid: number; sessionId?: string };
export type StopResponse = { repoId: string; stopped: boolean };
