import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  addRepo,
  listRepos,
  getRepo,
  removeRepo,
  readRegistry,
} from './index.ts';
import { RepoPathInvalidError, RepoNotFoundError } from '../errors.ts';

let tmpHome: string;
let previousHome: string | undefined;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), 'kampanela-test-'));
  previousHome = process.env['KAMPANELA_HOME'];
  process.env['KAMPANELA_HOME'] = tmpHome;
});

afterEach(async () => {
  if (previousHome === undefined) delete process.env['KAMPANELA_HOME'];
  else process.env['KAMPANELA_HOME'] = previousHome;
  await rm(tmpHome, { recursive: true, force: true });
});

describe('registry', () => {
  test('readRegistry returns empty when file missing', async () => {
    const reg = await readRegistry();
    expect(reg).toEqual({ version: 1, repos: [] });
  });

  test('addRepo persists and getRepo retrieves', async () => {
    const repoPath = await mkdtemp(join(tmpdir(), 'kampanela-repo-'));
    try {
      const repo = await addRepo({ path: repoPath, name: 'sample' });
      expect(repo.name).toBe('sample');
      expect(repo.path).toBe(repoPath);

      const fetched = await getRepo(repo.id);
      expect(fetched?.id).toBe(repo.id);
      const all = await listRepos();
      expect(all).toHaveLength(1);
    } finally {
      await rm(repoPath, { recursive: true, force: true });
    }
  });

  test('addRepo rejects non-absolute path', async () => {
    await expect(addRepo({ path: 'relative/path' })).rejects.toBeInstanceOf(RepoPathInvalidError);
  });

  test('addRepo rejects missing directory', async () => {
    await expect(addRepo({ path: join(tmpHome, 'does-not-exist') })).rejects.toBeInstanceOf(
      RepoPathInvalidError,
    );
  });

  test('addRepo is idempotent on duplicate path', async () => {
    const repoPath = await mkdtemp(join(tmpdir(), 'kampanela-repo-'));
    try {
      const first = await addRepo({ path: repoPath });
      const second = await addRepo({ path: repoPath });
      expect(second.id).toBe(first.id);
      expect(await listRepos()).toHaveLength(1);
    } finally {
      await rm(repoPath, { recursive: true, force: true });
    }
  });

  test('removeRepo removes and throws on missing', async () => {
    const repoPath = await mkdtemp(join(tmpdir(), 'kampanela-repo-'));
    try {
      const repo = await addRepo({ path: repoPath });
      await removeRepo(repo.id);
      expect(await listRepos()).toHaveLength(0);
      await expect(removeRepo(repo.id)).rejects.toBeInstanceOf(RepoNotFoundError);
    } finally {
      await rm(repoPath, { recursive: true, force: true });
    }
  });
});
