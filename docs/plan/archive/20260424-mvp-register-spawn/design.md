# Design — MVP: 레포 등록 + 단일 Claude Code spawn

## 영향 범위

- 신규 도입: `packages/shared`, `packages/core`, `packages/server`, `packages/ui`
- 외부 부작용: `~/.kampanela/repos.json` 파일 생성/갱신, `claude` CLI 자식 프로세스 기동

## 변경 아키텍처 / 흐름

```
   ┌──────────────┐   HTTP        ┌──────────────┐   EventEmitter    ┌──────────────────┐
   │  packages/ui │ ───────────▶ │ packages/    │ ───────────────▶ │  packages/core   │
   │  (React)     │ ◀─────────── │ server       │ ◀─────────────── │  registry + spawn│
   │              │   WebSocket   │ (Bun)        │                   │                  │
   └──────────────┘               └──────────────┘                   └──────────────────┘
                                         │                                     │
                                         │ fs.read/write                       │ child_process
                                         ▼                                     ▼
                                 ~/.kampanela/repos.json               `claude` CLI (in <repo>)
```

### 등록 시퀀스

1. UI: 사용자가 경로 드래그 / 입력
2. UI: `POST /api/repos { path, name? }`
3. server: `core.registry.add()` 호출 → 파일 잠금 → 원자적 쓰기 → 새 항목 반환
4. UI: 상태 갱신

### Spawn 시퀀스

1. UI: `POST /api/repos/:id/spawn { prompt? }`
2. server: `core.spawn(id, opts)` → EventEmitter 반환 후 세션 맵에 보관
3. server: WS 구독자에게 이벤트 브로드캐스트
4. UI: `/ws/repos/:id` 연결해 로그 렌더

## 핵심 설계 결정

- **세션은 서버 메모리**: MVP에서는 프로세스/이벤트 상태를 server 프로세스 수명에 묶는다. 영속화는 다음 반복.
- **`core`는 순수 라이브러리**: I/O는 호출자(server)가 시작점. `core` 내부에서 직접 HTTP를 알지 않는다.
- **registry 쓰기는 원자적**: `fs.writeFile`을 임시 파일 + rename으로 처리해 중간 크래시 시 깨진 JSON 방지.
- **UI는 MVP에서 HTML 기반 로그**: PixiJS 도입은 다음 계획. 이번 단계는 배관 검증.

## 리스크 및 대안

| 리스크 | 영향 | 대응 |
|--------|------|------|
| `claude` CLI의 stdin/stdout이 기대와 다름 | spawn 흐름 전체 실패 | 초기 spike: 로컬에서 수동으로 `claude` 호출 인자를 실험하여 MVP 범위 고정 |
| 등록 파일 동시성 | JSON 손상 | 파일 락 또는 임시파일+rename |
| 브라우저 → 로컬 서버 CORS | 개발 중 블록 | 서버는 `localhost` 오리진 허용 |
| WS 연결 끊김 복구 | 로그 유실 | MVP에서는 자동 재연결만 구현, 이벤트 리플레이 생략 |

## 참고 링크

- [docs/code-architecture/index.md](../../../code-architecture/index.md)
- [docs/spec/index.md](../../../spec/index.md)
- [purpose.md](./purpose.md)
- [reason.md](./reason.md)
