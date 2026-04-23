# Purpose — 브라우저에서 WS가 안 열리던 문제 수정 + 사람이 읽을 수 있는 이벤트 포맷

## 왜 필요한지

PR #3에서 서버 측 SessionManager 버그를 고치고 터미널에서 end-to-end 검증을 통과시켰지만, 사용자가 **브라우저에서** 실제로 테스트하면 Spawn 눌러도 로그란이 여전히 비어 있음. 디버깅 결과 **Vite의 WebSocket 프록시(`/ws` + `ws: true`)가 조용히 실패**. HTTP 프록시(`/api`)는 정상, WS만 upgrade 핸드셰이크 실패로 `onopen`이 호출되지 않음.

거기에 더해, 이벤트가 제대로 와도 지금 로그는 원시 stream-json을 그대로 찍기 때문에 사용자가 "에이전트가 뭘 하고 있는지" 한눈에 파악하기 어려움 — Axis 2의 본격적인 시각화(Phaser)로 가기 전에, 현재 HTML 로그도 읽을 수 있는 수준은 만들어야 한다.

## 작업 요약

- **WS 경로**: UI는 `ws://localhost:7357`로 직접 연결. Vite 프록시에서 `/ws` 라우트 제거.
- **환경 변수**: `VITE_WS_BASE`로 서버 WS origin 오버라이드 허용 (기본값 `ws://localhost:7357`).
- **이벤트 포맷터**: `claude_event`의 주요 타입(`tool_use`, `tool_result`, `text content_block_delta`, `result`, `message_start/stop`, `status`)을 한 줄 요약으로 변환. 원시 JSON은 토글로 볼 수 있게.
- **디버그 문서 보강**: Vite WS 프록시의 silent failure를 `docs/debug/index.md`의 "증상별 1차 의심 지점" 표에 추가. Node WS 테스트가 Vite 경로를 탔어야 한다는 교훈도 기록.

## 명시적 비범위

- Phaser 전환 (다음 계획)
- 이벤트 영속화 / 리플레이 (다음 계획)
- 인증 / 멀티유저

## 참고 링크

- [docs/GOAL.MD](../../../GOAL.MD)
- [docs/code-architecture/ui.md](../../../code-architecture/ui.md)
- [docs/debug/index.md](../../../debug/index.md)
- [PR #3 fix reason](../../archive/20260424-fix-ws-subscriber-timing/reason.md)
