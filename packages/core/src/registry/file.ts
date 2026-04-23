import { mkdir, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { RegistryFile } from '@kampanela/shared';
import { RegistryCorruptedError } from '../errors.ts';

const EMPTY_REGISTRY: RegistryFile = { version: 1, repos: [] };

export async function readFileOrEmpty(path: string): Promise<RegistryFile> {
  const file = Bun.file(path);
  if (!(await file.exists())) return structuredClone(EMPTY_REGISTRY);

  let raw: string;
  try {
    raw = await file.text();
  } catch (err) {
    throw new RegistryCorruptedError(path, err);
  }
  try {
    const parsed = JSON.parse(raw) as RegistryFile;
    if (parsed.version !== 1 || !Array.isArray(parsed.repos)) {
      throw new RegistryCorruptedError(path);
    }
    return parsed;
  } catch (err) {
    if (err instanceof RegistryCorruptedError) throw err;
    throw new RegistryCorruptedError(path, err);
  }
}

export async function writeAtomic(path: string, data: RegistryFile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `repos.json.tmp-${randomUUID()}`);
  await Bun.write(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, path);
}
