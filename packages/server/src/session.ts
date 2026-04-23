import type { ServerWebSocket } from 'bun';
import type { SpawnHandle } from '@kampanela/core';
import type { AgentEvent } from '@kampanela/shared';
import { AlreadySpawnedError } from '@kampanela/core';

export type WsData = { repoId: string };

type Session = {
  handle: SpawnHandle;
  subscribers: Set<ServerWebSocket<WsData>>;
  lastEventByType: Map<string, AgentEvent>;
};

export class SessionManager {
  private readonly sessions = new Map<string, Session>();

  has(repoId: string): boolean {
    return this.sessions.has(repoId);
  }

  register(handle: SpawnHandle): Session {
    if (this.sessions.has(handle.repoId)) {
      throw new AlreadySpawnedError(handle.repoId);
    }
    const session: Session = {
      handle,
      subscribers: new Set(),
      lastEventByType: new Map(),
    };
    this.sessions.set(handle.repoId, session);

    handle.on('event', (event) => {
      session.lastEventByType.set(event.type, event);
      const message = JSON.stringify(event);
      for (const ws of session.subscribers) {
        ws.send(message);
      }
    });
    handle.on('exit', () => {
      this.sessions.delete(handle.repoId);
    });
    return session;
  }

  get(repoId: string): Session | undefined {
    return this.sessions.get(repoId);
  }

  subscribe(repoId: string, ws: ServerWebSocket<WsData>): void {
    const session = this.sessions.get(repoId);
    if (!session) return;
    session.subscribers.add(ws);
    for (const event of session.lastEventByType.values()) {
      ws.send(JSON.stringify(event));
    }
  }

  unsubscribe(repoId: string, ws: ServerWebSocket<WsData>): void {
    const session = this.sessions.get(repoId);
    session?.subscribers.delete(ws);
  }

  async stop(repoId: string): Promise<boolean> {
    const session = this.sessions.get(repoId);
    if (!session) return false;
    await session.handle.stop();
    this.sessions.delete(repoId);
    return true;
  }
}
