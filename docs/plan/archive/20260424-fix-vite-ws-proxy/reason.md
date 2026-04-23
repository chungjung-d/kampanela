# Reason — Vite WS proxy 우회 + 포맷터 도입

## 왜 이 PR이 필요했는가

PR #3이 서버 측 SessionManager 버그를 고치고 터미널에서 14 이벤트 수신을 확인했지만, **브라우저에서는 여전히 로그가 비어 있었다**. 원인은 Vite dev 서버의 `/ws` 프록시가 upgrade 단계에서 조용히 실패하는 것. 터미널 검증은 `ws://localhost:7357`에 직접 연결했기 때문에 이 계층을 건너뛰었다 — 그래서 PR #3이 green임에도 사용자는 아무 변화를 못 느꼈다.

직접적인 교훈:
- **UI end-to-end 검증은 브라우저가 타는 경로 그대로** 한 번 더 해야 한다. Vite/Bundler/Proxy 계층을 우회한 테스트는 "서버 코드"를 검증하는 것이지 "사용자가 겪는 흐름"을 검증하는 게 아니다.

## 왜 Vite proxy를 고치려 하지 않고 우회했는가

대안 비교.

### A. Vite proxy 설정 튜닝 (기각)

- `rewrite`, `secure`, `toProxy`, `ignorePath` 등 여러 옵션 조합을 시도해볼 수 있음.
- 과거 버전별 http-proxy 의존성 이슈가 GitHub issue에 다수.
- 고친다 해도 Vite 업그레이드 시 또 깨질 가능성.
- 결론: 시간 낭비. 재발 가능한 곳에 투자 X.

### B. Vite 대신 Bun dev 서버로 UI 서빙 (기각)

- `Bun.serve`가 정적 + HMR까지 담당하면 프록시 문제 자체가 없어짐.
- Vite가 제공하는 React HMR/빠른 빌드 등 이점이 많아 이번 라운드에 Vite를 교체할 근거 부족.
- 결론: 기각 (언젠가 검토할 수는 있음).

### C. UI에서 WS를 서버 origin으로 직접 연결 (채택)

- 프록시가 하는 일이 없어지지만 그게 이 프로젝트에 손해가 아님 (Dev 환경에서 서버와 UI가 모두 로컬).
- 설정 표면이 줄어듦 (`vite.config.ts`에서 /ws 블록 제거).
- `VITE_WS_BASE`로 프로덕션/다른 호스트 구성 명시적 지원.
- 한 줄 설정과 주석만으로 재발 방지 가능.

## 왜 이벤트 포맷터를 같은 PR에 넣었는가

사용자의 최초 불만에는 두 가지가 섞여 있었다.
1. "spawn도 안 되는 듯" — WS 레이어 버그 (바로 위에서 해결)
2. "에이전트가 정확히 뭘 하고 있는지 볼 수 없음" — UX 문제

1번만 고치면 로그란에 stream-json 원시 JSON이 쭉 찍히는데, 이건 "로그가 뜬다"지 "뭘 하는지 보인다"가 아니다. 사용자 관점에서 **체감 가능한 개선**까지 묶어야 "고쳤다"가 성립. Phaser 본격 시각화는 큰 플랜이지만, HTML 레이어에서도 "🔧 Bash(echo hi) / 📥 hi / ✅ hi" 수준은 같은 범위 안에서 충분히 제공 가능.

## 포맷터 설계 결정

- **client-side formatting만 수행**. 서버는 원시 AgentEvent를 그대로 보낸다. 클라이언트가 필터링·요약·강조 담당.
  - 이유: 포맷 정책은 UX와 묶여 있고 앞으로 Phaser/도트 그래픽으로 바뀔 때도 같은 이벤트 스트림 위에서 재구성. 서버를 건드릴수록 변경 비용이 큼.
- **null 반환 = skip**. "보여주지 말아야 할 잡음"(델타, rate_limit)을 명시적으로 걸러냄. 버그로 새 필드가 들어와도 UI는 조용히 무시 → 치명적 실패는 안 남.
- **raw 토글 유지**. 포맷터가 빠뜨린 이벤트도 확인 가능. 디버깅용 안전망.

## 테스트 누락에 대한 자가 회고

PR #2 MVP 테스트가 11/11 "통과"로 보고됐지만:
- `repoWsUrl`에 단위 테스트가 없었다 (함수 로직이 간단하다고 넘겼음).
- UI 경로(Vite proxy 포함)의 E2E 통합 테스트가 없었다.

이번에는:
- `formatAgentEvent` 단위 테스트 13 케이스 추가.
- 브라우저 동일 경로 수동 검증을 `docs/debug/index.md`에 영구화.
- 단, Playwright/실 브라우저 자동화는 비용이 커서 MVP 단계에선 수동 체크로 유지. Phaser 단계에서 그래픽 테스트 도입 여부와 함께 재검토.

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [design.md](./design.md)
- [docs/debug/index.md](../../../debug/index.md)
- [PR #3 archive](../../archive/20260424-fix-ws-subscriber-timing/reason.md)
