import { homedir } from 'node:os';
import { join } from 'node:path';

export function kampanelaDir(): string {
  const override = process.env['KAMPANELA_HOME'];
  if (override && override.length > 0) return override;
  return join(homedir(), '.kampanela');
}

export function registryPath(): string {
  return join(kampanelaDir(), 'repos.json');
}
