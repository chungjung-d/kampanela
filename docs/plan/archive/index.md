# 완료된 계획

## 정책

- 완료된 계획은 `in-progress` 폴더에서 동일 이름으로 `archive`로 이동한다.
- 이동 시 산출물을 보존하고, 변경 이력은 `purpose.md`, `task.md`, `design.md`, `reason.md` 내에 남긴다.

## 아카이브 레이어

- 각 항목은 다음 형식을 준수한 폴더명으로 보관한다.
  - `{yyyymmdd}-{작업내용 요약}`
- 보관 폴더는 진행 중이었을 때의 최종 상태(결정사항 포함)로 유지한다.

## 완료된 작업 목록

- [20260424-perf-scene-and-log](./20260424-perf-scene-and-log) — 2026-04-24: Axis 2 MVP 직후 체감 렉 두 갈래 해소. 씬의 정적 오브젝트 248→1로 베이크 + 로그 패널을 rAF 단위로 배칭. 부수적으로 RepoList/LogRow를 memo + useCallback으로 안정화.
- [20260424-axis2-phaser-office](./20260424-axis2-phaser-office) — 2026-04-24: Axis 2 MVP. Phaser 3 기반 도트 그래픽 오피스 씬, 등록된 repo당 에이전트 스프라이트 + 말풍선(💭/🔧) + 플로트업 텍스트 + 레포 선택 링. 멀티 repo WS 구독 훅, React ↔ Phaser 브릿지. 실제 픽셀 아트 에셋 교체와 walk 애니메이션은 다음 이터레이션.
- [20260424-fix-vite-ws-proxy](./20260424-fix-vite-ws-proxy) — 2026-04-24: 브라우저에서 Vite `/ws` proxy가 silent로 실패해 PR #3 머지 후에도 로그가 비었던 문제 수정. UI가 WS만 `ws://localhost:7357`로 직접 연결. 함께 `formatAgentEvent`를 도입해 stream-json 잡음을 사람이 읽는 한 줄 요약(🔧 tool_use / 📥 tool_result / ✅ result)으로 변환.
- [20260424-fix-ws-subscriber-timing](./20260424-fix-ws-subscriber-timing) — 2026-04-24: SessionManager 구독자 맵과 세션 맵 분리. WS가 spawn보다 먼저 연결되는 실제 UI 흐름에서 이벤트가 drop되던 버그 수정. docs/debug/ 신설로 계층별 probe 방법론 상설화.
- [20260424-mvp-register-spawn](./20260424-mvp-register-spawn) — 2026-04-24: Axis 1 MVP 완료. Bun workspaces 부트스트랩, shared/core/server/ui 4개 패키지 구현, 레포 등록 + `claude` CLI spawn + WebSocket 이벤트 스트림, typecheck + test + build CI 도입. 사용자 end-to-end 검증은 task.md 7번 잔여.

## 보존 규칙

- `docs/plan/archive`는 실행 기록의 진입점이며, 모든 완료 폴더는 이곳으로만 이동한다.
- 완료 폴더는 삭제하지 않고, 필요 시 과거 항목을 `plan` 인덱스에서 참조한다.
- 새 완료 항목이 생기면 이 문서에 링크를 즉시 등록한다.

## 완료된 항목 등록 규칙

- 완료 항목은 `docs/plan/archive/{yyyymmdd}-{요약}/` 폴더 전체 링크로 등록한다.
- 완료 폴더 내 문서(`purpose.md`, `task.md`, `design.md`, `reason.md`)는 각자 `참고 링크` 항목을 보존한다.
