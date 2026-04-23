---
name: code-architecture/server
description: packages/server — Bun HTTP + WebSocket 브로커
last_verified: 2026-04-24
---

# packages/server

## 책임

- 브라우저 UI와 core 사이의 HTTP/WS 브로커.
- 세션 맵(`repoId → SpawnHandle`) 보유 — 서버 프로세스 수명에 귀속.
- 에러 응답 스키마 통일.

## 책임 밖

- 비즈니스 로직(등록 검증, spawn 인자 조합)은 최대한 core가 수행.
- 인증/쿠키/세션 저장소 (MVP 범위 밖).

## 디렉토리 구조

```
packages/server/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ index.ts             # 부트스트랩 (CLI 진입: bun run dev)
   ├─ server.ts            # createServer({ port }) — Bun.serve 구성
   ├─ session.ts           # repoId → SpawnHandle 맵 + 이벤트 팬아웃
   ├─ http.ts              # 응답 헬퍼 (json, error)
   ├─ routes/
   │  ├─ repos.ts          # GET/POST/DELETE /api/repos
   │  └─ spawn.ts          # POST /api/repos/:id/spawn|stop
   └─ ws/
      └─ repo.ts           # WS /ws/repos/:id
```

## 진입점

- `bun run --filter @kampanela/server dev` (또는 루트 스크립트) → `src/index.ts` → `createServer()` → `Bun.serve`.
- 기본 포트 `7357` (상수, 변경 시 `conventions.md`에 반영).
- CORS: `http://localhost:*` 및 Vite dev origin 허용 (MVP).

## 라우팅 규약

| Method | Path | 핸들러 |
|--------|------|--------|
| `GET` | `/api/repos` | `routes/repos.ts` `listRepos` |
| `POST` | `/api/repos` | `routes/repos.ts` `registerRepo` |
| `DELETE` | `/api/repos/:id` | `routes/repos.ts` `deregisterRepo` |
| `POST` | `/api/repos/:id/spawn` | `routes/spawn.ts` `startSpawn` |
| `POST` | `/api/repos/:id/stop` | `routes/spawn.ts` `stopSpawn` |
| `GET (upgrade)` | `/ws/repos/:id` | `ws/repo.ts` |

## session.ts

- Map: `repoId → { handle: SpawnHandle, subscribers: Set<WebSocket> }`.
- spawn 요청 → core.spawn → Map에 등록 → 이벤트를 수신해 모든 subscribers에 JSON 메시지로 송신.
- 구독자가 하나도 없어도 이벤트는 흘려보낸다 (나중 리플레이는 고려 X).
- `exit` 이벤트 수신 시 Map에서 제거.

## WebSocket 계약

- 메시지 포맷 = `AgentEvent` (shared 타입) 그대로 직렬화.
- 클라이언트 → 서버 메시지는 MVP에서 사용 X (푸시 전용).
- 연결 끊김: 서버는 그냥 구독자에서 제거. 재연결 시 이미 지난 이벤트는 복구 X.

## 에러 응답 포맷

```ts
type ErrorResponse = {
  error: {
    code: string;        // core 에러 클래스명 또는 API 레벨 코드
    message: string;
    details?: unknown;
  };
};
```

- HTTP 코드 매핑:
  - `RepoNotFoundError` → 404
  - `RepoPathInvalidError` → 400
  - `AlreadySpawnedError` → 409
  - `ClaudeCliMissingError` → 503
  - 나머지 → 500

## 테스트 전략

- `bun test` 통합 테스트: 실제로 `Bun.serve` 기동 → `fetch`로 엔드포인트 호출 → 응답 검증.
- core의 spawn은 `KAMPANELA_CLAUDE_BIN`을 픽스쳐 스크립트로 가리켜 외부 의존 제거.

## 연관 문서

- [index.md](./index.md)
- [conventions.md](./conventions.md)
- [core.md](./core.md)
- [../spec/index.md](../spec/index.md)
