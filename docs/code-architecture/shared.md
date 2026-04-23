---
name: code-architecture/shared
description: packages/shared — 순수 타입 패키지의 구조와 규칙
last_verified: 2026-04-24
---

# packages/shared

## 책임

- 다른 모든 패키지가 의존하는 공용 타입 정의.
- 런타임 코드 없음. 사이드 이펙트 없음. 외부 의존 없음.

## 디렉토리 구조

```
packages/shared/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ index.ts           # 배럴 export
   └─ types/
      ├─ repo.ts         # RegisteredRepo, RegistryFile
      ├─ agent.ts        # AgentStatus, AgentState
      └─ event.ts        # AgentEvent (server↔ui 메시지 스키마)
```

## Public API

- `RegisteredRepo`, `RegistryFile` — registry 파일 스키마
- `AgentStatus` — `'idle' | 'thinking' | 'tool_running' | 'waiting_user' | 'error' | 'stopped'`
- `AgentState` — 현재 상태 스냅샷
- `AgentEvent` — WS 메시지 유니온 (`stdout` / `stderr` / `status` / `exit` / `claude_event`)

## 확장 규칙

- 필드 추가 시 하위 호환 유지 (옵셔널 `?` 또는 유니온 확장).
- breaking change는 `version` 필드를 도입한 뒤 마이그레이션 계획을 별도 plan으로 관리.
- 브라우저에서도 사용되므로 `Buffer`, `fs` 등 Node 전용 타입 금지.

## 연관 문서

- [index.md](./index.md)
- [conventions.md](./conventions.md)
- [../spec/index.md](../spec/index.md) — 스키마의 의미와 서버 API 매핑
