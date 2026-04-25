# Reason — UI 성능 개선

## 왜 이 두 축을 먼저 고쳤는가

MVP 체감 렉의 가장 유력한 병목은 (1) **React 리렌더 빈도**와 (2) **씬 정적 오브젝트 수**였다. 한 번의 tool_use 동안 stream-json 델타가 100+개 쏟아지는데, 우리 UI는 그걸 그대로 매번 setState → 리렌더 → DOM 패치로 받아냈다. 동시에 Phaser 씬에는 바닥·벽·책상이 모두 개별 GameObject였다. 둘 다 저사양 기기에서 체감 렉으로 직결.

이 두 개만 고쳐도 비용 대비 체감이 가장 크다. 다른 것(코드 스플릿, 실제 픽셀 아트 에셋)은 "무거운 기능이 있어서"가 아니라 "초기 로딩을 줄이거나 보기 좋게" 만드는 쪽이라 다음 반복.

## 대안 비교

### 로그: rAF 배칭 (채택) vs throttle setTimeout

- throttle(50ms)도 유사한 효과가 있지만, 브라우저 렌더 프레임과 타이밍이 어긋나면 추가 리플로우가 생긴다.
- rAF는 "화면이 실제로 그려지기 직전" 한 번만 수행 → 완벽히 수렴.

### 씬: 단일 텍스처 베이크 (채택) vs TileSprite vs 타일맵 플러그인

- Phaser `TileSprite`는 반복 패턴 배경에 특화되지만, 우리는 벽/책상이 섞여 있어 단일 TileSprite로 표현 불가.
- 타일맵 플러그인은 도입 비용 > 이득 (16×12 고정 크기라 타일맵 특유의 장점 미활용).
- 베이크한 단일 이미지가 가장 단순·빠름.

### memo: 손으로 vs Compiler

- React Compiler 도입이 차후 계획에 있으나 현재는 수동 memo + useCallback으로 충분.

## 보존한 결정들

- **이벤트 저장은 유지**. 스트리밍 델타도 일단 버퍼에 담아두고, "raw JSON" 토글이 off일 때는 렌더 단계에서 `formatAgentEvent`가 null인 건 건너뛴다. 저장 자체를 안 하면 raw 토글의 가치가 없어지고, rAF 배칭이 붙은 이상 저장 비용도 문제 안 됨.
- **MAX_BUFFER 300으로만 하향**. 더 작게 가도 되지만 툴 하나가 남기는 요약 라인이 수십 줄 되는 경우가 있어 사용자 경험을 해치지 않는 선.

## 의심되지만 이번 PR에서 건드리지 않은 것들

- **Phaser 번들 1.7MB**. 초기 로딩 시간이 늦어지는 진짜 원인일 가능성. 런타임 렉과는 별개라 다음 plan에서 lazy-load로 처리 예정.
- **useAllRepoEvents 배칭**. 여러 repo를 동시 구독해도 Phaser 쪽은 scene.pushEvent가 내부 상태만 갱신하고 그림은 게임 루프에서 해결 → 별도 배칭이 큰 효과 없을 것으로 판단. 실측 후 필요하면 보강.
- **RegisterForm memo**. 부모(App)의 리렌더 빈도가 낮아 이득 거의 없음. 오히려 memo 비용만 들 가능성.

## 후속 아이디어

- Phaser 코드 스플릿 (lazy import) → 초기 페인트 개선
- 실제 픽셀 아트 에셋 드롭-인 (pablodelucca/pixel-agents 등)
- 에이전트 스폰 시 입구→자리 walk 애니메이션
- 여러 에이전트 동시 활동 시 플로트업 텍스트 충돌 방지 (스태킹)

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [design.md](./design.md)
- [docs/debug/index.md](../../../debug/index.md)
