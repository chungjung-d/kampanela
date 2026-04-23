---
name: code-architecture/core
description: packages/core — 오케스트레이션 엔진 (레지스트리 + Claude Code spawn)
last_verified: 2026-04-24
---

# packages/core

## 책임

- 레지스트리 파일(`~/.kampanela/repos.json`) 읽기/쓰기 — 원자적.
- 등록된 레포에서 `claude` CLI 자식 프로세스 기동 및 수명 관리.
- 프로세스의 stdout(`stream-json`)을 파싱해 정규화된 `AgentEvent`로 방출.

## 책임 밖

- HTTP/WS를 모른다. 순수 라이브러리.
- 상태를 디스크에 영속화하지 않는다 (레지스트리 제외). 실행 중 세션 맵은 호출자(`server`)가 보유.
- 권한/인증을 처리하지 않는다.

## 디렉토리 구조

```
packages/core/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ index.ts              # 배럴 export
   ├─ paths.ts              # ~/.kampanela 경로 해석 (XDG-ish)
   ├─ errors.ts             # 타입드 에러 (RegistryCorruptedError 등)
   ├─ registry/
   │  ├─ index.ts           # public API
   │  ├─ file.ts            # atomic read/write (tmp + rename)
   │  └─ registry.test.ts
   └─ spawn/
      ├─ index.ts           # public API — spawn(repoId, opts)
      ├─ process.ts         # child_process 래퍼
      ├─ events.ts          # stream-json 라인 → AgentEvent
      └─ spawn.test.ts
```

## Public API (초안)

```ts
// registry
export async function readRegistry(): Promise<RegistryFile>;
export async function writeRegistry(file: RegistryFile): Promise<void>;
export async function addRepo(input: { path: string; name?: string; role?: string }): Promise<RegisteredRepo>;
export async function removeRepo(id: string): Promise<void>;
export async function getRepo(id: string): Promise<RegisteredRepo | undefined>;

// spawn
export type SpawnOptions = { prompt?: string; sessionId?: string; model?: string; extraArgs?: string[] };
export type SpawnHandle = {
  readonly repoId: string;
  readonly pid: number;
  readonly sessionId?: string;
  on(event: 'event', listener: (e: AgentEvent) => void): this;
  on(event: 'exit', listener: (code: number | null) => void): this;
  stop(signal?: NodeJS.Signals): Promise<void>;
};
export async function spawn(repoId: string, opts?: SpawnOptions): Promise<SpawnHandle>;
```

## registry 동작

- 위치: `${os.homedir()}/.kampanela/repos.json` (상위 폴더 없으면 mkdir).
- 쓰기: 임시파일(`repos.json.tmp-<nonce>`) 작성 → `fs.rename`. 원자성 확보.
- 읽기: 파일 없음은 빈 레지스트리 반환. JSON 파싱 실패는 `RegistryCorruptedError`.
- ID: `crypto.randomUUID()`. 경로 기반 해시 X (사용자가 경로를 옮길 수 있음).
- 중복 경로: `addRepo`에서 같은 절대경로가 이미 있으면 기존 항목 재사용 (신규 생성 X).

## spawn 동작

- 바이너리: `process.env.KAMPANELA_CLAUDE_BIN ?? 'claude'` (테스트/개발용 오버라이드).
- 인자 조합 (MVP):
  ```
  claude -p "<prompt>" --output-format stream-json --verbose --include-partial-messages
  ```
  - `--include-partial-messages`는 `--print`와 함께만 사용 가능.
  - `--session-id`가 주어지면 추가.
  - 추가 인자는 `extraArgs`로 주입.
- cwd: 해당 레포의 `path`.
- 바이너리 부재 감지: `ENOENT` spawn 에러 → `ClaudeCliMissingError`.
- 이벤트 변환:
  - stdout 라인 단위 → `JSON.parse` 시도 → 성공 시 `{ type: 'claude_event', payload }`, 실패 시 `{ type: 'stdout', text }`.
  - stderr는 `{ type: 'stderr', text }`.
  - 종료 시 `{ type: 'exit', code }` + `'exit'` 이벤트.
- 상태 파생: `claude_event`의 `type` 필드를 보고 `AgentStatus`를 갱신 (구체 매핑은 구현 시 결정 — 현재는 `thinking` ↔ `idle`의 최소 전이만).

## 에러 (errors.ts)

- `RegistryCorruptedError` — `repos.json` 파싱 실패.
- `RepoNotFoundError` — ID 조회 실패.
- `RepoPathInvalidError` — 절대경로 아니거나 존재 X.
- `ClaudeCliMissingError` — 바이너리 실행 불가.
- `AlreadySpawnedError` — 동일 `repoId`에 대한 중복 spawn (상위 호출자가 session 맵으로 관리하되 core도 방어적으로 감지).

## 테스트 전략

- `registry.test.ts`: tmp HOME으로 격리 (`HOME`/`XDG_CONFIG_HOME` override) → add/read/remove 왕복, 원자성 검증.
- `spawn.test.ts`: `KAMPANELA_CLAUDE_BIN=/bin/echo` 또는 테스트 픽스쳐 스크립트로 외부 의존 제거. stream-json 파싱은 픽스쳐 문자열 단위 테스트.

## 연관 문서

- [index.md](./index.md)
- [conventions.md](./conventions.md)
- [../spec/index.md](../spec/index.md)
- [server.md](./server.md)
