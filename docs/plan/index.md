# 실행 계획

## 목적

- 계획은 실행 단위의 일급 아티팩트로 운영한다.
- 복잡 작업은 `in-progress`의 상세 문서들로 의사결정 로그와 설계를 묶고, 완료되면 `archive`로 이동해 버전 보존한다.

## 저장소 구조

- 현재 진행: [docs/plan/in-progress/index.md](./in-progress/index.md)
- 완료 아카이브: [docs/plan/archive/index.md](./archive/index.md)
- 현재 스펙: [docs/spec/index.md](../spec/index.md)

### 폴더 규칙

- 모든 실행 계획은 아래 구조를 따른다. 폴더명은 **`{yyyymmdd}-{작업내용 요약}`**
  - 예: `20260424-plan-index-structure`
- 위치는 언제나 `in-progress` 또는 `archive` 하위다.
- 한 계획은 다음 4개 파일을 반드시 포함한다.
  - `purpose.md` : 왜 해야 하는지, 목적, 작업 요약
  - `task.md` : 실제 수행 작업 단위 목록
  - `design.md` : 아키텍처/흐름 설계(가능하면 ASCII 다이어그램)
  - `reason.md` : 플랜 수립 과정에서 내린 판단의 근거와 대안 비교 기록

## 실행 프로세스

1. 새 계획 생성: `docs/plan/in-progress/{yyyymmdd}-{summary}/` 폴더 생성 후 4개 문서 작성
2. 목적 확정: `purpose.md`에 작업 필요성, 목적, 요약을 먼저 정리
3. 판단 근거 기록: `reason.md`에 설계·기술 선택 시 어떤 판단으로 그 결정을 내렸는지, 고려한 대안과 채택/기각 이유를 기록
4. 참고 링크 정리: 코드/스펙/이슈 링크를 `purpose.md`, `task.md`, `design.md`, `reason.md`에 모두 연결
5. 진행 갱신: 변경 원인, 작업 상태, 의사결정 이슈를 `task.md`와 `design.md`에 갱신
6. 완료 전환: 결과물 및 결정사항을 정리한 뒤 `in-progress`에서 동일 폴더명을 유지한 채 `archive`로 이동
7. 보존: 아카이브 폴더는 날짜/요약명으로 유지하고, `archive/index.md`에서 진입점으로 추적

## 참고 규칙

- `in-progress`와 `archive` 모두 1차 진입점은 `index.md`다.
- 진행 중 규칙/설계/작업 단위는 반드시 index에서 링크로 조회 가능해야 한다.
- `docs/` 하위 1depth 변경은 `AGENTS.md`, `CLAUDE.md` 동기화 규칙을 따르며, 계획 변경 시 `docs/plan/index.md`도 함께 갱신한다.
- `purpose.md`, `task.md`, `design.md`, `reason.md`는 `참고 링크` 항목을 최소 1개 이상 포함해야 한다.

## 템플릿

```text
docs/plan/
├─ in-progress/
│  └─ 20260424-{summary}/
│     ├─ purpose.md
│     ├─ task.md
│     ├─ design.md
│     └─ reason.md
└─ archive/
   └─ 20260424-{summary}/
      ├─ purpose.md
      ├─ task.md
      ├─ design.md
      └─ reason.md
```

## 예시 링크 항목

- 참조 스펙: [docs/spec/index.md](../spec/index.md)
- 참조 아키텍처: [docs/code-architecture/index.md](../code-architecture/index.md)
- 참조 계획: [docs/plan/in-progress/index.md](./in-progress/index.md), [docs/plan/archive/index.md](./archive/index.md)
