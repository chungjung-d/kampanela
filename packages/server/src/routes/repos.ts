import { addRepo, listRepos, removeRepo } from '@kampanela/core';
import type {
  ListReposResponse,
  RegisterRepoRequest,
  RegisterRepoResponse,
} from '@kampanela/shared';
import { json, noContent, readJson } from '../http.ts';

export async function handleListRepos(): Promise<Response> {
  const repos = await listRepos();
  const body: ListReposResponse = { repos };
  return json(body);
}

export async function handleRegisterRepo(req: Request): Promise<Response> {
  const input = await readJson<RegisterRepoRequest>(req);
  const repo = await addRepo(input);
  const body: RegisterRepoResponse = { repo };
  return json(body, { status: 201 });
}

export async function handleDeregisterRepo(id: string): Promise<Response> {
  await removeRepo(id);
  return noContent();
}
