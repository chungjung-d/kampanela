# Task — Vite WS 프록시 회피 + 사람이 읽을 수 있는 이벤트 포맷

## 상태

- 진행률: 100%
- 차단 이슈: 없음

## 작업 단위

### 1. 버그 재현 (브라우저 경로)
- [x] Vite dev 서버 5173 + 서버 7357 동시 기동
- [x] HTTP `http://localhost:5173/api/repos` → 정상 응답 확인
- [x] WS `ws://localhost:5173/ws/repos/:id` → `onopen` 호출 없이 10초 동안 이벤트 0건 재현
- [x] WS `ws://localhost:7357/...` 직결은 정상 동작 확인 → Vite proxy가 범인

### 2. 수정
- [x] `packages/ui/src/api/spawn.ts`: `VITE_WS_BASE` env 기반 직접 연결 (기본 `ws://localhost:7357`)
- [x] `packages/ui/vite.config.ts`: `/ws` 프록시 제거 + 주석으로 회귀 방지

### 3. 이벤트 포맷터
- [x] `packages/ui/src/lib/format-event.ts` 신규 — `AgentEvent` → `{ kind, text } | null`
  - `stdout`/`stderr`/`status`/`exit` 직접 매핑
  - `claude_event`는 의미 있는 타입만: `system.init`, `system.status`, `assistant.tool_use`, `assistant.text`, `user.tool_result`, `result`
  - `stream_event` 델타와 `rate_limit_event`는 null 반환 (노이즈 제거)
- [x] `format-event.test.ts` — 13 케이스 통과

### 4. UI 반영
- [x] `RepoLogView.tsx`: 포맷팅 라인 + kind별 컬러
- [x] `raw JSON` 토글 — 체크하면 원시 JSON 렌더
- [x] 빈 상태 안내("대기 중 — Spawn 버튼…")

### 5. 디버그 문서 보강
- [x] `docs/debug/index.md`에 Vite WS proxy silent failure 섹션 추가
- [x] 증상 표에 "5173 경로로도 probe" 항목 포함

### 6. 검증
- [x] `bun run typecheck` 4/4 통과
- [x] `bun test` 28/28 통과 (기존 15 + 신규 13)
- [x] Vite 5173 기동 + 서버 7357 기동 상태에서 Node WebSocket으로 **브라우저 동일 경로** 재현 (HTTP via 5173, WS via 7357) → 14 이벤트 정상 수신
- [ ] **사용자 검증 잔여**: 실제 Chrome 브라우저에서 Spawn 눌렀을 때 포맷된 라인이 뜨는지 확인

## 참고 링크

- [purpose.md](./purpose.md)
- [design.md](./design.md)
- [reason.md](./reason.md)
- [docs/debug/index.md](../../../debug/index.md)
