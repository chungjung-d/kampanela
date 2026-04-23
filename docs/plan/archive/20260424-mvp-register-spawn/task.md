# Task — MVP: 레포 등록 + 단일 Claude Code spawn

## 상태

- 진행률: 100% — 구현 완료, 타입체크/테스트 통과. 실제 `claude` CLI 기동 end-to-end는 사용자 검증 필요.
- 차단 이슈: 없음

## 작업 단위

### 1. 프로젝트 부트스트랩
- [x] 루트 `package.json` + `bun.lock` (workspaces 선언)
- [x] `tsconfig.base.json` (`allowImportingTsExtensions: true`, `noEmit: true`) + 패키지별 tsconfig
- [x] `.gitignore` (node_modules, dist, .env)

### 2. packages/shared
- [x] `src/types/repo.ts` — `RegisteredRepo`, `RegistryFile`
- [x] `src/types/agent.ts` — `AgentStatus`, `AgentState`
- [x] `src/types/event.ts` — `AgentEvent` 유니온
- [x] `src/types/api.ts` — REST/WS DTO
- [x] `src/index.ts` 배럴 export

### 3. packages/core
- [x] `src/paths.ts` — `KAMPANELA_HOME` 오버라이드 지원
- [x] `src/errors.ts` — 타입드 에러 5종
- [x] `src/registry/file.ts` — `Bun.file` + tmp+rename 원자 쓰기
- [x] `src/registry/index.ts` — add/remove/get/require/list
- [x] `src/spawn/events.ts` — stream-json 라인 파서 + status 파생
- [x] `src/spawn/process.ts` — `Bun.spawn` 래퍼 + EventEmitter
- [x] `src/spawn/index.ts` — `spawn(repoId, opts)` (registry 조회 → spawnClaude)
- [x] `src/index.ts` export
- [x] `registry.test.ts` — 6/6 pass

### 4. packages/server
- [x] `src/http.ts` — json/error 헬퍼, CORS, 에러 코드 → HTTP 매핑
- [x] `src/session.ts` — SessionManager (핸들 ↔ 구독자, 최근 이벤트 리플레이)
- [x] `src/routes/repos.ts` — GET/POST/DELETE /api/repos
- [x] `src/routes/spawn.ts` — spawn/stop
- [x] `src/server.ts` — Bun.serve + WS upgrade
- [x] `src/index.ts` — 부트스트랩 (`bun run dev`)
- [x] `server.test.ts` — 5/5 pass

### 5. packages/ui
- [x] `vite.config.ts` + `/api`/`/ws` 프록시
- [x] `index.html` + `src/main.tsx`
- [x] `api/repos.ts`, `api/spawn.ts`
- [x] `hooks/useRepos.ts`, `hooks/useRepoLog.ts` (WS 자동 재연결, 버퍼 캡)
- [x] `components/RegisterForm.tsx` (드래그 + 입력)
- [x] `components/RepoList.tsx`
- [x] `components/RepoLogView.tsx` (spawn/stop 버튼 + 로그 스트림)
- [x] `App.tsx` — 2컬럼 레이아웃
- [x] Vite 프로덕션 빌드 성공 확인

### 6. CI
- [x] `.github/workflows/build.yml` — bun install --frozen-lockfile + typecheck + test
- [x] COMMIT.MD의 커밋 전 검증 절에 bun run typecheck / bun test 명시

### 7. 검증
- [x] `bun run typecheck` 4개 패키지 모두 통과
- [x] `bun test` 11/11 통과
- [x] `bunx vite build` 성공
- [ ] **사용자 검증 잔여**: `bun run dev:server` + `bun run dev:ui` 동시 기동, 브라우저에서 레포 등록, `claude` spawn → 프롬프트 전달 → 로그 스트림 수신 확인

## 참고 링크

- [docs/code-architecture/index.md](../../../code-architecture/index.md)
- [docs/spec/index.md](../../../spec/index.md)
- [purpose.md](./purpose.md)
- [design.md](./design.md)
- [reason.md](./reason.md)
