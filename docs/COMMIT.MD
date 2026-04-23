# Commit Message Rule

- 기본 형식: `<type>: <summary>`
- 기본 타입: `feat`, `chore`, `refactor`, `fix`, `docs`
- 예시:
  - `feat: 에이전트 팀 뷰 초기 구조 추가`
  - `chore: 문서 링크 체크 스크립트 개선`
  - `refactor: 오케스트레이션 디스패처 정리`
  - `docs: GOAL.MD 작성`
- 추가 설명이 필요하면 요약 뒤에 이어서 붙여도 됨

## 커밋 전 필수 검증

커밋하기 전에 아래 명령을 **순서대로** 실행하고, **모두 에러 없이 통과할 때까지** 반복한다.

1. `bun install` (락파일 최신화 확인, 특히 의존성/워크스페이스 변경 시)
2. `bun run typecheck` — 모든 패키지 TypeScript 타입 검증
3. `bun test` — 전체 단위/통합 테스트
4. `docs/plan/in-progress/` 내 해당 계획의 상태 갱신

- 하나라도 실패하면 원인을 수정한 뒤 처음부터 다시 실행한다.
- 모두 통과한 후에만 커밋을 진행한다.
- 동일 검증이 `.github/workflows/build.yml`의 CI에서도 실행된다. 로컬에서 통과했는데 CI가 실패하면 lockfile 또는 환경 차이를 우선 점검한다.

## 커밋/푸시 후 PR 모니터링 (필수)

- 커밋 후 push할 때, **현재 브랜치에 열려 있는 PR이 있는지 확인**한다.
- PR이 존재하면 push 직후 [docs/PR.MD](./PR.MD)의 CI 모니터링 절차를 자동으로 시작한다.
- PR이 없으면 모니터링 없이 종료한다.

### 확인 방법

```
gh pr view --json state,url 2>/dev/null
```

- 결과가 있고 `state=OPEN`이면 → CI 모니터링 시작
- 결과가 없거나 에러면 → PR 없음, 모니터링 불필요
