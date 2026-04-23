# Task — MVP: 레포 등록 + 단일 Claude Code spawn

## 상태

- 진행률: 0% (착수 전)
- 차단 이슈: 없음

## 작업 단위

### 1. 프로젝트 부트스트랩
- [ ] 루트 `package.json` + `bun.lockb` (workspaces 선언)
- [ ] `tsconfig.base.json` + 패키지별 tsconfig
- [ ] `.gitignore` 최소 버전 (node_modules, dist, .env, ~/.kampanela/* 는 외부)

### 2. packages/shared
- [ ] `src/types/repo.ts` — `RegisteredRepo`, `RegistryFile`
- [ ] `src/types/agent.ts` — `AgentStatus`, `AgentState`, `AgentEvent`
- [ ] `src/index.ts` 배럴 export

### 3. packages/core
- [ ] `src/registry.ts` — `~/.kampanela/repos.json` 읽기/쓰기 (락/원자적 쓰기 고려)
- [ ] `src/spawn.ts` — `spawn(repoId, opts)` → `claude` CLI 자식 프로세스, 이벤트 EventEmitter 반환
- [ ] `src/index.ts` export

### 4. packages/server
- [ ] `Bun.serve` 부트 (포트 설정, CORS 최소 허용)
- [ ] `GET/POST/DELETE /api/repos`
- [ ] `POST /api/repos/:id/spawn`, `POST /api/repos/:id/stop`
- [ ] `WS /ws/repos/:id` — `core` 이벤트 브릿지
- [ ] 에러 응답 스키마 통일

### 5. packages/ui
- [ ] Vite or Bun dev server 설정 (React + TypeScript)
- [ ] 레지스트리 훅 (`useRepos`) — fetch 기반
- [ ] 등록 폼 컴포넌트 (드래그 or 경로 입력)
- [ ] 단일 레포 로그 뷰 (WS 구독 → 텍스트 스트림)

### 6. 검증
- [ ] 로컬에서 `bun run dev` 계열로 server + ui 기동
- [ ] 실제 레포 1개 등록 → spawn → 간단 프롬프트 echo 확인
- [ ] 프로세스 종료 시 exit 이벤트 수신 확인

## 참고 링크

- [docs/code-architecture/index.md](../../../code-architecture/index.md)
- [docs/spec/index.md](../../../spec/index.md)
- [purpose.md](./purpose.md)
- [design.md](./design.md)
- [reason.md](./reason.md)
