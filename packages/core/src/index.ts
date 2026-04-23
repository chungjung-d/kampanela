export {
  readRegistry,
  writeRegistry,
  listRepos,
  getRepo,
  requireRepo,
  addRepo,
  removeRepo,
  type AddRepoInput,
} from './registry/index.ts';

export { spawn, type SpawnHandle, type SpawnOptions } from './spawn/index.ts';

export { kampanelaDir, registryPath } from './paths.ts';

export {
  KampanelaError,
  RegistryCorruptedError,
  RepoNotFoundError,
  RepoPathInvalidError,
  ClaudeCliMissingError,
  AlreadySpawnedError,
} from './errors.ts';
