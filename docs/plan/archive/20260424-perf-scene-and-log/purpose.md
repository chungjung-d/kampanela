# Purpose — UI 성능 개선: 씬 백그라운드 + 로그 배칭

## 왜 필요한지

PR #5 Axis 2 MVP 브라우저 확인 직후 사용자 피드백: **"너무 느려. 렉도 많이 걸린다."**

Axis 3 진입 전에, 지금 만든 UI가 **한 명의 에이전트가 한 번 돌 때도 버벅이는** 문제를 해결하지 않으면 여러 에이전트·장시간 운영 시 사실상 못 쓴다.

## 진단

코드 읽고 나오는 가장 유력한 병목 세 곳:

### 1. 로그 패널의 state 폭발
`packages/ui/src/hooks/useRepoLog.ts`가 WebSocket 메시지마다 `setEvents(prev => [...prev, data])`. `claude -p --include-partial-messages`는 tool_use 하나에 **스트리밍 델타 100+개**를 보냄. 즉 1초에 수십 번 React 리렌더 + 배열 복사 + pre 태그 하위 노드 재생성.

### 2. 씬 게임 오브젝트 폭증
`OfficeScene.create()`가 `add.image()` 루프로:
- 바닥 16×12 = 192개
- 벽 (위/아래/좌우) ≈ 52개
- 책상 4개
- **총 250개 게임 오브젝트** — 매 프레임 Phaser가 전부 추적. 저사양 기기에서 체감 렉 유발.

### 3. 매 렌더 inline style 객체
`App.tsx`, `RepoLogView.tsx`, `RepoList.tsx`가 모두 매 렌더마다 `{...}` style 객체 신규 생성. React가 reconciliation 시 prop 변경으로 인식해 DOM 재할당. 작은 건이지만 #1과 곱해지면 체감.

## 수정 방향

### 1. 로그 배칭
`useRepoLog`을 **requestAnimationFrame 배칭** 구조로 리팩터. 메시지는 ref에 즉시 push, 화면 업데이트는 프레임당 1회로 합치기. 덤으로 MAX_BUFFER 500 → 300, 스트림 델타는 수신 시점엔 저장하되 raw toggle이 off면 렌더 단계에서 걸러.

### 2. 씬 백그라운드를 단일 텍스처로 프리렌더
바닥 + 벽을 **생성 시점에 한 번** Graphics로 그려 `generateTexture('office-bg', W, H)`, 씬에서 `add.image` 단 1개로 배치. 게임 오브젝트 250 → 5~6개.

### 3. 작은 손질
- `React.memo`로 `RepoList`, `LogRow` 감싸기
- 자주 바뀌지 않는 style 객체는 모듈 레벨 상수로 끌어내기 (readability도 덤)

## 명시적 비범위

- Phaser 코드 스플릿 (지연 로드) — 체감 차이 크면 다음 plan
- Playwright 자동화
- 실제 픽셀 아트 에셋 교체
- Axis 3 Shared Brain

## 참고 링크

- [docs/code-architecture/ui.md](../../../code-architecture/ui.md)
- [docs/debug/index.md](../../../debug/index.md)
