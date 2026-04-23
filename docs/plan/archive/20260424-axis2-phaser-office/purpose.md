# Purpose — Axis 2 MVP: Phaser 도트 그래픽 오피스

## 왜 필요한지

GOAL.MD의 3축 중 Axis 2(Agent Teams UI — 도트 그래픽 오피스 시각화)가 전혀 구현돼 있지 않음. 사용자 피드백: 현재 HTML 로그는 이벤트가 뜨긴 해도 "에이전트가 뭘 하고 있는지 한눈에 보이지 않는다", 원하는 느낌은 AgentOffice(https://github.com/AjStraworern/agent-office) 스타일의 도트 그래픽 오피스.

Axis 1 + Axis 2 가 연결돼야 비로소 "실제 Claude Code 인스턴스를 시각적으로 관찰한다"는 kampanela의 정체성이 성립. 따라서 Axis 1 회로가 브라우저에서 정상 동작하는 지금이 Axis 2 착수에 가장 좋은 시점.

## 작업 요약

- **Phaser 3** 를 `packages/ui`에 통합. 별도 패키지로 분리하지 않음.
- `@kampanela/ui` 하위에 `src/phaser/` 디렉토리: OfficeScene, AgentSprite, 에셋 로더, React ↔ Phaser 브릿지.
- 기존 RegisterForm / RepoList / RepoLogView 중심의 레이아웃을 "사이드바(등록/목록) + 메인 캔버스(오피스 씬) + 하단 요약 로그" 구조로 재편.
- 등록된 각 repo → 오피스 내 한 개의 에이전트 스프라이트 (고정 "자기 자리" 책상 배정).
- WS 이벤트 → 씬 상태 반영:
  - status idle/thinking/tool_running/stopped → 말풍선 이모지 on/off
  - spawn 시작 → 자리로 걸어가는 애니메이션
  - tool_use / result → 플로트업 텍스트
  - exit → 자리로 복귀 후 idle
- 에이전트 클릭 → 해당 repo를 선택 상태로 (우측 로그 / sidebar 강조).
- 에셋: MVP는 프로그래매틱 (컬러 타일, 이모지). 실제 픽셀 아트는 `packages/ui/public/assets/`에 drop-in 가능한 로더 구조로 준비.

## 명시적 비범위 (다음 계획에서)

- 실제 픽셀 아트 스프라이트 교체 (pablodelucca/pixel-agents, kenney.nl 등)
- 카메라 follow 모드
- 에이전트 간 대화 애니메이션 (kampanela는 실제 Claude 인스턴스라, Axis 3 Shared Brain 전에는 대화가 없음)
- 레이아웃 에디터
- 인증 / 멀티유저

## 참고 링크

- [docs/GOAL.MD](../../../GOAL.MD)
- [docs/code-architecture/ui.md](../../../code-architecture/ui.md)
- [docs/stack/index.md](../../../stack/index.md)
- [docs/spec/index.md](../../../spec/index.md)
- [외부 참고: AgentOffice](https://github.com/AjStraworern/agent-office)
