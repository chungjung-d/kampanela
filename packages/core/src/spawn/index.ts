import { requireRepo } from '../registry/index.ts';
import { spawnClaude } from './process.ts';
import type { SpawnHandle, SpawnOptions } from './process.ts';

export type { SpawnHandle, SpawnOptions } from './process.ts';

export async function spawn(repoId: string, opts: SpawnOptions = {}): Promise<SpawnHandle> {
  const repo = await requireRepo(repoId);
  return spawnClaude(repo.id, repo.path, opts);
}

export { spawnClaude };
