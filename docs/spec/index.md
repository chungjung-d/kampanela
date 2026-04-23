---
name: spec
description: kampanela가 제공/소비하는 인터페이스 스펙의 단일 진입점
last_verified: 2026-04-24
---

# Spec

## 진입점 역할

- 본 문서는 스펙의 단일 진입점이다.
- 하위 스펙 문서가 추가되면 이 index에서 링크로 열거한다.

## 스펙 목록

- [레포 등록 (registry)](#레포-등록-registry)
- [Claude Code spawn 명령](#claude-code-spawn-명령)
- [Agent Team 상태 스키마 (~/.claude/teams/)](#agent-team-상태-스키마)
- Shared Brain 링크 규약 _(TBD — Axis 3 본격 착수 시)_

---

## 레포 등록 (registry)

**저장소 SSOT**: `~/.kampanela/repos.json`

**스키마 (draft)**

```ts
type RegisteredRepo = {
  id: string;           // nanoid 또는 해시 (경로 기반 결정 X)
  name: string;         // 사용자 지정 표시명
  path: string;         // 절대경로
  role?: string;        // 선택: 이 레포의 에이전트 역할 (예: "backend-api")
  addedAt: string;      // ISO8601
};

type RegistryFile = {
  version: 1;
  repos: RegisteredRepo[];
};
```

**API (server)**

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/repos` | 등록된 레포 목록 반환 |
| `POST` | `/api/repos` | 신규 등록 (body: `{ path, name?, role? }`) |
| `DELETE` | `/api/repos/:id` | 등록 해제 |

**UI 연동**: 드래그/폼 입력 → `POST /api/repos` → 응답을 zustand/스토어에 반영.

---

## Claude Code spawn 명령

**엔드포인트**

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/repos/:id/spawn` | 지정된 레포에서 `claude` CLI 프로세스 기동 |
| `POST` | `/api/repos/:id/stop` | 실행 중 프로세스 종료 |
| `WS` | `/ws/repos/:id` | 해당 레포 프로세스의 이벤트 스트림 구독 |

**spawn 요청 바디 (draft)**

```ts
type SpawnRequest = {
  prompt?: string;       // 초기 프롬프트 (없으면 대화 대기)
  model?: string;        // 미지정 시 CLI 기본값
  args?: string[];       // 추가 CLI 인자
};
```

**이벤트 메시지 (WS) (draft)**

```ts
type AgentEvent =
  | { type: 'stdout'; repoId: string; text: string; ts: string }
  | { type: 'stderr'; repoId: string; text: string; ts: string }
  | { type: 'status'; repoId: string; status: AgentStatus; ts: string }
  | { type: 'exit'; repoId: string; code: number; ts: string };
```

---

## Agent Team 상태 스키마

**정의 주체**: kampanela (본 레포가 SSOT)
**저장 위치**: `~/.claude/teams/<team>/<repoId>.json` (팀 구조 정식화 시 경로 확정)

**스키마 (draft v0)**

```ts
type AgentStatus =
  | 'idle'          // 기동됐으나 아무 작업 없음
  | 'thinking'      // LLM 응답 대기
  | 'tool_running'  // 도구 실행 중
  | 'waiting_user' // 사용자 입력 대기
  | 'error'
  | 'stopped';

type AgentState = {
  repoId: string;
  repoPath: string;
  status: AgentStatus;
  currentTask?: string;        // 자연어 요약 (UI에 표시)
  lastEventAt: string;         // ISO8601
  pid?: number;
  metadata?: Record<string, unknown>;
};
```

**업데이트 흐름**: Claude Code hook에서 `core`로 이벤트 전송 → `core`가 `~/.claude/teams/`의 파일에 반영 → `server`가 변경 감지하여 WS 브로드캐스트.

> 이 스키마는 MVP용 v0이다. 필드 확장 시 `version` 키 도입과 마이그레이션 계획을 plan으로 관리한다.

---

## 연관 문서

- [docs/GOAL.MD](../GOAL.MD)
- [docs/code-architecture/index.md](../code-architecture/index.md)
- [docs/stack/index.md](../stack/index.md)
