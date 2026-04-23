export class KampanelaError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class RegistryCorruptedError extends KampanelaError {
  constructor(path: string, cause?: unknown) {
    super('REGISTRY_CORRUPTED', `Registry file at ${path} could not be parsed.`);
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export class RepoNotFoundError extends KampanelaError {
  constructor(id: string) {
    super('REPO_NOT_FOUND', `No registered repo with id: ${id}`);
  }
}

export class RepoPathInvalidError extends KampanelaError {
  constructor(path: string, reason: string) {
    super('REPO_PATH_INVALID', `Invalid repo path "${path}": ${reason}`);
  }
}

export class ClaudeCliMissingError extends KampanelaError {
  constructor(binary: string) {
    super(
      'CLAUDE_CLI_MISSING',
      `Could not launch Claude Code binary "${binary}". Is it installed and on PATH?`,
    );
  }
}

export class AlreadySpawnedError extends KampanelaError {
  constructor(repoId: string) {
    super('ALREADY_SPAWNED', `Repo ${repoId} already has an active spawn.`);
  }
}
