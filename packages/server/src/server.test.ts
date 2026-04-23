import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, type KampanelaServer } from './server.ts';
import type {
  ListReposResponse,
  RegisterRepoResponse,
} from '@kampanela/shared';

let tmpHome: string;
let previousHome: string | undefined;
let repoPath: string;
let instance: KampanelaServer;
let baseUrl: string;

beforeEach(async () => {
  tmpHome = await mkdtemp(join(tmpdir(), 'kampanela-server-'));
  repoPath = await mkdtemp(join(tmpdir(), 'kampanela-repo-'));
  previousHome = process.env['KAMPANELA_HOME'];
  process.env['KAMPANELA_HOME'] = tmpHome;
  instance = createServer({ port: 0 });
  baseUrl = `http://localhost:${instance.server.port}`;
});

afterEach(async () => {
  await instance.stop();
  if (previousHome === undefined) delete process.env['KAMPANELA_HOME'];
  else process.env['KAMPANELA_HOME'] = previousHome;
  await rm(tmpHome, { recursive: true, force: true });
  await rm(repoPath, { recursive: true, force: true });
});

describe('server', () => {
  test('GET /api/repos returns empty list', async () => {
    const res = await fetch(`${baseUrl}/api/repos`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListReposResponse;
    expect(body.repos).toEqual([]);
  });

  test('POST /api/repos registers and GET returns it', async () => {
    const post = await fetch(`${baseUrl}/api/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: repoPath, name: 'test-repo' }),
    });
    expect(post.status).toBe(201);
    const body = (await post.json()) as RegisterRepoResponse;
    expect(body.repo.path).toBe(repoPath);
    expect(body.repo.name).toBe('test-repo');

    const get = await fetch(`${baseUrl}/api/repos`);
    const list = (await get.json()) as ListReposResponse;
    expect(list.repos).toHaveLength(1);
    expect(list.repos[0]?.id).toBe(body.repo.id);
  });

  test('POST /api/repos rejects invalid path with 400', async () => {
    const res = await fetch(`${baseUrl}/api/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'relative/path' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('REPO_PATH_INVALID');
  });

  test('DELETE /api/repos/:id removes', async () => {
    const post = await fetch(`${baseUrl}/api/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: repoPath }),
    });
    const { repo } = (await post.json()) as RegisterRepoResponse;

    const del = await fetch(`${baseUrl}/api/repos/${repo.id}`, { method: 'DELETE' });
    expect(del.status).toBe(204);

    const get = await fetch(`${baseUrl}/api/repos`);
    const list = (await get.json()) as ListReposResponse;
    expect(list.repos).toHaveLength(0);
  });

  test('unknown route returns 404', async () => {
    const res = await fetch(`${baseUrl}/does-not-exist`);
    expect(res.status).toBe(404);
  });
});
