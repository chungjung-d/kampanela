# Task — WS 구독 타이밍 버그 수정 + 디버깅 문서 추가

## 상태

- 진행률: 100%
- 차단 이슈: 없음

## 작업 단위

### 1. 버그 재현 및 근거 수집
- [x] `claude` CLI 직접 실행으로 바이너리 자체는 정상 확인
- [x] `spawnClaude` 단독 probe로 core 계층 정상 확인 (14 이벤트 + exit 정상)
- [x] 서버 기동 + WS 연결 후 HTTP spawn 트리거 → **메시지 0개** 재현
- [x] 원인 식별: `SessionManager.subscribe`가 세션 없을 때 `return` → UI 흐름(WS 먼저 open, spawn 나중에)에서 구독이 drop됨

### 2. 코드 수정
- [x] `packages/server/src/session.ts` — 구독자 맵과 세션 맵 분리
- [x] `subscribe`는 세션 유무와 무관하게 구독 상태 유지, 세션 있으면 마지막 이벤트 타입별로 1건 리플레이
- [x] `register`는 broadcast 시 현재 시점의 구독자 맵을 조회
- [x] `unsubscribe`는 빈 Set이 되면 맵에서 제거

### 3. 리그레션 방어
- [x] `packages/server/src/session.test.ts` 신규 4 케이스
  - subscribe → register → event 도달
  - register → emit → subscribe 시 마지막 이벤트 리플레이 (타입별 중복 덮어씀)
  - unsubscribe 후 이벤트 미전달
  - exit 후 재등록해도 구독 유지

### 4. End-to-end 재검증
- [x] 서버 기동 + WS open + HTTP spawn + 이벤트/exit 수신 시퀀스 성공 확인
  - 실제 결과: 12 claude_event + 1 status + 1 exit = 14개 수신, `result:"hi"`까지

### 5. 디버깅 문서
- [x] `docs/debug/index.md` 작성 — 계층별 probe, 포트 점유 확인, 증상별 최초 의심 지점 표
- [x] `AGENTS.md`/`CLAUDE.md` 인덱스에 `docs/debug/` 추가 (동기화 규칙 이행)
- [x] `docs/BASIC_RULE.MD` 작업 진입점 목록에 debug 추가

### 6. 검증
- [x] `bun run typecheck` 전체 패키지 통과
- [x] `bun test` 전체 통과 (core 6 + server 5 + session 4 = 15)

## 참고 링크

- [purpose.md](./purpose.md)
- [design.md](./design.md)
- [reason.md](./reason.md)
- [docs/debug/index.md](../../../debug/index.md)
- [docs/code-architecture/server.md](../../../code-architecture/server.md)
