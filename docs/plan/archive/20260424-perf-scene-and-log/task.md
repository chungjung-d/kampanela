# Task — UI 성능 개선

## 상태

- 진행률: 100%
- 차단 이슈: 없음

## 작업 단위

### 1. 씬 백그라운드 프리렌더
- [x] `assets.ts`에 `generateOfficeBackground(scene)` 추가 — 바닥 / 벽 / 책상을 한 번의 Graphics로 그려 캔버스 크기 텍스처 `office-bg` 생성
- [x] `scene.make.graphics({}, false)`로 디스플레이 리스트에서 제외 (베이크 전용)
- [x] `OfficeScene.create()`의 `drawFloor/drawWalls/drawDesks` 삭제, `add.image(CX, CY, TEX.officeBg)` 1회 호출
- [x] 사용하지 않게 된 `TEX.floor / wall / desk` 키 제거 (agent/ring/officeBg만 유지)

### 2. 로그 배칭 (rAF)
- [x] `useRepoLog` — WebSocket onmessage는 `pendingRef`에 즉시 push
- [x] `requestAnimationFrame`으로 프레임당 1회 `setEvents` 플러시
- [x] `MAX_BUFFER` 500 → 300
- [x] repoId 변경 / 언마운트 시 rAF 취소 + 버퍼 초기화

### 3. React memo / stable callbacks
- [x] `RepoList`를 `memo` 래핑, 스타일 객체 모듈 상수화
- [x] `RepoLogView`의 `LogRow`를 `memo` 래핑 + 스타일 상수
- [x] `App.tsx`의 `handleRegister`, `handleRemove`를 `useCallback`으로 안정화 → memo의 참조 비교가 실제로 동작

### 4. 검증
- [x] `bun run typecheck` 4/4 통과
- [x] `bun test` 35/35 유지 (성능 변경이라 테스트 수 동일)
- [x] `bunx vite build` OK (번들 크기는 동일 — 다음 plan에서 code-split)
- [ ] **사용자 체감 검증 잔여**: 렉이 체감상 줄었는지, 그리고 렉 원인이 아직 다른 곳에 남아 있는지 피드백 필요

## 참고 링크

- [purpose.md](./purpose.md)
- [design.md](./design.md)
- [reason.md](./reason.md)
