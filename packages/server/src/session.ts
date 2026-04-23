import type { ServerWebSocket } from 'bun';
import type { SpawnHandle } from '@kampanela/core';
import type { AgentEvent } from '@kampanela/shared';
import { AlreadySpawnedError } from '@kampanela/core';

export type WsData = { repoId: string };

type Session = {
  handle: SpawnHandle;
  lastEventByType: Map<string, AgentEvent>;
};

/**
 * SessionManager separates **subscriber tracking** from **session lifetime** on purpose:
 *
 * - Subscribers are WebSockets listening to a repoId. They may connect before any
 *   spawn exists (the normal UI flow: user opens repo view → UI opens WS → user
 *   clicks Spawn later). Their presence must be recorded regardless.
 * - Sessions are the actual running spawn handles. They may come and go. When
 *   one exists, its events are broadcast to whichever subscribers are currently
 *   registered for that repoId.
 *
 * Collapsing these into one map (as the original implementation did) silently
 * dropped subscriptions taken before the first spawn — see
 * docs/plan/archive/20260424-fix-ws-subscriber-timing/reason.md.
 */
export class SessionManager {
  private readonly sessions = new Map<string, Session>();
  private readonly subscribers = new Map<string, Set<ServerWebSocket<WsData>>>();

  has(repoId: string): boolean {
    return this.sessions.has(repoId);
  }

  register(handle: SpawnHandle): Session {
    if (this.sessions.has(handle.repoId)) {
      throw new AlreadySpawnedError(handle.repoId);
    }
    const session: Session = { handle, lastEventByType: new Map() };
    this.sessions.set(handle.repoId, session);

    handle.on('event', (event) => {
      session.lastEventByType.set(event.type, event);
      this.broadcast(handle.repoId, event);
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
    let set = this.subscribers.get(repoId);
    if (!set) {
      set = new Set();
      this.subscribers.set(repoId, set);
    }
    set.add(ws);

    const session = this.sessions.get(repoId);
    if (session) {
      for (const event of session.lastEventByType.values()) {
        ws.send(JSON.stringify(event));
      }
    }
  }

  unsubscribe(repoId: string, ws: ServerWebSocket<WsData>): void {
    const set = this.subscribers.get(repoId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) this.subscribers.delete(repoId);
  }

  async stop(repoId: string): Promise<boolean> {
    const session = this.sessions.get(repoId);
    if (!session) return false;
    await session.handle.stop();
    this.sessions.delete(repoId);
    return true;
  }

  private broadcast(repoId: string, event: AgentEvent): void {
    const set = this.subscribers.get(repoId);
    if (!set || set.size === 0) return;
    const message = JSON.stringify(event);
    for (const ws of set) {
      ws.send(message);
    }
  }
}
