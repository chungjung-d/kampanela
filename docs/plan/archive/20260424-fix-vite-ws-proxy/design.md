# Design — Vite WS 프록시 회피 + 이벤트 포맷터

## 영향 범위

- `packages/ui/src/api/spawn.ts` — WS 경로 계산 변경
- `packages/ui/vite.config.ts` — `/ws` 프록시 제거
- `packages/ui/src/lib/format-event.ts` + 테스트 — 신규
- `packages/ui/src/components/RepoLogView.tsx` — 포맷터 사용 + raw 토글
- `docs/debug/index.md` — Vite WS silent failure 섹션

서버 측 코드는 변경 없음.

## WS 직접 연결 vs 프록시

### 이전 흐름

```
browser ─ http:5173 (Vite) ─┬─ /api/* → proxy → http:7357
                             └─ /ws/*  → proxy(ws:true) → ws:7357   ← ❌ 여기서 silent fail
```

### 변경 후

```
browser ─ http:5173 (Vite) ── /api/* → proxy → http:7357
browser ─ ws:7357 (direct)                                         ← 우회
```

### 결정 근거

- 재현된 bug: `ws: true` 옵션이 Vite dev 서버에서 upgrade 핸드셰이크를 통과시키지 못함 (브라우저 `onopen` 미발생). HTTP는 정상이라 한눈에 원인 찾기 어려움.
- 직접 연결이 갖는 유일한 단점은 "다른 origin이면 브라우저가 Origin 체크"인데, 현재 서버의 Bun.serve는 upgrade 시 origin을 거부하지 않음. CORS도 `*`.
- 프로덕션 시 포트/호스트가 다른 구성은 `VITE_WS_BASE`로 명시적 오버라이드.

## 이벤트 포맷터

### 신호 대비 잡음

`claude -p --output-format stream-json --include-partial-messages`는 한 번의 에이전트 실행에 수십~수백 이벤트를 찍는다. 대부분은 시각적으로 무의미한 델타. 쓸모 있는 순간만 뽑아내야 사람이 "지금 뭘 하고 있는지" 인지 가능.

### 매핑

| 원시 이벤트 | 포맷 (`kind`) | 출력 예 |
|-----|-----|-----|
| `{type:"stdout"}` | `output` | `hi` |
| `{type:"stderr"}` | `error` | `...` |
| `{type:"status", status:"thinking"}` | `status` | `● thinking` |
| `{type:"exit", code:0}` | `info` | `exit code=0` |
| `claude_event system.init` | `info` | `🔌 session 7d7bb39a started` |
| `claude_event system.status` | `status` | `⏳ requesting` |
| `claude_event stream_event *` | null (skip) | — |
| `claude_event rate_limit_event` | null (skip) | — |
| `claude_event assistant`, content=`tool_use` | `action` | `🔧 Bash({"command":"echo hi","description":"Echo hi"})` |
| `claude_event assistant`, content=`text` | `action` | `💬 hi` |
| `claude_event user`, content=`tool_result` | `output` | `📥 hi` |
| `claude_event result` | `result` | `✅ hi` |

### Kind별 컬러 (UI)

- `info` blue (`#8ab4ff`)
- `status` purple (`#b38cff`)
- `action` amber (`#ffd479`)
- `output` green (`#9be29b`)
- `result` bright green (`#4ade80`)
- `error` red (`#ff8080`)

어두운 배경(`#111`)에서 구분 가능한 톤으로 선택. 접근성 대비는 차후 Phaser 단계에서 통합 테마로.

### raw JSON 토글

포맷터가 skip한 이벤트도 디버깅 시 필요하면 볼 수 있도록 체크박스 한 개. 기본 off (사용자는 의미 있는 흐름만 보고 싶을 것).

## 테스트 전략

- 단위: `format-event.test.ts` 13 케이스. 각 claude_event 주요 분기 + 노이즈 skip 확인.
- 통합: `bun run dev:server` + `bun run dev:ui` 기동 후 Node WS probe로 **브라우저와 동일한 URL 조합**(HTTP via 5173, WS via 7357)으로 14 이벤트 수신. 실 브라우저 검증은 사용자 몫 (Chrome DevTools Network/WS 탭으로 trivial 확인).

## 리스크 / 대응

| 리스크 | 대응 |
|--------|------|
| 프로덕션 번들에서 `ws://localhost:7357`가 박제됨 | `VITE_WS_BASE` env로 빌드 시점 오버라이드. docs/stack/index.md에서 설명 보강 예정 |
| 브라우저의 Mixed Content (HTTPS 페이지에서 ws://) | 프로덕션에서는 HTTPS + WSS 전제. 현재는 dev only |
| 새 포맷터가 미래 stream-json 필드 추가에 깨짐 | `null`을 반환하면 UI가 조용히 숨김. raw 토글로 원본 확인 가능. 필드 추가는 보강 plan |

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [reason.md](./reason.md)
- [docs/code-architecture/ui.md](../../../code-architecture/ui.md)
- [docs/debug/index.md](../../../debug/index.md)
