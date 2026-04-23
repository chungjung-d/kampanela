---
name: code-architecture/conventions
description: 모든 packages에 공통 적용되는 코딩 규칙 — 모듈 경계, 네이밍, 에러, 테스트, 로깅
last_verified: 2026-04-24
---

# 공통 컨벤션

## 모듈 경계 (의존성 규칙)

```
ui ──▶ server (HTTP/WS only)
         │
         ▼
       core ──▶ shared (types only)
         │
         ▼
     Node/Bun stdlib
```

- **금지**: `core`가 `server`/`ui`를 import. `shared`가 어떤 패키지도 import.
- **금지**: `ui`가 `core` 직접 import (브라우저 번들에서 Node API 깨짐).
- **허용**: `server`가 `core`를 import, `server`·`core`·`ui` 모두 `shared`를 import.
- 모든 패키지는 `package.json`의 `exports` 필드로 public 진입점을 한 곳만 노출한다.

## 언어 / 런타임

- TypeScript 5.x, `strict: true`, `noUncheckedIndexedAccess: true`.
- Bun은 런타임이자 패키지 매니저이자 테스트 러너다. `bun test`, `bun run`, `bun install` 기준.
- 외부 npm 의존성은 패키지 단위로 최소화한다. `core`/`server`는 의존성 없이 표준 라이브러리로 성립시키는 것을 선호한다.

## 파일 / 디렉토리 네이밍

- 파일명: `kebab-case.ts`. 단, React 컴포넌트 파일은 `PascalCase.tsx`.
- 테스트 파일: `<module>.test.ts` (같은 폴더).
- 배럴 export는 `src/index.ts` 한 곳에만.
- 폴더는 기능 단위 (예: `src/registry/`, `src/spawn/`). 타입만 모아두는 폴더(`types/`)는 `shared`에서만 허용.

## 심볼 네이밍

- 타입/인터페이스: `PascalCase`. 유니온은 `AgentStatus` 처럼 명사.
- 함수: `camelCase`, 동사로 시작 (`readRegistry`, `spawnAgent`).
- 상수 (진짜 상수): `SCREAMING_SNAKE_CASE`. 설정/기본값이면 `camelCase`.
- 에러 클래스: `XxxError` (예: `RegistryCorruptedError`).

## 에러 처리

- **내부 경계**: 에러는 `Error`를 상속한 타입드 클래스로 throw. 각 패키지에 `errors.ts`.
- **외부 경계 (server API)**: 모든 에러를 `{ error: { code, message, details? } }` 포맷으로 JSON 변환. HTTP 상태 코드는 4xx/5xx 명확히.
- **core**는 HTTP를 모르므로 에러 코드 네이밍은 런타임 도메인 기준 (`REPO_NOT_FOUND`, `CLAUDE_CLI_MISSING`). `server`가 매핑.
- 사용자가 확인할 수 없는 내부 크래시는 `console.error`로 스택 남기고 프로세스는 유지한다.

## 로깅

- **shared**: 로깅 없음 (순수 타입).
- **core**: `console.log` 직접 사용 금지. 주입 가능한 `logger` 인수를 받거나 조용히 이벤트를 emit.
- **server**: 구조적 로그 한 줄(JSON)로 리퀘스트/에러 기록. MVP에서는 `console.log(JSON.stringify(...))` 수준으로 시작.
- **ui**: `console.*`는 개발 전용. 프로덕션 빌드에서 스트립.

## 테스트

- 단위 테스트: `bun test` (Bun 내장 러너).
- `core`: 파일 I/O / spawn은 실제 파일·프로세스로 검증 (tmp dir, short-lived child). 목 의존성 금지.
- `server`: `Bun.fetch` / `new WebSocket`로 실제 서버 부트 후 검증.
- `ui`: MVP는 테스트 없음. 다음 반복에서 Playwright 또는 Vitest+RTL 도입 여부 결정.

## Bun workspaces

- 루트 `package.json`의 `workspaces` 필드에 `packages/*`.
- 패키지 이름: `@kampanela/<name>`. 상호 참조는 `"@kampanela/shared": "workspace:*"` 형식.
- 빌드 산출물은 각 패키지의 `dist/`. `core`·`shared`는 tsc로 선컴파일, `server`·`ui`는 런타임/번들러가 직접 TS 소비.

## 커밋 단위

- `docs/plan/in-progress/<plan>/task.md`의 체크박스 단위로 커밋한다.
- 커밋 메시지 형식은 [docs/COMMIT.MD](../COMMIT.MD).

## 연관 문서

- [index.md](./index.md)
- [shared.md](./shared.md)
- [core.md](./core.md)
- [server.md](./server.md)
- [ui.md](./ui.md)
