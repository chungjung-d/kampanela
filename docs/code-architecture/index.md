---
name: code-architecture
description: kampanela 코드 아키텍처의 단일 진입점 — Bun workspaces 모노레포 구조와 3축 매핑
last_verified: 2026-04-24
---

# Code Architecture

## 진입점 역할

- 본 문서는 코드 아키텍처의 단일 진입점이다.
- 하위 항목이 추가되면 이 index에서 링크로 열거한다.

## 전체 구조 (Bun workspaces 모노레포)

```
kampanela/
├─ package.json            # root workspace
├─ bun.lockb
├─ packages/
│  ├─ shared/              # 타입, 팀 상태 스키마, 공용 유틸
│  ├─ core/                # 오케스트레이션 엔진 (spawn / link / 상태 관리)
│  ├─ server/              # Bun HTTP + WebSocket 서버 (UI ↔ FS 브로커)
│  ├─ ui/                  # React + PixiJS Web UI
│  └─ cli/                 # (선택) 스크립트 자동화용 CLI
├─ docs/
└─ (runtime) ~/.kampanela/ # 사용자 설정: repos.json 등 (SSOT)
```

## 3축 매핑

| GOAL 축 | 주 담당 패키지 | 보조 |
|---------|---------------|------|
| 1. Multi-Repo Orchestration (지휘) | `packages/core` | `packages/server`(HTTP API), `packages/cli` |
| 2. Agent Teams UI (시각화) | `packages/ui` | `packages/server`(WS 스트림), `packages/shared`(스키마) |
| 3. Shared Brain & Harness Hub (지식 관리) | `packages/core`(link) + 본 레포 `docs/`/공용 자원 | `packages/server`(링크 API) |

## 런타임 흐름 (MVP 범위)

```
[User Browser (ui)] ──fetch/ws──> [Bun Server (server)]
                                       │
                                       ├─> spawn `claude` in <repo>  (core)
                                       ├─> read ~/.claude/teams/*.json (core)
                                       └─> symlink brain files (core)
```

1. 사용자가 UI에서 레포 경로를 등록 → `server`가 `~/.kampanela/repos.json`에 반영
2. 사용자가 특정 레포에 명령 전달 → `server` → `core.spawn(repo, command)` → `claude` CLI 프로세스 기동
3. `core`는 프로세스의 stdout/hook 이벤트를 정규화해 `server`에 전달 → `server`가 WS로 `ui`에 푸시
4. `ui`는 `packages/shared`의 팀 상태 스키마로 디코딩해 PixiJS 씬에 반영

## 런타임/프로세스 경계

- **`core`는 프로세스 소유자다.** spawn된 `claude` CLI의 생명주기는 `core`가 관리한다.
- **`server`는 상태 브로커다.** 파일시스템을 직접 읽고 UI에 프록시하지만 비즈니스 로직은 가지지 않는다.
- **`ui`는 순수 뷰다.** 로컬 FS에 직접 접근하지 않으며 `server`를 통해서만 상호작용한다.
- **`shared`는 의존성의 루트다.** 다른 패키지에서 의존하지만 역방향 의존은 금지한다.

## 패키지별 상세

- [shared.md](./shared.md) — `@kampanela/shared`: 순수 타입
- [core.md](./core.md) — `@kampanela/core`: 레지스트리 + spawn
- [server.md](./server.md) — `@kampanela/server`: Bun HTTP + WS 브로커
- [ui.md](./ui.md) — `@kampanela/ui`: React + Vite

## 공통 규칙

- [conventions.md](./conventions.md) — 모듈 경계, 네이밍, 에러, 테스트, 로깅

## 연관 문서

- [docs/GOAL.MD](../GOAL.MD)
- [docs/stack/index.md](../stack/index.md)
- [docs/spec/index.md](../spec/index.md)
- [docs/plan/index.md](../plan/index.md)
