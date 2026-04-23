# Purpose — MVP: 레포 등록 + 단일 Claude Code spawn

## 왜 필요한지

- kampanela는 메타 오케스트레이션 레이어다. 모든 기능의 기반은 **"등록된 레포에 Claude Code 프로세스를 띄우고 통신한다"** 는 가장 작은 회로다.
- 이 회로가 동작하지 않으면 UI 시각화(Axis 2), Shared Brain(Axis 3) 모두 구축할 대상이 없다.
- 따라서 MVP는 Axis 1의 최소 단위 — **레포 하나를 등록하고, 그 레포에서 `claude` CLI를 spawn해서 이벤트를 받아본다** — 만 완결한다.

## 작업 요약

- `~/.kampanela/repos.json` 레지스트리 + 읽기/쓰기 레이어
- `packages/server`에 등록/조회/spawn/stop/WS 엔드포인트
- `packages/core`의 `spawn(repoId, prompt)` 구현 (stdout/stderr/exit 이벤트 방출)
- `packages/ui`에서 등록 폼 + 단일 레포 로그 뷰 (PixiJS는 이번 MVP 범위 밖 — HTML 로그로 시작)
- `packages/shared`에 `RegisteredRepo`, `AgentEvent`, `AgentState` 타입 정의

## 명시적 비범위

- PixiJS 도트 그래픽 시각화 (다음 계획에서)
- Shared Brain 심볼링크 (다음 계획에서)
- 2개 이상의 레포 동시 관리 (MVP는 1개로 한정)
- 인증/다중 사용자

## 참고 링크

- [docs/GOAL.MD](../../../GOAL.MD)
- [docs/code-architecture/index.md](../../../code-architecture/index.md)
- [docs/spec/index.md](../../../spec/index.md)
- [docs/stack/index.md](../../../stack/index.md)
