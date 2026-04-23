# Design — WS 구독 타이밍 버그 수정

## 영향 범위

- `packages/server/src/session.ts` — SessionManager 내부 구조 변경 (public API 시그니처는 동일하게 유지)
- 신규 테스트 파일 1개
- 문서 1 신설 + AGENTS/CLAUDE/BASIC_RULE 인덱스 갱신
- UI 코드 변경 없음

## 이전 구조 (버그)

```
sessions: Map<repoId, { handle, subscribers: Set<WS>, ... }>
                                 ^
                    ─────────────┘
         subscribers가 session의 속성이라, session이 없으면 구독을 담을 그릇이 없다.
```

`subscribe(repoId, ws)`:
1. `sessions.get(repoId)` → 없음
2. `return;` → **구독 drop, ws는 세션 생성 뒤에도 연결되지 않음**

## 변경 후 구조

```
sessions    : Map<repoId, { handle, lastEventByType }>
subscribers : Map<repoId, Set<WS>>                     ← 독립
```

두 맵은 라이프사이클이 다르다.
- `subscribers`는 WS open/close에 의해서만 변한다.
- `sessions`는 spawn/exit에 의해서만 변한다.

`register`는 handle에 리스너를 달고, 이벤트가 들어올 때마다 `subscribers.get(repoId)`로 **그 시점의** 구독자 목록을 조회해 브로드캐스트한다. 즉, 구독이 세션보다 먼저 존재해도, 나중에 존재하게 되어도, 순서와 무관하게 연결된다.

## 시퀀스 비교

### 사용자가 spawn 먼저 한 경우 (두 구조 모두 OK)

```
POST /spawn → sessions.register(handle)
(이후) WS open → subscribers.set(...add ws), replay lastEventByType
```

### 사용자가 WS 먼저 연 경우 (기존엔 버그, 신규는 OK)

```
WS open   → subscribers.set(repoId, {ws})
POST /spawn → sessions.register(handle) → handle.on('event', e => {
                                            subscribers.get(repoId).forEach(ws => ws.send(e));
                                          })
handle emits → subscribers에 있는 ws들로 브로드캐스트 ✅
```

## 리플레이 전략

`subscribe` 시 현재 세션의 `lastEventByType`을 읽어 타입별로 가장 최근 1건을 재전송한다. 왜 "타입별 최근 1건"인가:
- 늦게 붙은 구독자가 현재 상태(`status`, 마지막 `stdout` 라인 등)를 빠르게 알 수 있다.
- 전체 로그 리플레이는 비용이 커지고, 클라이언트 로그 버퍼 용량과 충돌한다.
- 이 결정은 향후 "세션 영속화" 반복에서 재고될 수 있다 (별도 계획).

## 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| `ws.send()`가 WS가 이미 닫힌 뒤에 호출될 수 있음 | 예외 / 경고 로그 | 현재 Bun의 send는 silently no-op. 운영상 문제 없음을 관찰 후 필요하면 try/catch |
| 이벤트 발행 도중 구독자가 추가/제거되면 `for...of`가 이상하게 동작 | 드물게 이벤트 한 건 누락/중복 | 현재 `Set` iteration은 in-flight 수정에 안전. 추가 방어는 필요 시 도입 |
| 세션이 exit된 후 같은 repoId로 재등록되면 구독자는 유지됨 | 구 세션의 리플레이가 없이 새 세션 이벤트를 받게 됨 | 의도된 동작. 필요 시 추후 "세션 버전" 도입 |

## 테스트 전략

단위 테스트로 다음을 커버:
- subscribe-before-register (회귀 방지의 본목적)
- 리플레이 정확성
- unsubscribe 즉시성
- exit 후 구독자 유지

그리고 **수동 end-to-end**: 실제 서버 + WS + HTTP spawn 시퀀스를 스크립트로 재현해 14 이벤트 + exit 수신 확인. 이 스크립트는 `docs/debug/index.md`의 "4. 서버 단독 — WebSocket" 섹션에 템플릿으로 영구화.

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [reason.md](./reason.md)
- [docs/code-architecture/server.md](../../../code-architecture/server.md)
