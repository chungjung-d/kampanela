import { randomUUID } from 'node:crypto';
import { basename, isAbsolute } from 'node:path';
import { stat } from 'node:fs/promises';
import type { RegisteredRepo, RegistryFile } from '@kampanela/shared';
import { registryPath } from '../paths.ts';
import { RepoNotFoundError, RepoPathInvalidError } from '../errors.ts';
import { readFileOrEmpty, writeAtomic } from './file.ts';

export async function readRegistry(): Promise<RegistryFile> {
  return readFileOrEmpty(registryPath());
}

export async function writeRegistry(data: RegistryFile): Promise<void> {
  await writeAtomic(registryPath(), data);
}

export async function listRepos(): Promise<RegisteredRepo[]> {
  const reg = await readRegistry();
  return reg.repos;
}

export async function getRepo(id: string): Promise<RegisteredRepo | undefined> {
  const reg = await readRegistry();
  return reg.repos.find((r) => r.id === id);
}

export async function requireRepo(id: string): Promise<RegisteredRepo> {
  const repo = await getRepo(id);
  if (!repo) throw new RepoNotFoundError(id);
  return repo;
}

export type AddRepoInput = {
  path: string;
  name?: string;
  role?: string;
};

async function assertDirectory(path: string): Promise<void> {
  // Bun.file() treats directories as non-existent; use node:fs.stat for type check.
  let info;
  try {
    info = await stat(path);
  } catch {
    throw new RepoPathInvalidError(path, 'does not exist');
  }
  if (!info.isDirectory()) {
    throw new RepoPathInvalidError(path, 'is not a directory');
  }
}

export async function addRepo(input: AddRepoInput): Promise<RegisteredRepo> {
  if (!isAbsolute(input.path)) {
    throw new RepoPathInvalidError(input.path, 'must be an absolute path');
  }
  await assertDirectory(input.path);

  const reg = await readRegistry();
  const existing = reg.repos.find((r) => r.path === input.path);
  if (existing) return existing;

  const repo: RegisteredRepo = {
    id: randomUUID(),
    name: input.name ?? basename(input.path),
    path: input.path,
    ...(input.role !== undefined ? { role: input.role } : {}),
    addedAt: new Date().toISOString(),
  };
  reg.repos.push(repo);
  await writeRegistry(reg);
  return repo;
}

export async function removeRepo(id: string): Promise<void> {
  const reg = await readRegistry();
  const idx = reg.repos.findIndex((r) => r.id === id);
  if (idx === -1) throw new RepoNotFoundError(id);
  reg.repos.splice(idx, 1);
  await writeRegistry(reg);
}
