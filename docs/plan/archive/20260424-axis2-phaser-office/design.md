# Design — Axis 2 MVP: Phaser 도트 오피스

## 영향 범위

- `packages/ui/package.json` — `phaser` 의존성 추가
- `packages/ui/src/phaser/` — 신규 디렉토리
- `packages/ui/src/components/OfficeCanvas.tsx` — React에서 Phaser를 감싸는 컴포넌트
- `packages/ui/src/App.tsx` — 레이아웃 재편
- 기존 `RepoLogView`는 "하단 요약 로그"로 축소되어 캔버스 아래 붙음 (완전히 제거하지 않음 — 디버깅/세부 확인용)
- 서버 쪽 변경 없음

## 아키텍처

```
┌────────────────────────────────────────────────────────────┐
│ App.tsx                                                    │
│ ┌──────────────┐ ┌──────────────────────────────────────┐ │
│ │ Sidebar      │ │ OfficeCanvas (React)                 │ │
│ │ - Register   │ │ ┌──────────────────────────────────┐ │ │
│ │ - RepoList   │ │ │ Phaser Scene: OfficeScene        │ │ │
│ │              │ │ │  · tilemap / furniture           │ │ │
│ │              │ │ │  · AgentSprite[] (repo당 1개)    │ │ │
│ │              │ │ │  · 말풍선 / 플로트업              │ │ │
│ │              │ │ └──────────────────────────────────┘ │ │
│ │              │ ├──────────────────────────────────────┤ │
│ │              │ │ BottomLog (축소된 RepoLogView)       │ │
│ │              │ └──────────────────────────────────────┘ │
│ └──────────────┘                                          │
└────────────────────────────────────────────────────────────┘
```

### Data flow

```
WS message (AgentEvent)
    │
    ▼
useRepoLog(selectedRepoId)  ← 기존 훅
    │
    ▼
OfficeController (신규)  ────▶ OfficeScene.apply(event)
    │                            │
    │                            ▼
    │                         AgentSprite.setStatus()
    │                         AgentSprite.moveTo()
    │                         AgentSprite.emote()
    ▼
BottomLog                     Phaser render loop
```

하지만 현재 `useRepoLog`은 **선택된 한 개 repo**만 구독한다. Axis 2에서는 오피스 내 **모든 repo**의 이벤트를 동시에 관찰해야 하므로, 훅을 멀티구독 가능 구조로 확장:
- `useAllRepoEvents(repoIds: string[]): { byRepo: Map<id, AgentEvent[]>, lastEvent: AgentEvent | null }`
- 내부적으로 repoId 당 하나의 WebSocket을 병렬 유지.
- 언마운트/repo 해제 시 해당 소켓만 close.

### 좌표 모델

- 그리드 16×12, 타일 크기 32px → 캔버스 512×384 (CSS 스케일로 화면 채움).
- 책상 4개 하드코드 위치: `{ agentSlot: [(4,4), (10,4), (4,8), (10,8)], facing: 'south' }`.
- 에이전트 자리 배정: 등록된 repo의 인덱스 % slots.length. 5번째부터는 임시로 랜덤 위치에 "떠 있는" 상태 (다음 계획에서 동적 배정).
- pathfinding: MVP는 사실상 "두 점 사이 L자 경로" (BFS 생략). 장애물은 책상만 있고 경계 체크만 하면 충분.

### 에셋

- `OfficeScene.preload()`에서 `public/assets/` 존재 여부 확인 후:
  - 있으면 `load.image('agent-idle', ...)` 등으로 로드.
  - 없으면 `generateTextures()`로 단색 타일/이모지 렌더 (`add.text`로 emoji를 렌더해 `generateTexture`).
- 에셋이 바뀌어도 `AgentSprite`의 public API(`setEmote`, `setWalking`, `moveTo`)는 동일하게 유지.

### 이벤트 → 씬 동작 매핑

| AgentEvent | Scene 동작 |
|------------|-----------|
| status: 'thinking' | 💭 말풍선, `sprite.idle(true)` |
| status: 'tool_running' | 🔧 말풍선, 작은 진동 애니메이션 |
| status: 'idle' / 'stopped' | 말풍선 제거 |
| claude_event assistant.tool_use | `"🔧 Bash"` 플로트업 텍스트 1초 |
| claude_event result | `"✅"` 플로트업 1.5초 |
| exit | 자리로 복귀 + `😌` 말풍선 → 2초 후 제거 |
| (spawn HTTP 응답) | 입구 타일에서 자기 자리까지 walk |

Spawn은 WS 이벤트가 아니므로, `OfficeController`는 `useSpawnCommand`처럼 spawn이 시작된 repoId를 발신. 내부적으로 `POST /spawn` 성공 시 `controller.onSpawnStart(repoId)` 호출.

### 에이전트 클릭 → repo 선택

- `AgentSprite` 컨테이너에 `setInteractive`.
- 클릭 시 React 측 `onSelect(repoId)` 콜백 호출 (브릿지 통해 props로 노출).
- 선택된 에이전트는 노란 링 오버레이.

### React ↔ Phaser 브릿지

- `OfficeCanvas.tsx`가 useRef로 컨테이너 div 보유.
- `useEffect`에서 Phaser `Game` 인스턴스 생성 후 `scene.registry`에 selectedRepoId / onSelect / repos 참조 주입.
- props 변경 시 scene.events.emit('state-update', patch).
- 언마운트 시 `game.destroy(true)`.

## 단계별 마일스톤 (이 PR 안에서 순차 커밋)

1. Phaser 설치 + 빈 씬이 OfficeCanvas에 렌더 (초록 배경 + FPS 텍스트)
2. 타일맵 + 책상 스프라이트 렌더
3. AgentSprite 클래스 + 등록된 repo 수만큼 자리에 배치
4. WS 이벤트 → 말풍선 / 플로트업 반영
5. spawn 시 입구 → 자리 walk, exit 시 복귀
6. 에이전트 클릭 선택, 선택 상태에 링 오버레이
7. BottomLog로 기존 로그뷰 축소 배치

각 마일스톤 별로 typecheck + test 통과 확인.

## 리스크 / 대응

| 리스크 | 대응 |
|--------|------|
| Phaser 번들 크기로 Vite dev 시작 느려짐 | 체감 시 코드 스플릿 검토 (이번 MVP는 그대로) |
| React StrictMode 이중 렌더로 Game이 중복 생성 | `useEffect` cleanup에서 `game.destroy` 확실히 |
| WS 멀티구독으로 서버 부담 증가 | 현재 구독자 수 = repo 수. MVP 규모(수 개)면 문제 없음. 수백 개면 풀링 도입 |
| 이벤트 튀는 타이밍으로 애니메이션 큐 밀림 | `moveTo` 중에 같은 타겟 재호출이면 no-op |
| 에셋이 없으면 못생김 | 주석 + README/docs/reference에 에셋 교체 가이드. 다음 plan에서 실제 픽셀 아트로 교체 |

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [reason.md](./reason.md)
- [docs/code-architecture/ui.md](../../../code-architecture/ui.md)
- [docs/spec/index.md](../../../spec/index.md)
