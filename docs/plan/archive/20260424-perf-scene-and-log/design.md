# Design — UI 성능 개선

## 영향 범위

- `packages/ui/src/phaser/assets.ts` — 백그라운드 프리렌더 추가, 미사용 텍스처 키 제거
- `packages/ui/src/phaser/scenes/OfficeScene.ts` — drawFloor/drawWalls/drawDesks 제거, 단일 이미지로 대체
- `packages/ui/src/hooks/useRepoLog.ts` — rAF 배칭
- `packages/ui/src/components/RepoLogView.tsx` — memo + 스타일 상수화
- `packages/ui/src/components/RepoList.tsx` — memo + 스타일 상수화
- `packages/ui/src/App.tsx` — useCallback 안정화

서버/코어는 변경 없음.

## 씬 오브젝트 수

| | 이전 | 이후 |
|--|-----|-----|
| 바닥 타일 | 192 images | 0 (통합됨) |
| 벽 타일 | ~52 images | 0 (통합됨) |
| 책상 | 4 images | 0 (통합됨) |
| 백그라운드 | 0 | **1 image** |
| 에이전트 (repo당) | 4 obj (ring+body+name+bubble) | 4 obj (변경 없음) |
| 총 정적 오브젝트 | ~248 | **1** |

에이전트·말풍선은 그대로 두고, **정적 요소만 한 장으로 베이크**. 인터랙티브하거나 자주 바뀌는 요소는 여전히 독립 오브젝트.

## 로그 배칭 플로우

```
WS onmessage ────push──▶ pendingRef (배열)
                              │
                              ▼
                       scheduleFlush()
                              │
                              ▼  (rAF — 프레임당 1회)
                       pendingRef 비우고 bufferRef에 합침
                              │
                              ▼
                       setEvents(bufferRef)   ← React 리렌더 1회
```

- 초당 60번 이상 setState가 찍혀도 화면 업데이트는 프레임 한 번으로 수렴.
- `pendingRef`는 이 효과 cleanup 또는 repoId 변경 시 초기화.
- rAF 핸들 추적 → unmount 시 `cancelAnimationFrame`.

## memo 설계

- `LogRow`는 `raw/line/showRaw` 3개 prop. raw.ts의 ts는 이벤트 수신 시점이므로 동일 인덱스면 raw reference도 동일 → memo 효과 제대로.
- `RepoList`는 repos/selectedId/onSelect/onRemove. onSelect는 `setSelectedId`(React가 제공하는 안정 참조), onRemove는 `useCallback`으로 안정화 → memo 재렌더 조건은 "repos/selectedId가 실제로 바뀔 때"만.
- `RegisterForm`은 memo 하지 않음. App의 대부분의 리렌더는 sidebar 밖 RepoLogView에서 오고, RegisterForm 자체는 비쌀 만한 자식이 없음.

## 리스크 / 대응

| 리스크 | 대응 |
|--------|------|
| rAF가 탭 비활성 시 멈춤 → 누적된 이벤트 버스트 플러시 | 복귀 시 한 번의 setEvents로 수렴. 이벤트 드롭 없음 |
| 백그라운드 텍스처가 캔버스 해상도에 고정 | `config.ts`의 CANVAS_W/H가 유일한 해상도 SSoT. 변경 시 재생성 필요. 현재는 고정 |
| memo 실패 (참조 불안정) | App에서 callback 모두 useCallback, 스타일은 모듈 상수. 혹시 새 자식 컴포넌트 추가 시 동일 규칙 유지 필요 |

## 참고 링크

- [purpose.md](./purpose.md)
- [task.md](./task.md)
- [reason.md](./reason.md)
- [docs/code-architecture/ui.md](../../../code-architecture/ui.md)
