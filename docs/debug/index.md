---
name: debug
description: kampanela 디버깅 방법론의 단일 진입점 — 실제 문제를 만났을 때 어디를 어떻게 보는가
last_verified: 2026-04-24
---

# Debug Playbook

kampanela는 여러 런타임(Bun 서버, `claude` 자식 프로세스, Vite 개발 서버, 브라우저 UI)이 WebSocket/HTTP로 묶인 분산 시스템이다. 문제가 생기면 **어느 경계에서 끊어졌는지**를 빠르게 좁히는 게 핵심.

## 기본 원칙

1. **계층을 고립시켜 확인한다.** Core(spawn) → Server(HTTP/WS) → UI(React) 순서로 바깥쪽부터 조여가지 말고, **가장 안쪽**에서 시작해 한 계층씩 위로 확인한다.
2. **로그를 파일로 남긴다.** 백그라운드 프로세스의 stdout을 `/tmp/kampanela-*.log`로 리다이렉트해 나중에 `head/tail`할 수 있게 한다.
3. **각 계층에 단독 probe가 있어야 한다.** UI 없이도 core/server를 확인할 수 있어야 한다.
4. **이미 떠 있는 프로세스를 먼저 잡아낸다.** `lsof -iTCP:7357 -sTCP:LISTEN`로 포트 점유를 확인. 디버깅 중엔 `EADDRINUSE`가 자주 나온다.
5. **재현 케이스를 최소화한다.** UI 흐름 전체를 돌리기 전에, 문제가 일어나는 최소 시퀀스를 스크립트로 고정한다.

## 계층별 probe

### 1. `claude` CLI 자체

가장 먼저 바이너리가 정상인지 확인한다.

```bash
cd /tmp && claude -p --output-format stream-json --verbose --include-partial-messages "echo hi" | head -5
```

- 기대: `{"type":"system","subtype":"init",...}` 류의 JSON 라인이 흘러나오고 `{"type":"result",...}` 이후 exit 0.
- 실패 유형:
  - `command not found`: PATH 문제. kampanela 서버는 `KAMPANELA_CLAUDE_BIN` env로 바이너리 경로를 오버라이드할 수 있다.
  - 인증 오류: `claude` CLI가 로그인되어 있지 않음. 사용자가 직접 로그인해야 함.

### 2. `@kampanela/core` spawn 단독

서버·UI를 거치지 않고 spawn 레이어만 확인.

```bash
mise exec -- bun /tmp/kampanela-spawn-probe.ts
```

probe 스크립트 예시:

```ts
import { spawnClaude } from '/Users/danu/project/kampanela/packages/core/src/spawn/process.ts';
const handle = spawnClaude('probe', '/tmp', { prompt: 'echo hi' });
console.log('pid=', handle.pid);
let n = 0;
handle.on('event', (e) => { n++; console.log('[' + e.type + ']', JSON.stringify(e).slice(0, 200)); });
handle.on('exit', (code) => { console.log('exit=', code, 'events=', n); process.exit(0); });
setTimeout(() => { console.log('TIMEOUT'); handle.stop(); }, 30000);
```

- 기대: 수십~수백 개의 `claude_event` + 한 개의 `status` + 한 개의 `exit`.
- 아무 이벤트도 없이 exit만: 바이너리가 즉시 죽음 → stderr도 같이 출력해 원인 확인.

### 3. 서버 단독 — HTTP

백그라운드로 서버를 띄우고 curl로 엔드포인트 확인.

```bash
mise exec -- bun packages/server/src/index.ts > /tmp/kampanela-server.log 2>&1 &
SERVER_PID=$!
sleep 1

curl -s http://localhost:7357/api/repos
curl -s -X POST http://localhost:7357/api/repos \
  -H "Content-Type: application/json" \
  -d '{"path":"/absolute/path/to/repo"}'

kill $SERVER_PID
cat /tmp/kampanela-server.log
```

- 에러 JSON은 반드시 `{ "error": { "code", "message" } }` 포맷이어야 한다. 아니면 server 에러 매핑(`packages/server/src/http.ts`)에 버그.

### 4. 서버 단독 — WebSocket

spawn 이벤트가 실제 WS로 흐르는지 **UI 없이** 검증. 이건 원래 "UI에서 로그가 안 떠요" 류 버그의 주된 원인을 좁히는 도구다.

```bash
mise exec -- bun -e '
const repoId = "<등록된-repo-id>";
const ws = new WebSocket(`ws://localhost:7357/ws/repos/${repoId}`);
const events = [];

ws.onopen = () => {
  console.log("WS open");
  setTimeout(() => {
    fetch(`http://localhost:7357/api/repos/${repoId}/spawn`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({prompt:"echo hi"}),
    }).then(r => r.json()).then(j => console.log("spawned pid=", j.pid));
  }, 100);
};

ws.onmessage = (e) => {
  const m = JSON.parse(e.data); events.push(m.type);
  if (m.type === "exit") {
    console.log("exit code=", m.code, "events=", events.length);
    console.log("counts:", events.reduce((a,t) => (a[t]=(a[t]||0)+1, a), {}));
    process.exit(0);
  }
};
ws.onclose = (e) => console.log("WS close code=", e.code);
setTimeout(() => { console.log("TIMEOUT events=", events.length); process.exit(1); }, 60000);
'
```

- WS 열림은 되는데 메시지 0: **구독-세션 결합** 문제 가능성 (2026-04-24 수정된 버그, `docs/plan/archive/20260424-fix-ws-subscriber-timing/` 참고).
- 메시지는 오는데 `exit`가 영영 안 옴: spawn은 살아 있거나 `claude`가 입력 대기 중. stdout stream이 닫혔는지 확인.

### 5. Vite 개발 서버 / 브라우저

```bash
mise exec -- bun run --filter @kampanela/ui dev
# 다른 터미널: open http://localhost:5173
```

- UI는 `/api` 와 `/ws`를 Vite 프록시로 `localhost:7357`에 전달 (`packages/ui/vite.config.ts`). 서버가 안 떠 있으면 프록시 오류가 DevTools Network 탭에 뜬다.
- WS 재연결 루프가 과하면 `packages/ui/src/hooks/useRepoLog.ts`의 지수 백오프 한계를 확인.

## 자주 쓰는 진단 명령

```bash
# 포트 7357 누가 쥐고 있는지
lsof -iTCP:7357 -sTCP:LISTEN

# 서버 강제 종료 (정리 안 되는 경우)
lsof -iTCP:7357 -sTCP:LISTEN | awk 'NR>1 {print $2}' | xargs -r kill

# 레지스트리 상태
cat ~/.kampanela/repos.json

# 레지스트리 초기화 (주의: 모든 등록 날라감)
rm ~/.kampanela/repos.json

# 서버 로그 실시간
tail -f /tmp/kampanela-server.log
```

## 증상별 최초 의심 지점

| 증상 | 1차 의심 | 확인 방법 |
|------|---------|---------|
| UI에서 Spawn 눌러도 아무 이벤트 안 뜸 | WS 구독 타이밍, Vite 프록시 | 위 4번 probe |
| Spawn이 즉시 exit | `claude` 인증 or 인자 | 위 1번 직접 실행 |
| 레포 등록이 안 됨 | 경로 검증 (절대경로/디렉토리) | curl 로 POST 재현, 응답 코드 확인 |
| 재시작 후 레지스트리 날아감 | `KAMPANELA_HOME` 오버라이드 잔재 | `env | grep KAMPANELA`, `cat ~/.kampanela/repos.json` |
| `EADDRINUSE` | 이전 서버 프로세스 남음 | lsof + kill |
| 테스트는 통과하는데 UI가 삑남 | 통합 테스트가 커버 못 하는 타이밍/순서 | 위 4번처럼 실제 사용 흐름을 스크립트로 재현 |

## 관련 문서

- [docs/BASIC_RULE.MD](../BASIC_RULE.MD)
- [docs/code-architecture/server.md](../code-architecture/server.md)
- [docs/code-architecture/core.md](../code-architecture/core.md)
- [docs/plan/archive/index.md](../plan/archive/index.md)
