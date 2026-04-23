---
name: code-architecture/ui
description: packages/ui — React + Vite Web UI (MVP는 HTML 기반, PixiJS는 다음 계획)
last_verified: 2026-04-24
---

# packages/ui

## 책임

- 브라우저에서 실행되는 React SPA.
- 레포 등록 폼 + 레포 목록 + 선택된 레포의 실시간 로그 뷰.
- 오직 server의 HTTP/WS만 호출. 로컬 FS 직접 접근 X.

## 책임 밖

- PixiJS 도트 그래픽 시각화 — **MVP 범위 밖**. 다음 계획에서 `packages/ui` 하위에 추가.
- 상태 영속화 (localStorage 등) — 필요 시 다음 반복.

## 디렉토리 구조

```
packages/ui/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
└─ src/
   ├─ main.tsx              # React root
   ├─ App.tsx
   ├─ api/
   │  ├─ repos.ts           # fetch 래퍼 (GET/POST/DELETE /api/repos)
   │  └─ spawn.ts           # spawn/stop + WS helper
   ├─ hooks/
   │  ├─ useRepos.ts        # 레포 목록 상태
   │  └─ useRepoLog.ts      # WS 구독, 로그 버퍼
   └─ components/
      ├─ RegisterForm.tsx   # 드래그/입력으로 경로 등록
      ├─ RepoList.tsx
      └─ RepoLogView.tsx    # 선택된 레포의 AgentEvent 스트림
```

## 빌드 / 실행

- `vite dev` — 기본 포트 `5173`. API/WS 프록시로 `http://localhost:7357` 전달.
- `vite build` → `dist/` (정적 산출). 프로덕션 배포 시 `packages/server`에서 서빙할지 별도 정적 호스팅할지는 다음 결정.

## 상태 관리

- MVP에서는 전역 상태 라이브러리 없음 (Zustand/Redux 도입 X). 각 훅 내부 `useState` + 필요 시 `useSyncExternalStore`.
- 서버 데이터 캐시가 복잡해지면 다음 반복에서 도입 여부 판단.

## API 호출 규약

- base URL: `import.meta.env.VITE_API_BASE ?? 'http://localhost:7357'`.
- 에러 응답 (`{ error: { code, message } }`)을 `api/` 래퍼에서 `throw new Error(message)` 로 통일. 코드별 분기는 호출 측에서.

## WS 구독

- 훅 `useRepoLog(repoId)`가 `new WebSocket(${wsBase}/ws/repos/${repoId})` 관리.
- 언마운트 시 `close()`.
- 자동 재연결: 지연 1s → 5s 최대 (MVP 간단 버전).

## 드래그 등록 UX

- `RegisterForm`은 `ondragover`/`ondrop`으로 경로 얻기 시도.
- 브라우저 보안상 파일 드래그는 실제 OS 경로를 노출하지 않을 수 있음 → **경로 입력 필드를 primary, 드래그는 보조**로 둔다.
- 제출 시 `POST /api/repos { path }`.

## 연관 문서

- [index.md](./index.md)
- [conventions.md](./conventions.md)
- [server.md](./server.md)
- [../spec/index.md](../spec/index.md)
