---
name: basic-rule
description: AI가 작업할 때 반드시 따르는 동기화 규칙과 실행 스텝의 단일 진입점
last_verified: 2026-04-24
---

# 기본 규칙

## 작업 시작 전 필수 선행

1. `AGENTS.md`, `CLAUDE.md` 읽기 (존재할 경우)
   - 두 파일은 인덱스 역할만 수행하고 실제 규칙은 이 문서에서 단일 관리한다.
2. [docs/GOAL.MD](./GOAL.MD) 확인
3. 현재 작업 범주를 판정해 1차 진입문을 정한다

- 기능 변경: [docs/code-architecture/index.md](./code-architecture/index.md), [docs/spec/index.md](./spec/index.md), [docs/stack/index.md](./stack/index.md)
- 계획/상태 변경: [docs/plan/index.md](./plan/index.md), [docs/plan/in-progress/index.md](./plan/in-progress/index.md)

## 브랜치 규칙 (모든 변경 사항 작업 전제조건)

- **모든 write 작업(코드·문서 수정 포함)은 반드시 main이 아닌 브랜치에서 진행한다.**
- main 브랜치에서 write 작업을 시작하려는 경우:
  1. 유저에게 티켓/작업 ID를 요청한다.
  2. 해당 ID로 브랜치를 생성하고 체크아웃한 뒤 작업을 진행한다.
- 이미 갈라진 브랜치에서 **새로운 작업**을 시작하려는 경우:
  1. 유저에게 현재 티켓(브랜치)에서 계속 진행하려는 것이 맞는지 확인한다.
  2. 맞다면 그대로 진행한다.
  3. 새로운 작업이라면 `main`으로 돌아가 `git pull`을 수행한 뒤, 새 티켓 ID를 요청하여 브랜치를 생성한다.

## 작업 = 계획 원칙 ✅ CI로 강제됨 (`.github/workflows/plan-lint.yml`)

- **코드를 수반하는 모든 작업은 plan으로 취급한다.** (기능 구현, 리팩터링, 테스트 작성 등)
- 작업을 시작하기 전에 반드시 `docs/plan/in-progress/`에 계획 폴더를 생성한다.
- 계획 없이 코드 변경을 진행하지 않는다.
- 작업 결과는 `docs/spec/`에 스펙으로 동기화한다.
- **PR 머지 시점에는 `docs/plan/in-progress/`가 비어 있어야 한다.** 완료된 계획은 `docs/plan/archive/`로 이동하고, 중단된 계획은 제거한다. CI(`plan-lint`)가 이를 검증한다.
- 예외: 오타 수정, 단순 포맷팅 등 코드 동작에 영향 없는 사소한 변경은 계획 없이 진행할 수 있다.

## 동기화 규칙

- `docs/` 하위 1depth에 폴더/파일이 추가 또는 이름 변경되면 `AGENTS.md`와 `CLAUDE.md`를 즉시 동기화한다.
- `AGENTS.md`와 `CLAUDE.md`의 내용은 항상 동일해야 하며 둘 중 한 곳을 바꾸면 다른 한쪽도 즉시 갱신한다.
- 폴더에 `index.md`가 있으면 하위 파일은 해당 진입점(index)에서만 참조한다.
- `docs/spec`은 코드 스펙의 단일 진입점이다. 구현 변경이 의미를 바꾸면 spec와 연동 계획은 즉시 갱신한다.
- `docs/stack`와 `docs/reference`는 서로 용도 분리한다.
  - `docs/stack`: 사용 범위, 책임, 운영 규칙 (어디서 쓰는가, 누가 관리하는가)
  - `docs/reference`: 사용 자료 (문서 링크, 예제, 설정 가이드, 실제 적용 팁)

## 작업 스텝 (필수)

1. **브랜치 확인**: write 작업이면 현재 브랜치가 main이 아닌지 확인한다. main이면 [브랜치 규칙](#브랜치-규칙-모든-변경-사항-작업-전제조건)에 따라 브랜치를 먼저 생성한다. 새로운 세션일 경우 반드시 참조한다.
2. 범주 판정: 기능/구조 변경인지, 계획 갱신인지, 문서 갱신인지 분류한다.
3. 동기화 대상 식별: `docs/code-architecture/index.md`, `docs/spec/index.md`, `docs/plan/in-progress/index.md`, `docs/plan/archive/index.md` 연동 여부를 정한다.
4. 문서 반영: 규칙대로 내용 추가/수정 후 `docs/` 인덱스 및 링크 정합성을 맞춘다.
5. 마무리 검증:
   - 관련 링크 깨짐, 새 항목의 1depth 반영, plan-archive 연결, 스펙-아키텍처 동기화 문구 반영을 점검한다.
   - **진입점 누락 확인**: `docs/` 하위 각 폴더의 `index.md`에 해당 폴더 내 모든 파일이 등록되어 있는지 확인한다.
6. **PR 생성 및 CI 모니터링**: PR을 생성한 후 **모든 CI 체크가 통과할 때까지 모니터링**한다. 상세 절차는 [docs/PR.MD](./PR.MD)를 따른다.

## 종료 체크리스트

- `AGENTS.md`/`CLAUDE.md` 동기화 여부
- 작업 범주별 진입점 링크 유효성
- 스펙-아키텍처 정합성 갱신
- 진행/완료 계획 반영
- 문서 추가/이동/삭제 시 해당 폴더 `index.md`에 진입점 누락 없는지 확인
- PR 생성 시 CI 전체 통과 확인 완료 여부 ([PR 규칙](./PR.MD))

## 커밋 규칙

- 유저가 커밋을 요청하면, [docs/COMMIT.MD](./COMMIT.MD)의 형식을 따른다.
