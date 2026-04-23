import type { Server } from 'bun';
import { errorResponse, preflight } from './http.ts';
import type { WsData } from './session.ts';
import {
  handleDeregisterRepo,
  handleListRepos,
  handleRegisterRepo,
} from './routes/repos.ts';
import { handleStartSpawn, handleStopSpawn } from './routes/spawn.ts';
import { SessionManager } from './session.ts';

export type CreateServerOptions = {
  port?: number;
};

export type KampanelaServer = {
  readonly server: Server<WsData>;
  readonly sessions: SessionManager;
  stop(): Promise<void>;
};

const WS_PATH_RE = /^\/ws\/repos\/([^/]+)$/;
const REPO_ID_RE = /^\/api\/repos\/([^/]+)$/;
const SPAWN_RE = /^\/api\/repos\/([^/]+)\/spawn$/;
const STOP_RE = /^\/api\/repos\/([^/]+)\/stop$/;

export function createServer(opts: CreateServerOptions = {}): KampanelaServer {
  const sessions = new SessionManager();

  const server = Bun.serve<WsData>({
    port: opts.port ?? 7357,
    async fetch(req, srv) {
      const url = new URL(req.url);
      const path = url.pathname;

      if (req.method === 'OPTIONS') return preflight();

      const ws = WS_PATH_RE.exec(path);
      if (ws) {
        const repoId = ws[1]!;
        const ok = srv.upgrade(req, { data: { repoId } });
        if (ok) return undefined as unknown as Response;
        return new Response('WebSocket upgrade failed', { status: 400 });
      }

      try {
        if (path === '/api/repos' && req.method === 'GET') {
          return await handleListRepos();
        }
        if (path === '/api/repos' && req.method === 'POST') {
          return await handleRegisterRepo(req);
        }

        const spawnMatch = SPAWN_RE.exec(path);
        if (spawnMatch && req.method === 'POST') {
          return await handleStartSpawn(sessions, spawnMatch[1]!, req);
        }

        const stopMatch = STOP_RE.exec(path);
        if (stopMatch && req.method === 'POST') {
          return await handleStopSpawn(sessions, stopMatch[1]!);
        }

        const repoMatch = REPO_ID_RE.exec(path);
        if (repoMatch && req.method === 'DELETE') {
          return await handleDeregisterRepo(repoMatch[1]!);
        }

        return new Response('Not found', { status: 404 });
      } catch (err) {
        return errorResponse(err);
      }
    },
    websocket: {
      open(ws) {
        sessions.subscribe(ws.data.repoId, ws);
      },
      close(ws) {
        sessions.unsubscribe(ws.data.repoId, ws);
      },
      message() {
        // MVP: push-only. Ignore client messages.
      },
    },
  });

  return {
    server,
    sessions,
    async stop() {
      server.stop();
    },
  };
}
