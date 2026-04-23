# Task — Axis 2 MVP: Phaser 도트 오피스

## 상태

- 진행률: 100% (유저 수동 검증 잔여)
- 차단 이슈: 없음

## 작업 단위

### 1. 의존성 / 세팅
- [x] `packages/ui` 에 `phaser@^3.88.0` 추가 (Phaser 4는 신규 API라 안정성 선호)
- [x] Bun workspaces 상 설치 동작 확인

### 2. `packages/ui/src/phaser/` 디렉토리
- [x] `config.ts` — 그리드/타일/책상 좌표 단일 SSoT
- [x] `assets.ts` — `generateTextures()`로 바닥/벽/책상 렌더, `ensureAgentTexture(color)`로 repoId 기반 컬러 캐릭터, `colorForRepo(id)` 해시→HSV
- [x] `scenes/OfficeScene.ts` — 바닥/벽/책상 드로잉, 에이전트 add/remove, 이벤트 반영, `pushRepos/pushSelected/pushEvent` 버퍼링 API
- [x] `sprites/AgentSprite.ts` — 선택링, 이름 라벨, 말풍선, 플로트업, L자 경로 walk API
- [x] `controller.ts` — `eventToCommands()` 순수 함수로 AgentEvent → SceneCommand

### 3. React ↔ Phaser 브릿지
- [x] `components/OfficeCanvas.tsx` — ref div + Phaser.Game init/destroy, 씬 프로퍼티로 직접 푸시
- [x] `hooks/useAllRepoEvents(repoIds, onEvent)` — repo당 WebSocket 병렬 + 자동 재연결 + 연결 상태

### 4. 이벤트 매핑
- [x] status → 말풍선 (💭/🔧/🤔/❌/😌)
- [x] assistant.tool_use → 🔧 플로트업 (amber)
- [x] result → ✅ 플로트업 (green)
- [x] exit → move-home + stopped
- [x] 비-제로 exit → 빨간 플로트업 `exit N`
- [ ] spawn 시 입구 walk — MVP에서 보류. 시각적 안정화 후 다음 반복에서 추가 (reason.md 참고)

### 5. 레이아웃 재편
- [x] `App.tsx` — 300px sidebar + main(canvas + bottom log)
- [x] `RepoLogView`는 하단 접이식으로 재활용, 선택된 repo의 raw/formatted 로그

### 6. 검증
- [x] `bun run typecheck` 4/4
- [x] `bun test` 35/35 (기존 28 + controller 7)
- [x] `bunx vite build` 번들 성공 (Phaser 포함 1.7MB / gzip 410KB, size 경고는 다음 반복에서 code-split)
- [x] `vite dev` + 서버 동시 기동 → `http://localhost:5173` 정상 응답, `/src/main.tsx` 컴파일, Phaser pre-bundle 정상
- [ ] **사용자 검증 잔여**: 브라우저에서 오피스 씬이 뜨고, 등록된 repo 수만큼 에이전트가 자기 자리에 앉아 있고, Spawn 누르면 💭/🔧 이모지 + 플로트업이 뜨는지 확인

## 참고 링크

- [purpose.md](./purpose.md)
- [design.md](./design.md)
- [reason.md](./reason.md)
