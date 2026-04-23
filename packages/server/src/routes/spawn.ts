import { spawn } from '@kampanela/core';
import type { SpawnRequest, SpawnResponse, StopResponse } from '@kampanela/shared';
import { json, readJson } from '../http.ts';
import type { SessionManager } from '../session.ts';

export async function handleStartSpawn(
  sessions: SessionManager,
  repoId: string,
  req: Request,
): Promise<Response> {
  const body = req.body ? await readJson<SpawnRequest>(req) : {};
  const handle = await spawn(repoId, body);
  sessions.register(handle);
  const res: SpawnResponse = {
    repoId: handle.repoId,
    pid: handle.pid,
    ...(handle.sessionId !== undefined ? { sessionId: handle.sessionId } : {}),
  };
  return json(res, { status: 201 });
}

export async function handleStopSpawn(
  sessions: SessionManager,
  repoId: string,
): Promise<Response> {
  const stopped = await sessions.stop(repoId);
  const res: StopResponse = { repoId, stopped };
  return json(res);
}
