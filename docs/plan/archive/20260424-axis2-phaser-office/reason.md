# Reason — Axis 2 MVP 결정들

## 왜 Phaser인가 (PixiJS 결정 번복)

초기에는 PixiJS로 Axis 2를 계획했으나, AgentOffice 레퍼런스를 본 뒤 재검토에서 Phaser로 교체.

- Phaser = PixiJS 위에 게임 엔진 기능(카메라, 타일맵, Tween, Scene 관리, 입력 시스템)이 얹힌 것.
- kampanela에서 필요한 기능이 정확히 이 레이어들임. PixiJS로 하면 전부 직접 만들어야 함.
- PixiJS 코드는 아직 작성된 게 없었기 때문에 전환 비용은 실질적으로 0.

## 왜 멀티 에이전트(모든 repo)인가

대안: "현재 선택된 repo 1개만 애니메이션" (MVP 축소).

- 축소하면 "오피스"라는 비유가 성립하지 않음. 한 명만 있는 오피스는 비유가 약해짐.
- 멀티구독의 서버 부담은 MVP 사용 규모(수 개)에서 무시 가능.
- spawn이 활발한 레포와 idle 레포가 동시에 보여야 "팀이 돌아가고 있다"는 감각이 생긴다. 이게 Axis 2의 정체성.

## 왜 에셋을 프로그래매틱으로 시작하나

pablodelucca/pixel-agents나 Kenney.nl 같은 MIT/CC0 에셋이 있지만 이번 MVP에 바로 붙이지 않는 이유:

- 에셋 다운로드/라이선스 어트리뷰션/경로 정리가 별도 작업. 묶으면 scope가 커짐.
- "움직임과 상태 매핑" 로직 자체가 동작 안 하면 예쁜 에셋도 무의미.
- 에셋 교체는 `AgentSprite`의 texture key를 바꾸는 것만으로 충분하도록 설계 (의존성 역전).

다음 plan에서 전용으로 에셋 교체 작업 — Attribution 작성, 라이선스 NOTICE, 에셋 매핑 문서.

## 왜 기존 RepoLogView를 제거하지 않는가

시각화가 잘 보여도 텍스트 로그가 필요한 순간이 있다 (tool 실행 결과의 긴 텍스트, 오류 stack trace). BottomLog로 축소하되 완전히 제거하지 않음 — raw 토글은 이미 있으므로 디버깅에도 그대로 유용.

## Phaser + React 브릿지 형태

옵션:
- A. `react-phaser-fiber` 같은 래퍼 — 학습 곡선 + 비표준 도구. 기각.
- B. useRef + Phaser Game 직접 관리 (채택). Scene에서 커스텀 이벤트로 React와 통신. 단순.

## pathfinding을 생략한 이유

- 그리드 16×12에 장애물이 책상 몇 개뿐. A*까지 필요 없음.
- 입구 → 자리 이동은 사실상 "horizontal → vertical" 두 세그먼트. 책상 간 충돌은 자리마다 1칸 통로가 있으므로 없음.
- 장애물이 복잡해지면 그때 `easystarjs`나 자체 BFS 도입.

## 왜 이번 PR에 자동 테스트가 얕은가

Phaser의 씬 로직은 브라우저 canvas에 의존. `bun test`로 커버가 어려움.
- OfficeController 같은 순수 로직부(이벤트 → 씬 명령 변환)는 단위 테스트 가능하므로 추가.
- Scene 자체는 수동 확인 중심. Playwright 도입은 별도 plan.

## 후속 계획 아이디어

- Axis 2.1: 진짜 픽셀 아트 에셋 드롭 인
- Axis 2.2: 카메라 follow 모드 + 인스펙터 패널
- Axis 2.3: 에이전트 레이아웃 에디터 (드래그 드롭)
- Axis 3: Shared Brain 심볼링크 온보딩

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [design.md](./design.md)
- [외부 참고: AgentOffice](https://github.com/AjStraworern/agent-office)
- [외부 참고: pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents)
