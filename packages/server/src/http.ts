import type { ApiError } from '@kampanela/shared';
import { KampanelaError } from '@kampanela/core';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function json<T>(body: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

function statusFor(code: string): number {
  switch (code) {
    case 'REPO_NOT_FOUND':
      return 404;
    case 'REPO_PATH_INVALID':
      return 400;
    case 'ALREADY_SPAWNED':
      return 409;
    case 'CLAUDE_CLI_MISSING':
      return 503;
    default:
      return 500;
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof KampanelaError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    return json(body, { status: statusFor(err.code) });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  const body: ApiError = { error: { code: 'INTERNAL', message } };
  return json(body, { status: 500 });
}

export async function readJson<T>(req: Request): Promise<T> {
  return (await req.json()) as T;
}
