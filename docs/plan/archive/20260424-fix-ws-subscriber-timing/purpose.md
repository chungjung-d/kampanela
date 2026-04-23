# Purpose — WS 구독 타이밍 버그 수정 + 디버깅 문서 추가

## 왜 필요한지

사용자가 실제 MVP를 돌려봤을 때 "spawn이 안 되고 프론트도 삑나 보인다"고 보고했다. 디버깅 결과, spawn 자체는 정상 동작하지만 **WebSocket 구독 타이밍 버그**로 이벤트가 UI에 도달하지 않아 사용자에게는 "아무 일도 안 일어나는 것"처럼 보였다.

이 버그를 고치지 않으면 Axis 2(시각화) 작업에 들어갈 수 없다 — 데이터가 UI로 못 가는데 그 데이터를 그리는 건 의미가 없다.

또한 비슷한 상황이 재발하면 빠르게 원인을 좁힐 수 있도록 **디버깅 방법론을 docs/debug/에 상설 문서**로 남긴다.

## 버그 원인

`packages/server/src/session.ts`의 `SessionManager.subscribe()`:
```ts
subscribe(repoId, ws) {
  const session = this.sessions.get(repoId);
  if (!session) return;  // ← 세션이 없으면 구독 자체가 기록되지 않음
  session.subscribers.add(ws);
  ...
}
```

사용자 흐름은:
1. UI에서 레포 선택 → `useRepoLog`가 WS 연결
2. UI에서 Spawn 버튼 → HTTP `POST /api/repos/:id/spawn`
3. Server가 `sessions.register(handle)` 호출 → 이때 처음으로 세션 생성

1번 시점엔 세션이 없어 WS 구독이 silently drop된다. 3번에서 새로 만든 세션의 `subscribers`는 빈 상태 → 이후 발생하는 모든 이벤트가 아무 데도 안 간다.

## 작업 요약

- `SessionManager`를 구독자 맵과 세션 맵을 **분리**해, WS가 세션 존재 여부와 무관하게 구독 상태를 유지하도록 리팩터
- 리그레션 테스트 추가: "WS subscribe → spawn → events arrive" 순서가 동작하는지 검증
- `docs/debug/` 신설 — 서버 라이브 띄우기, spawn 단독 probe 스크립트, WS 점검 절차 상설화
- BASIC_RULE/debug/reference에서 필요한 곳에 링크 연결

## 명시적 비범위

- Phaser로 렌더러 전환 (별도 계획)
- Axis 3 Shared Brain (별도 계획)
- 에이전트 시각화 (별도 계획)

## 참고 링크

- [docs/GOAL.MD](../../../GOAL.MD)
- [docs/code-architecture/server.md](../../../code-architecture/server.md)
- [docs/debug/index.md](../../../debug/index.md)
