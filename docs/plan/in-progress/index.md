# 진행 중인 계획

## 정책

- 진행 중인 계획은 `{날짜-요약}` 폴더 단위로 관리한다.
- 각 계획은 `purpose.md`, `task.md`, `design.md`, `reason.md`를 함께 보유해야 한다.

## 현재 진행 목록

- [20260424-mvp-register-spawn](./20260424-mvp-register-spawn) — 2026-04-24 착수: 레포 등록 + 단일 Claude Code spawn 회로 구축 (Axis 1 MVP)

> 주의: main 브랜치에는 이 목록이 항상 비어 있어야 한다 (plan-lint CI가 강제). 이 엔트리는 현재 feature branch에서만 유지되며, 계획 완료 시 `archive`로 이동한 뒤 이 목록에서 제거된다.

## 계획 템플릿(필수 항목)

### 폴더 구조

- `docs/plan/in-progress/{yyyymmdd}-{summary}/purpose.md`
- `docs/plan/in-progress/{yyyymmdd}-{summary}/task.md`
- `docs/plan/in-progress/{yyyymmdd}-{summary}/design.md`
- `docs/plan/in-progress/{yyyymmdd}-{summary}/reason.md`

### 각 파일에 들어갈 최소 항목

- `purpose.md`
  - 왜 필요한지(목적/이유)
  - 작업 요약
  - 참고 링크
- `task.md`
  - 실행 작업 단위(체크박스 또는 번호 목록)
  - 현재 상태/진척률
  - 의존성/차단 이슈
  - 참고 링크
- `design.md`
  - 영향 범위
  - 변경 아키텍처/흐름(텍스트 + ASCII diagram 권장)
  - 리스크 및 대안
  - 참고 링크
- `reason.md`
  - 의사결정 근거(대안 비교, 채택/기각 이유)
  - 의존성/위험 분석
  - 참고 링크

## 완료 조건

- `purpose.md`의 목적/요약 완결
- `task.md`의 모든 필수 항목 처리
- `design.md`에서 아키텍처 영향과 이유가 설명됨
- `reason.md`에 판단 근거와 대안 비교가 남아 있음
- 완료 시 `archive`로 이동 후 본 인덱스에서 제거

## 참고 링크 예시

- 대상 스펙: [docs/spec/index.md](../../spec/index.md)
- 대상 아키텍처: [docs/code-architecture/index.md](../../code-architecture/index.md)
- 관련 계획: [docs/plan/archive/index.md](../archive/index.md), [docs/plan/in-progress/index.md](../in-progress/index.md)
