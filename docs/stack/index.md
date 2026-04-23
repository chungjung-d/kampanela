---
name: stack
description: kampanela가 사용하는 기술 스택의 단일 진입점
last_verified: 2026-04-24
---

# Stack

## 진입점 역할

- 본 문서는 사용 중인 기술 스택의 단일 진입점이다.
- 스택이 추가되면 파일을 분리한 뒤 이 index에서 링크로 열거한다.

## 구분 기준

- **stack** 문서는 "어디서 쓰는가 / 누가 관리하는가 / 어떤 책임을 지는가"를 다룬다.
- 링크/예제/튜토리얼 성격의 자료는 [docs/reference/index.md](../reference/index.md)로 분리한다.

## 런타임 / 언어

- **Bun + TypeScript**
  - 사용 범위: 오케스트레이션 코어, HTTP/WebSocket 서버, 빌드/실행 툴체인 전역
  - 이유: Claude Code 생태계(TS/Node 기반)와 자연스럽게 맞물리고, `~/.claude/*` JSON 조작·프로세스 spawn·서버·빌드를 단일 런타임으로 커버
  - 관리 주체: 본 레포 (packages/\*)

## 프로젝트 구성

- **Bun workspaces 모노레포** (세부 패키지 구성은 [docs/code-architecture/index.md](../code-architecture/index.md) 참고)

## 오케스트레이션 수단

- **Claude Code CLI 프로세스 spawn**
  - 등록된 레포별로 `claude` 바이너리를 자식 프로세스로 실행하고, stdin/stdout 및 hook으로 입출력을 주고받는다.
  - Anthropic SDK 직접 호출은 이번 단계에서는 사용하지 않는다.

## UI 시각화 스택

- **React + PixiJS (Web)**
  - 사용 범위: Agent Teams 라이브 뷰 — 도트 그래픽 오피스 렌더링
  - 이유: DOM으로는 어려운 도트 캐릭터/애니메이션을 PixiJS로 처리하고, 패널·HUD·폼은 React로 처리
  - 관리 주체: packages/ui

## UI ↔ 백엔드 통신

- **Bun HTTP + WebSocket 서버**
  - 사용 범위: 파일시스템(등록된 레포 경로, `~/.claude/teams/`) 접근, 에이전트 이벤트 스트림, 등록/명령 API
  - 이유: 브라우저에서 로컬 FS에 직접 접근 불가 → 서버가 브로커 역할. WebSocket은 팀 상태 실시간 푸시에 사용
  - 관리 주체: packages/server

## Shared Brain 배포

- **Symlink / 공유 디렉토리**
  - 사용 범위: 등록된 레포에 공유 `CLAUDE.md`, subagent 정의를 심볼릭 링크로 연결
  - 이유: 동기화 스크립트 없이 실시간으로 단일 소스 공유 가능
  - 관리 주체: packages/core 내 link 명령

## 레포 등록 방식

- **UI에서 드래그/입력** (SSOT는 kampanela 설정 파일)
  - 사용자가 Web UI에서 레포 경로를 드래그 또는 입력 → 서버가 설정 파일(`~/.kampanela/repos.json` 또는 레포 내 설정)에 기록
  - CLI / 설정 파일 직접 편집도 호환 가능하도록 SSOT를 파일로 고정

## 빌드 · 테스트 체인

> TBD — 린터/포매터/테스트 도구 선택 후 확정한다. (후보: Biome, Vitest/Bun test)

## 연관 문서

- [docs/code-architecture/index.md](../code-architecture/index.md)
- [docs/reference/index.md](../reference/index.md)
- [docs/spec/index.md](../spec/index.md)
